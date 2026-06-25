from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enrollment import EnrollmentStatus, PaymentStatus


class EnrollmentCreate(BaseModel):
    course_id: int
    transaction_id: Optional[str] = None


class EnrollmentUpdate(BaseModel):
    status: EnrollmentStatus
    admin_comment: Optional[str] = None


class PaymentVerifySchema(BaseModel):
    status: PaymentStatus
    comment: Optional[str] = None


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    status: EnrollmentStatus
    payment_status: PaymentStatus = PaymentStatus.PENDING_VERIFICATION
    payment_amount: Optional[int] = None
    payment_proof: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_date: Optional[datetime] = None
    payment_comment: Optional[str] = None
    admin_comment: Optional[str] = None
    admin_remarks: Optional[str] = None
    internship_id: Optional[str] = None
    applied_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    course: Optional["CourseInfo"] = None
    student: Optional["StudentInfo"] = None

    class Config:
        from_attributes = True


class CourseInfo(BaseModel):
    id: int
    title: str
    company: Optional[str] = None
    duration: Optional[str] = None
    mode: Optional[str] = None
    fee: Optional[int] = None

    class Config:
        from_attributes = True


class StudentInfo(BaseModel):
    id: int
    full_name: str
    email: str
    department: Optional[str] = None
    college: Optional[str] = None

    class Config:
        from_attributes = True
