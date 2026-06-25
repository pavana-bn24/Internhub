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
from app.models.offer_letter import OfferLetter
from app.models.notification import Notification
from app.schemas.offer_letter import OfferLetterResponse
from app.utils.file_utils import save_upload_file, remove_file
from app.core.config import logger

router = APIRouter(prefix="/offer-letters", tags=["Offer Letters"])

UPLOAD_DIR = "uploads/offer_letters"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.get("", response_model=List[OfferLetterResponse])
def list_offer_letters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(require_approved_student),
):
    query = db.query(OfferLetter).options(joinedload(OfferLetter.enrollment))
    if current_user.role == UserRole.STUDENT:
        query = query.filter(OfferLetter.student_id == current_user.id)
    letters = query.all()
    return [OfferLetterResponse.model_validate(l) for l in letters]


@router.get("/my", response_model=Optional[OfferLetterResponse])
def my_offer_letter(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    _: User = Depends(require_approved_student),
):
    letter = db.query(OfferLetter).options(
        joinedload(OfferLetter.enrollment)
    ).filter(
        OfferLetter.student_id == current_user.id,
        OfferLetter.is_generated == True,
    ).first()
    if not letter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No offer letter found")
    return OfferLetterResponse.model_validate(letter)


@router.post("/upload", response_model=OfferLetterResponse)
async def upload_offer_letter(
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only upload offer letters for approved enrollments")

    file_path = save_upload_file(file, UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, prefix=f"ol_{enrollment_id}")

    letter = db.query(OfferLetter).filter(OfferLetter.enrollment_id == enrollment_id).first()
    if not letter:
        letter = OfferLetter(
            enrollment_id=enrollment_id,
            student_id=enrollment.student_id,
        )
        db.add(letter)

    letter.file_path = file_path
    letter.is_generated = True
    letter.uploaded_by = current_user.id
    if issue_date:
        letter.issue_date = date.fromisoformat(issue_date)

    notif = Notification(
        student_id=enrollment.student_id,
        title="Offer Letter Available",
        message=f"Your offer letter has been uploaded. You can now download it.",
        notification_type="offer_letter",
    )
    db.add(notif)

    try:
        db.commit()
        db.refresh(letter)
    except Exception:
        db.rollback()
        remove_file(file_path)
        logger.error("Failed to save offer letter for enrollment %d", enrollment_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save offer letter")

    logger.info("Offer letter uploaded for enrollment %d", enrollment_id)
    return OfferLetterResponse.model_validate(letter)


@router.get("/{letter_id}", response_model=OfferLetterResponse)
def get_offer_letter(
    letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(require_approved_student),
):
    letter = db.query(OfferLetter).options(
        joinedload(OfferLetter.enrollment)
    ).filter(OfferLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer letter not found")
    if current_user.role == UserRole.STUDENT and letter.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return OfferLetterResponse.model_validate(letter)
