from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
import os

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.services.permissions import require_approved_student
from app.models.user import User, UserRole
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.certificate import Certificate
from app.models.notification import Notification
from app.schemas.certificate import CertificateResponse, CertificateUpdate
from app.utils.file_utils import save_upload_file, remove_file
from app.core.config import logger

router = APIRouter(prefix="/certificates", tags=["Certificates"])

UPLOAD_DIR = "uploads/certificates"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.get("", response_model=List[CertificateResponse])
def list_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(require_approved_student),
):
    query = db.query(Certificate).options(joinedload(Certificate.enrollment))
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Certificate.student_id == current_user.id)
    certs = query.all()
    return [CertificateResponse.model_validate(c) for c in certs]


@router.get("/my", response_model=Optional[CertificateResponse])
def my_certificate(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    _: User = Depends(require_approved_student),
):
    cert = db.query(Certificate).options(
        joinedload(Certificate.enrollment)
    ).filter(
        Certificate.student_id == current_user.id,
        Certificate.is_issued == True,
    ).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No certificate found")
    return CertificateResponse.model_validate(cert)


@router.post("/upload", response_model=CertificateResponse)
async def upload_certificate(
    enrollment_id: int = Form(...),
    issue_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    if enrollment.status != EnrollmentStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only upload certificates for approved enrollments")

    file_path = save_upload_file(file, UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, prefix=f"cert_{enrollment_id}")

    cert = db.query(Certificate).filter(Certificate.enrollment_id == enrollment_id).first()
    if not cert:
        cert = Certificate(
            enrollment_id=enrollment_id,
            student_id=enrollment.student_id,
        )
        db.add(cert)

    cert.file_path = file_path
    cert.is_approved = True
    cert.uploaded_by = current_user.id
    if issue_date:
        cert.issue_date = date.fromisoformat(issue_date)

    notif = Notification(
        student_id=enrollment.student_id,
        title="Certificate Available",
        message=f"Your internship certificate for {enrollment.course.title} has been uploaded.",
        notification_type="certificate",
    )
    db.add(notif)

    try:
        db.commit()
        db.refresh(cert)
    except Exception:
        db.rollback()
        remove_file(file_path)
        logger.error("Failed to save certificate for enrollment %d", enrollment_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save certificate")

    logger.info("Certificate uploaded for enrollment %d", enrollment_id)
    return CertificateResponse.model_validate(cert)


@router.patch("/{cert_id}", response_model=CertificateResponse)
def update_certificate(
    cert_id: int,
    data: CertificateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    was_issued = cert.is_issued
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cert, key, value)

    if data.is_issued and not cert.issue_date:
        cert.issue_date = date.today()

    if data.is_issued and not was_issued:
        enrollment = db.query(Enrollment).filter(Enrollment.id == cert.enrollment_id).first()
        if enrollment:
            notif = Notification(
                student_id=enrollment.student_id,
                title="Certificate Available",
                message="Your internship certificate has been released. You can now download it.",
                notification_type="certificate",
            )
            db.add(notif)

    db.commit()
    db.refresh(cert)
    return CertificateResponse.model_validate(cert)
