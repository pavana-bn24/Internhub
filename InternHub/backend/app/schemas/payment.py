from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enrollment import PaymentStatus


class PaymentSubmit(BaseModel):
    enrollment_id: int


class PaymentVerify(BaseModel):
    status: PaymentStatus
    comment: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    enrollment_id: int
    student_id: int
    student_name: str
    course_title: str
    payment_status: PaymentStatus
    payment_proof: Optional[str] = None
    payment_comment: Optional[str] = None
    course_fee: Optional[int] = None
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
