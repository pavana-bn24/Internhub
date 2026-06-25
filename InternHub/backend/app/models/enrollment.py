from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class EnrollmentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PaymentStatus(str, enum.Enum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    status = Column(SAEnum(EnrollmentStatus), default=EnrollmentStatus.PENDING, nullable=False)
    payment_status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING_VERIFICATION, nullable=False)
    payment_amount = Column(Integer, nullable=True)
    payment_proof = Column(String(500), nullable=True)
    transaction_id = Column(String(255), nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    payment_comment = Column(Text, nullable=True)
    admin_comment = Column(Text, nullable=True)
    admin_remarks = Column(Text, nullable=True)
    internship_id = Column(String(50), unique=True, nullable=True, index=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    offer_letter = relationship("OfferLetter", back_populates="enrollment", uselist=False, cascade="all, delete-orphan")
    certificate = relationship("Certificate", back_populates="enrollment", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Enrollment(id={self.id}, student={self.student_id}, status={self.status})>"
