from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.study_material import MaterialType


class StudyMaterialResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    file_type: MaterialType
    file_size: Optional[int] = None
    created_at: Optional[datetime] = None

    course_title: Optional[str] = None

    class Config:
        from_attributes = True
