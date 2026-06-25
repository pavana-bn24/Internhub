from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    mode: Optional[str] = "online"
    fee: Optional[int] = 4000
    stipend: Optional[str] = None
    skills_required: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    mode: Optional[str] = None
    fee: Optional[int] = None
    stipend: Optional[str] = None
    skills_required: Optional[str] = None
    is_active: Optional[bool] = None


class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    mode: Optional[str] = None
    fee: Optional[int] = None
    stipend: Optional[str] = None
    skills_required: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
