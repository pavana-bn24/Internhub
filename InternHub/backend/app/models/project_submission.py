from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ProjectType(str, enum.Enum):
    IDEA = "idea"
    SYNOPSIS = "synopsis"
    MINI_PROJECT = "mini_project"
    MAJOR_PROJECT = "major_project"
    PPT = "ppt"
    SOURCE_CODE = "source_code"
    DOCUMENTATION = "documentation"


class SubmissionStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProjectSubmission(Base):
    __tablename__ = "project_submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=True, index=True)
    project_type = Column(SAEnum(ProjectType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    status = Column(SAEnum(SubmissionStatus), default=SubmissionStatus.SUBMITTED, nullable=False)
    admin_comments = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    evaluated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    innovation_score = Column(Integer, nullable=True)
    implementation_score = Column(Integer, nullable=True)
    documentation_score = Column(Integer, nullable=True)
    presentation_score = Column(Integer, nullable=True)
    total_score = Column(Integer, nullable=True)
    evaluation_remarks = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    evaluated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("User", foreign_keys=[student_id])
