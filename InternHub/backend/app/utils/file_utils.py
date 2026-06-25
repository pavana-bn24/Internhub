import os
import uuid
import shutil
import logging
from fastapi import UploadFile, HTTPException, status
from typing import Set

logger = logging.getLogger(__name__)


def save_upload_file(
    file: UploadFile,
    upload_dir: str,
    allowed_extensions: Set[str],
    max_file_size: int,
    prefix: str = "",
) -> str:
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if not ext or ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size > max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {max_file_size // (1024 * 1024)}MB",
        )

    unique_name = f"{prefix}_{uuid.uuid4().hex}{ext}" if prefix else f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, unique_name)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except OSError as e:
        logger.error("Failed to write uploaded file %s: %s", file_path, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file",
        )

    return file_path


def remove_file(file_path: str) -> None:
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.info("Removed file: %s", file_path)
    except OSError as e:
        logger.warning("Failed to remove file %s: %s", file_path, e)
