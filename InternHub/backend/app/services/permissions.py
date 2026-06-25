from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.enrollment import Enrollment, EnrollmentStatus


def require_approved_student(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Ensures the student has at least one approved enrollment."""
    if current_user.role != UserRole.STUDENT:
        return current_user
    approved = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == EnrollmentStatus.APPROVED,
        )
        .first()
    )
    if not approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Your enrollment requires admin approval to access this resource.",
        )
    return current_user
