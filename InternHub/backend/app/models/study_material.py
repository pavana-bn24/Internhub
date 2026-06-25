from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class MaterialType(str, enum.Enum):
    PDF = "pdf"
    PPT = "ppt"
    ZIP = "zip"
    VIDEO = "video"
    DOC = "doc"
    OTHER = "other"


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    file_type = Column(SAEnum(MaterialType), default=MaterialType.OTHER, nullable=False)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="study_materials")

    def __repr__(self):
        return f"<StudyMaterial(id={self.id}, title={self.title})>"
