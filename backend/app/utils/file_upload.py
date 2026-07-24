import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from app.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def save_upload(file: UploadFile, subfolder: str) -> str:
    """
    Uploads a file to Cloudinary under a given subfolder and returns the
    public HTTPS URL. Replaces local disk storage, which does not survive
    Render's ephemeral filesystem across restarts/redeploys.
    """
    result = cloudinary.uploader.upload(
        file.file,
        folder=f"shiftguard/{subfolder}",
        resource_type="auto",  # handles images and PDFs/documents correctly
    )
    return result["secure_url"]


def save_incident_photo(file: UploadFile) -> str:
    return save_upload(file, "incidents")


def save_selfie(file: UploadFile) -> str:
    return save_upload(file, "selfies")


def save_profile_photo(file: UploadFile) -> str:
    return save_upload(file, "profiles")


def save_document(file: UploadFile) -> str:
    return save_upload(file, "documents")