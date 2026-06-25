from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class OfferLetterResponse(BaseModel):
    id: int
    student_id: int
    enrollment_id: int
    file_path: Optional[str] = None
    issue_date: Optional[date] = None
    is_generated: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OfferLetterUpload(BaseModel):
    enrollment_id: int
    issue_date: Optional[date] = None
