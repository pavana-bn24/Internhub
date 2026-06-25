from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class CertificateResponse(BaseModel):
    id: int
    student_id: int
    enrollment_id: int
    file_path: Optional[str] = None
    issue_date: Optional[date] = None
    is_approved: bool
    is_issued: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CertificateUpdate(BaseModel):
    is_approved: Optional[bool] = None
    is_issued: Optional[bool] = None
