import os, uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional

from app.core.database import get_db
from app.core.config import logger
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatus, PaymentStatus
from app.models.notification import Notification
from app.models.offer_letter import OfferLetter
from app.models.certificate import Certificate
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, PaymentVerifySchema, EnrollmentResponse

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

UPLOAD_DIR = os.path.join("uploads", "payment_proofs")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[EnrollmentResponse])
def list_enrollments(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    )
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Enrollment.student_id == current_user.id)
    if status_filter:
        query = query.filter(Enrollment.status == status_filter)
    enrollments = query.order_by(Enrollment.applied_at.desc()).offset(skip).limit(limit).all()
    return [EnrollmentResponse.model_validate(e) for e in enrollments]


@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def apply_enrollment(
    course_id: int = Form(...),
    transaction_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already applied for this course",
        )

    ext = os.path.splitext(file.filename or "proof.jpg")[1]
    filename = f"payment_{current_user.id}_{course_id}_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    enrollment = Enrollment(
        student_id=current_user.id,
        course_id=course_id,
        status=EnrollmentStatus.PENDING,
        payment_status=PaymentStatus.PENDING_VERIFICATION,
        payment_amount=course.fee,
        payment_proof=file_path,
        transaction_id=transaction_id,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        notif = Notification(
            student_id=admin.id,
            title="New Payment Request",
            message=f"{current_user.full_name} submitted payment for {course.title}",
            notification_type="payment_submitted",
        )
        db.add(notif)
    db.commit()

    enrollment = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.id == enrollment.id).first()

    logger.info("New enrollment + payment: student %d -> course %d", current_user.id, course_id)
    return EnrollmentResponse.model_validate(enrollment)


@router.patch("/{enrollment_id}/payment", response_model=EnrollmentResponse)
def verify_payment(
    enrollment_id: int,
    data: PaymentVerifySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    enrollment = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.id == enrollment_id).first()

    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    if enrollment.payment_status != PaymentStatus.PENDING_VERIFICATION:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment not pending verification")

    enrollment.payment_status = data.status
    if data.comment:
        enrollment.payment_comment = data.comment
    if data.status == PaymentStatus.VERIFIED:
        enrollment.payment_date = db.query(func.now()).scalar()
    db.commit()
    db.refresh(enrollment)

    msg = "verified" if data.status == PaymentStatus.VERIFIED else "rejected"
    notif = Notification(
        student_id=enrollment.student_id,
        title=f"Payment {msg}",
        message=f"Your payment for {enrollment.course.title} has been {msg}. {data.comment or ''}",
        notification_type=f"payment_{msg}",
    )
    db.add(notif)
    db.commit()

    logger.info("Payment %s for enrollment %d by admin %d", msg, enrollment_id, current_user.id)
    return EnrollmentResponse.model_validate(enrollment)


@router.patch("/{enrollment_id}", response_model=EnrollmentResponse)
def update_enrollment(
    enrollment_id: int,
    data: EnrollmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    enrollment = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.id == enrollment_id).first()

    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    if data.status == EnrollmentStatus.APPROVED and enrollment.payment_status != PaymentStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve enrollment until payment is verified",
        )

    enrollment.status = data.status
    if data.admin_comment:
        enrollment.admin_comment = data.admin_comment

    if data.status == EnrollmentStatus.APPROVED and not enrollment.internship_id:
        year = datetime.now().year
        count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.internship_id.isnot(None),
            Enrollment.internship_id.like(f"INT{year}%"),
        ).scalar() or 0
        enrollment.internship_id = f"INT{year}{count + 1:04d}"

    db.commit()
    db.refresh(enrollment)

    notification = Notification(
        student_id=enrollment.student_id,
        title=f"Enrollment {data.status.value}",
        message=f"Your enrollment for {enrollment.course.title} has been {data.status.value}.",
        notification_type="enrollment",
    )
    db.add(notification)

    if data.status == EnrollmentStatus.APPROVED:
        existing_letter = db.query(OfferLetter).filter(
            OfferLetter.enrollment_id == enrollment_id
        ).first()
        if not existing_letter:
            offer = OfferLetter(
                enrollment_id=enrollment_id,
                student_id=enrollment.student_id,
            )
            db.add(offer)

        existing_cert = db.query(Certificate).filter(
            Certificate.enrollment_id == enrollment_id
        ).first()
        if not existing_cert:
            cert = Certificate(
                enrollment_id=enrollment_id,
                student_id=enrollment.student_id,
            )
            db.add(cert)

    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.error("Failed to update enrollment %d", enrollment_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update enrollment")

    logger.info("Enrollment %d updated to %s", enrollment_id, data.status.value)

    enrollment = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.id == enrollment_id).first()

    return EnrollmentResponse.model_validate(enrollment)


@router.patch("/{enrollment_id}/remarks", response_model=EnrollmentResponse)
def update_enrollment_remarks(
    enrollment_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    enrollment = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    enrollment.admin_remarks = data.get("admin_remarks")
    db.commit()
    db.refresh(enrollment)
    logger.info("Remarks updated for enrollment %d", enrollment_id)
    return EnrollmentResponse.model_validate(enrollment)


@router.get("/my", response_model=List[EnrollmentResponse])
def my_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(
        Enrollment.student_id == current_user.id
    ).order_by(Enrollment.applied_at.desc()).all()
    return [EnrollmentResponse.model_validate(e) for e in enrollments]
