from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    student_id: int
    title: str
    message: Optional[str] = None
    is_read: bool
    notification_type: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    student_id: int
    title: str
    message: Optional[str] = None
    notification_type: Optional[str] = None
