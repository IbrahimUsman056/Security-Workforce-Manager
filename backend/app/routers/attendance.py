from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from app.database import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.shift_assignment import ShiftAssignment
from app.models.shift import Shift
from app.models.site import Site
from app.models.user import User, UserRole
from app.schemas.attendance import CheckOutRequest, AttendanceRead
from app.core.deps import get_current_user, require_role
from app.services.geofence import is_within_geofence
from app.utils.file_upload import save_selfie
from app.services.access import get_accessible_site_ids

router = APIRouter(prefix="/attendance", tags=["attendance"])

LATE_THRESHOLD_MINUTES = 15
FACE_MATCH_THRESHOLD = 0.6   # face-api.js: LOWER euclidean distance = better match; frontend sends a 0-1 "confidence" score, not raw distance

@router.post("/check-in", response_model=AttendanceRead)
def check_in(
    shift_assignment_id: int = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    face_match_score: float = Form(...),
    selfie: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = db.get(ShiftAssignment, shift_assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Shift assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This assignment does not belong to you")

    shift = db.get(Shift, assignment.shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift assignment not found")

    existing = db.exec(
        select(Attendance).where(Attendance.shift_assignment_id == shift_assignment_id)
    ).first()
    if existing and existing.check_in_time:
        raise HTTPException(status_code=400, detail="Already checked in for this shift")

    site = db.get(Site, shift.site_id)

    within_geofence = is_within_geofence(site.lat, site.lng, lat, lng, site.geofence_radius_m)
    if not within_geofence:
        raise HTTPException(
            status_code=400,
            detail="You are not within the site's geofence radius to check in",
        )

    face_match_passed = face_match_score >= FACE_MATCH_THRESHOLD
    if not face_match_passed:
        raise HTTPException(
            status_code=400,
            detail=f"Face verification failed (match score {face_match_score:.0%}). "
                   f"Please retake your selfie in better lighting and try again.",
        )

    selfie_url = save_selfie(selfie)

    now = datetime.utcnow()
    minutes_late = (now - shift.start_time).total_seconds() / 60
    status_value = AttendanceStatus.LATE if minutes_late > LATE_THRESHOLD_MINUTES else AttendanceStatus.ON_TIME

    if existing:
        existing.check_in_time = now
        existing.check_in_lat = lat
        existing.check_in_lng = lng
        existing.check_in_within_geofence = within_geofence
        existing.selfie_url = selfie_url
        existing.face_match_score = face_match_score
        existing.face_match_passed = face_match_passed
        existing.status = status_value
        attendance = existing
    else:
        attendance = Attendance(
            shift_assignment_id=shift_assignment_id,
            check_in_time=now,
            check_in_lat=lat,
            check_in_lng=lng,
            check_in_within_geofence=within_geofence,
            selfie_url=selfie_url,
            face_match_score=face_match_score,
            face_match_passed=face_match_passed,
            status=status_value,
        )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance

@router.post("/check-out/{shift_assignment_id}", response_model=AttendanceRead)
def check_out(
    shift_assignment_id: int,
    payload: CheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = db.get(ShiftAssignment, shift_assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Shift assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This assignment does not belong to you")

    shift = db.get(Shift, assignment.shift_id)
    if not shift or shift.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Shift assignment not found")

    attendance = db.exec(
        select(Attendance).where(Attendance.shift_assignment_id == shift_assignment_id)
    ).first()
    if not attendance or not attendance.check_in_time:
        raise HTTPException(status_code=400, detail="You must check in before checking out")
    if attendance.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out for this shift")

    now = datetime.utcnow()
    attendance.check_out_time = now
    attendance.check_out_lat = payload.lat
    attendance.check_out_lng = payload.lng

    total_hours = (now - attendance.check_in_time).total_seconds() / 3600
    attendance.total_hours = round(total_hours, 2)

    if now < shift.end_time:
        attendance.status = AttendanceStatus.LEFT_EARLY

    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


@router.get("/", response_model=List[AttendanceRead])
def list_attendance(
    shift_assignment_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR])),
):
    statement = (
        select(Attendance)
        .join(ShiftAssignment, Attendance.shift_assignment_id == ShiftAssignment.id)
        .join(Shift, ShiftAssignment.shift_id == Shift.id)
        .where(Shift.organization_id == current_user.organization_id)
    )
    if current_user.role == UserRole.SUPERVISOR:
        site_ids = get_accessible_site_ids(db, current_user)
        statement = statement.where(Shift.site_id.in_(site_ids))
    if shift_assignment_id:
        statement = statement.where(Attendance.shift_assignment_id == shift_assignment_id)
    return db.exec(statement).all()


@router.get("/my-attendance", response_model=List[AttendanceRead])
def my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(Attendance)
        .join(ShiftAssignment, Attendance.shift_assignment_id == ShiftAssignment.id)
        .where(ShiftAssignment.user_id == current_user.id)
    )
    return db.exec(statement).all()