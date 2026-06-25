import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.enrollment import Enrollment, PaymentStatus
from app.models.notification import Notification
from app.schemas.payment import PaymentVerify, PaymentResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/info")
def payment_info():
    from app.core.config import settings
    return {
        "upi_id": settings.UPI_ID,
        "upi_holder": settings.UPI_HOLDER,
    }


@router.get("")
def list_payments(
    status_filter: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    query = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.payment_status != PaymentStatus.PENDING_VERIFICATION)
    if status_filter:
        query = query.filter(Enrollment.payment_status == PaymentStatus(status_filter))
    results = query.order_by(Enrollment.updated_at.desc()).all()

    return [
        {
            "id": e.id,
            "enrollment_id": e.id,
            "student_id": e.student_id,
            "student_name": e.student.full_name if e.student else "Unknown",
            "course_title": e.course.title if e.course else "Unknown",
            "payment_status": e.payment_status.value,
            "payment_amount": e.payment_amount,
            "payment_proof": e.payment_proof,
            "transaction_id": e.transaction_id,
            "payment_comment": e.payment_comment,
            "course_fee": e.course.fee if e.course else None,
            "submitted_at": e.updated_at.isoformat() if e.updated_at else None,
        }
        for e in results
    ]


@router.get("/my")
def my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.course),
    ).filter(
        Enrollment.student_id == current_user.id,
    ).order_by(Enrollment.updated_at.desc()).all()

    return [
        {
            "id": e.id,
            "enrollment_id": e.id,
            "student_id": e.student_id,
            "student_name": current_user.full_name,
            "course_title": e.course.title if e.course else "Unknown",
            "payment_status": e.payment_status.value,
            "payment_amount": e.payment_amount,
            "payment_proof": e.payment_proof,
            "transaction_id": e.transaction_id,
            "payment_comment": e.payment_comment,
            "course_fee": e.course.fee if e.course else None,
            "submitted_at": e.updated_at.isoformat() if e.updated_at else None,
        }
        for e in enrollments
    ]
