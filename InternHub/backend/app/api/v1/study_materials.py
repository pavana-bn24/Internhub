from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.services.permissions import require_approved_student
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.notification import Notification
from app.models.study_material import StudyMaterial, MaterialType
from app.schemas.study_material import StudyMaterialResponse
from app.utils.file_utils import save_upload_file, remove_file
from app.core.config import logger

router = APIRouter(prefix="/study-materials", tags=["Study Materials"])

UPLOAD_DIR = "uploads/study_materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".zip", ".doc", ".docx", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.get("", response_model=List[StudyMaterialResponse])
def list_materials(
    course_id: int = 0,
    search: str = "",
    file_type: str = "",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(require_approved_student),
):
    query = db.query(StudyMaterial).options(joinedload(StudyMaterial.course))
    if course_id:
        query = query.filter(StudyMaterial.course_id == course_id)
    if search:
        query = query.filter(
            StudyMaterial.title.ilike(f"%{search}%") |
            StudyMaterial.description.ilike(f"%{search}%")
        )
    if file_type:
        query = query.filter(StudyMaterial.file_type == file_type)
    materials = query.order_by(StudyMaterial.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for m in materials:
        r = StudyMaterialResponse.model_validate(m)
        if m.course:
            r.course_title = m.course.title
        result.append(r)
    return result


@router.post("/upload", response_model=StudyMaterialResponse)
async def upload_material(
    course_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    file_path = save_upload_file(file, UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, prefix=f"mat_{course_id}")
    file_size = os.path.getsize(file_path)

    material = StudyMaterial(
        course_id=course_id,
        title=title,
        description=description,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        uploaded_by=current_user.id,
    )
    db.add(material)

    enrolled_students = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.status == EnrollmentStatus.APPROVED,
    ).all()
    for enr in enrolled_students:
        notif = Notification(
            student_id=enr.student_id,
            title=f"New material: {title}",
            message=f"Study material '{title}' added to {course.title}",
            notification_type="material",
        )
        db.add(notif)

    try:
        db.commit()
        db.refresh(material)
    except Exception:
        db.rollback()
        remove_file(file_path)
        logger.error("Failed to save study material to database")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save material")

    logger.info("Study material uploaded: %s (course %d)", title, course_id)

    r = StudyMaterialResponse.model_validate(material)
    r.course_title = course.title
    return r


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    if material.file_path and os.path.exists(material.file_path):
        os.remove(material.file_path)
    db.delete(material)
    db.commit()
