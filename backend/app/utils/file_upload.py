import os
import uuid
from fastapi import UploadFile

def save_upload(file: UploadFile, subfolder: str) -> str:
    upload_dir = f"uploads/{subfolder}"
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        content = file.file.read()
        f.write(content)

    return filepath


def save_incident_photo(file: UploadFile) -> str:
    return save_upload(file, "incidents")


def save_selfie(file: UploadFile) -> str:
    return save_upload(file, "selfies")


def save_profile_photo(file: UploadFile) -> str:
    return save_upload(file, "profiles")


def save_document(file: UploadFile) -> str:
    return save_upload(file, "documents")