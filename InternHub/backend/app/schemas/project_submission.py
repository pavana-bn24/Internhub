from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProjectSubmissionCreate(BaseModel):
    project_type: str
    title: str
    description: Optional[str] = None


class ProjectSubmissionReview(BaseModel):
    status: str
    admin_comments: Optional[str] = None


class ProjectEvaluationSchema(BaseModel):
    innovation_score: int = Field(..., ge=0, le=10)
    implementation_score: int = Field(..., ge=0, le=10)
    documentation_score: int = Field(..., ge=0, le=10)
    presentation_score: int = Field(..., ge=0, le=10)
    evaluation_remarks: Optional[str] = None


class ProjectSubmissionResponse(BaseModel):
    id: int
    student_id: int
    project_type: str
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    status: str
    admin_comments: Optional[str] = None
    student_name: Optional[str] = None
    innovation_score: Optional[int] = None
    implementation_score: Optional[int] = None
    documentation_score: Optional[int] = None
    presentation_score: Optional[int] = None
    total_score: Optional[int] = None
    evaluation_remarks: Optional[str] = None
    reviewed_by: Optional[int] = None
    evaluated_by: Optional[int] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    evaluated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
