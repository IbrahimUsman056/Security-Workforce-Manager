import { useState, useRef } from 'react';
import { useGetMyShiftsQuery } from './assignmentsApi';
import { useCheckInMutation, useCheckOutMutation, useGetMyAttendanceQuery } from '../attendance/attendanceApi';
import { useGetMyProfileQuery } from '../profile/profileApi';
import { compareFaces, loadFaceModels } from '../../utils/faceRecognition';
import { formatDateTime } from '../../utils/dateHelpers';

// Corporate Theme Definitions
const theme = {
  bg: '#ffffff',
  textMain: '#0f1729',
  textMuted: '#64748b',
  primary: '#991b1b',
  primaryHover: '#7f1d1d',
  border: '#e2e8f0',
  cardBg: '#f8fafc',
  accentSuccess: '#15803d',
  accentSuccessBg: '#f0fdf4',
  accentWarning: '#b45309',
  accentWarningBg: '#fefce8',
};

export default function MyShiftsPage() {
  const { data: assignments, isLoading } = useGetMyShiftsQuery();
  const { data: attendanceRecords } = useGetMyAttendanceQuery();
  const { data: profile } = useGetMyProfileQuery();
  const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const [liveScore, setLiveScore] = useState(null);

  const getAttendance = (assignmentId) => attendanceRecords?.find((a) => a.shift_assignment_id === assignmentId);

  const getLocation = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err)
      );
    });

  const startCamera = async (assignmentId) => {
    setActiveCheckIn(assignmentId);
    setLiveScore(null);
    setStatusMsg('Loading face verification models...');
    setProcessing(true);
    await loadFaceModels();
    setProcessing(false);
    setStatusMsg('');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setStreamActive(true);
    }
  };

  const captureAndCheckIn = async (assignmentId) => {
    setProcessing(true);
    setLiveScore(null);
    try {
      setStatusMsg('Capturing photo...');
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
      const selfieFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      if (!profile?.profile_photo_url) {
        setStatusMsg('You must upload a profile photo before you can check in.');
        setProcessing(false);
        return;
      }

      setStatusMsg('Comparing face to profile photo...');
      const profileImg = new Image();
      profileImg.src = profile.profile_photo_url;
      profileImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => { profileImg.onload = resolve; profileImg.onerror = resolve; });

      const selfieImg = new Image();
      selfieImg.src = URL.createObjectURL(blob);
      await new Promise((resolve) => { selfieImg.onload = resolve; });

      const result = await compareFaces(profileImg, selfieImg);

      if (result.error) {
        setLiveScore(null);
        setStatusMsg(`Face verification failed: ${result.error}. Please try again with better lighting.`);
        setProcessing(false);
        return;
      }

      const faceMatchScore = result.score;
      setLiveScore(faceMatchScore);
      setStatusMsg(`Face match: ${(faceMatchScore * 100).toFixed(0)}%`);

      setStatusMsg((prev) => `${prev} — Getting location...`);
      const { lat, lng } = await getLocation();

      const fd = new FormData();
      fd.append('shift_assignment_id', assignmentId);
      fd.append('lat', lat);
      fd.append('lng', lng);
      fd.append('face_match_score', faceMatchScore);
      fd.append('selfie', selfieFile);

      setStatusMsg('Submitting check-in...');
      await checkIn(fd).unwrap();

      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      setStreamActive(false);
      setActiveCheckIn(null);
      setStatusMsg('Checked in successfully!');
    } catch (err) {
      setStatusMsg(err?.data?.detail || err.message || 'Check-in failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async (assignmentId) => {
    try {
      const { lat, lng } = await getLocation();
      await checkOut({ shiftAssignmentId: assignmentId, lat, lng }).unwrap();
      alert('Checked out successfully');
    } catch (err) {
      alert(err?.data?.detail || err.message || 'Check-out failed');
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 16px',
          textAlign: 'center',
          color: theme.textMuted,
          fontSize: '14px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        Loading your shifts...
      </div>
    );
  }

  if (!profile?.profile_photo_url) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 16px',
          backgroundColor: theme.bg,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          color: theme.textMain,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginBottom: '20px',
            borderBottom: `2px solid ${theme.primary}`,
            paddingBottom: '10px',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: theme.textMain, margin: 0, letterSpacing: '-0.5px' }}>
            My Shifts
          </h2>
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: theme.accentWarningBg,
            border: `1px solid ${theme.accentWarning}`,
            borderRadius: '8px',
            color: theme.accentWarning,
            fontSize: '14px',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span>
            You need to set up your profile photo before you can check in. Please navigate to <strong>"My Profile"</strong> first to upload your photo.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px',
        backgroundColor: theme.bg,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: theme.textMain,
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* Dynamic Keyframe Animations for Loading Spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid ${theme.border};
          border-top-color: ${theme.primary};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          marginBottom: '20px',
          borderBottom: `2px solid ${theme.primary}`,
          paddingBottom: '8px',
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: theme.textMain,
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          My Shifts
        </h2>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: theme.textMuted,
          }}
        >
          View assigned shifts, complete biometric face check-in, and log attendance
        </p>
      </div>

      {/* Status Message / Notification Bar */}
      {statusMsg && (
        <div
          className="card"
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: theme.textMain,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {processing && <span className="spinner" />}
          <span style={{ flex: '1' }}>{statusMsg}</span>
          {liveScore !== null && (
            <strong
              style={{
                color: liveScore >= 0.6 ? theme.accentSuccess : theme.accentWarning,
                padding: '2px 8px',
                backgroundColor: liveScore >= 0.6 ? theme.accentSuccessBg : theme.accentWarningBg,
                borderRadius: '4px',
                border: `1px solid ${liveScore >= 0.6 ? '#bbf7d0' : '#fef08a'}`,
                fontSize: '12px',
              }}
            >
              {(liveScore * 100).toFixed(0)}% {liveScore >= 0.6 ? '✅' : '⚠️'}
            </strong>
          )}
        </div>
      )}

      {/* Shift Assignments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {assignments?.map((a) => {
          const attendance = getAttendance(a.id);
          return (
            <div
              key={a.id}
              className="card"
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                padding: '18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Assignment Title & Badges */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '10px',
                }}
              >
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: theme.textMain }}>
                    Assignment #{a.id}
                  </span>
                  <span style={{ fontSize: '13px', color: theme.textMuted, marginLeft: '8px' }}>
                    (Shift #{a.shift_id})
                  </span>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#ffffff',
                    border: `1px solid ${theme.border}`,
                    color: theme.textMain,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {a.status}
                </span>
              </div>

              {/* Checked In Status Info */}
              {attendance?.check_in_time && (
                <div style={{ fontSize: '13px', color: theme.textMain, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', color: theme.accentSuccess }}>✓ Checked in:</span>
                    <span>{formatDateTime(attendance.check_in_time)}</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        backgroundColor: '#ffffff',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: theme.textMuted,
                      }}
                    >
                      {attendance.status}
                    </span>
                  </div>

                  {attendance.face_match_score !== null && (
                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>
                      Face Match Score: <strong>{(attendance.face_match_score * 100).toFixed(0)}%</strong>{' '}
                      {attendance.face_match_passed ? '✅ Passed' : '⚠️ Flagged'}
                    </div>
                  )}
                </div>
              )}

              {/* Checked Out Status Info */}
              {attendance?.check_out_time && (
                <div style={{ fontSize: '13px', color: theme.textMuted }}>
                  <span style={{ fontWeight: '600', color: theme.textMain }}>Checked out:</span>{' '}
                  {formatDateTime(attendance.check_out_time)} — <strong>{attendance.total_hours} hrs</strong> logged
                </div>
              )}

              {/* Start Check-In Button */}
              {!attendance?.check_in_time && activeCheckIn !== a.id && (
                <div>
                  <button
                    disabled={checkingIn}
                    onClick={() => startCamera(a.id)}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: theme.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: checkingIn ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s ease',
                      minHeight: '40px',
                    }}
                    onMouseOver={(e) => {
                      if (!checkingIn) e.currentTarget.style.backgroundColor = theme.primaryHover;
                    }}
                    onMouseOut={(e) => {
                      if (!checkingIn) e.currentTarget.style.backgroundColor = theme.primary;
                    }}
                  >
                    Start Check-In
                  </button>
                </div>
              )}

              {/* Live Camera Viewfinder Container */}
              {activeCheckIn === a.id && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '14px',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '360px',
                      backgroundColor: '#000000',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: streamActive ? 'block' : 'none',
                      position: 'relative',
                    }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  </div>

                  {streamActive && (
                    <button
                      onClick={() => captureAndCheckIn(a.id)}
                      disabled={processing || checkingIn}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: processing || checkingIn ? '#94a3b8' : theme.primary,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: processing || checkingIn ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s ease',
                        minHeight: '40px',
                      }}
                      onMouseOver={(e) => {
                        if (!processing && !checkingIn) e.currentTarget.style.backgroundColor = theme.primaryHover;
                      }}
                      onMouseOut={(e) => {
                        if (!processing && !checkingIn) e.currentTarget.style.backgroundColor = theme.primary;
                      }}
                    >
                      {processing ? 'Processing Verification...' : 'Capture & Check In'}
                    </button>
                  )}
                </div>
              )}

              {/* Check Out Button */}
              {attendance?.check_in_time && !attendance?.check_out_time && (
                <div>
                  <button
                    disabled={checkingOut}
                    onClick={() => handleCheckOut(a.id)}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#ffffff',
                      color: theme.primary,
                      border: `1px solid ${theme.primary}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: checkingOut ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '40px',
                    }}
                    onMouseOver={(e) => {
                      if (!checkingOut) {
                        e.currentTarget.style.backgroundColor = theme.primary;
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!checkingOut) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.color = theme.primary;
                      }
                    }}
                  >
                    {checkingOut ? 'Checking out...' : 'Check Out'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}