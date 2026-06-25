from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    company = Column(String(255), nullable=True)
    duration = Column(String(100), nullable=True)
    mode = Column(String(50), default="online")
    fee = Column(Integer, default=4000, nullable=False)
    stipend = Column(String(100), nullable=True)
    skills_required = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    study_materials = relationship("StudyMaterial", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course(id={self.id}, title={self.title})>"
