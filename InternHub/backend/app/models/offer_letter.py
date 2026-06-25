from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class OfferLetter(Base):
    __tablename__ = "offer_letters"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False, unique=True, index=True)
    file_path = Column(String(500), nullable=True)
    issue_date = Column(Date, nullable=True)
    is_generated = Column(Boolean, default=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    enrollment = relationship("Enrollment", back_populates="offer_letter")

    def __repr__(self):
        return f"<OfferLetter(id={self.id}, enrollment={self.enrollment_id})>"
