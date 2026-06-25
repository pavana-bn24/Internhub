from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LEAVE = "leave"
    HOLIDAY = "holiday"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="attendance_records", foreign_keys=[student_id])

    def __repr__(self):
        return f"<Attendance(id={self.id}, student={self.student_id}, date={self.date})>"
