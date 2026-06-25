from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.attendance import AttendanceStatus


class AttendanceCreate(BaseModel):
    student_id: int
    course_id: int
    date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None


class AttendanceBulkCreate(BaseModel):
    records: list[AttendanceCreate]


class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    date: date
    status: AttendanceStatus
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    total: int
    present: int
    absent: int
    leave: int
    percentage: float
