from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.study_material import StudyMaterial
from app.models.certificate import Certificate
from pydantic import BaseModel
from typing import Optional


class SearchResult(BaseModel):
    type: str
    id: int
    title: str
    subtitle: Optional[str] = None
    link: str


router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=List[SearchResult])
def global_search(
    q: str = Query("", min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = []

    if current_user.role == UserRole.STUDENT:
        courses = (
            db.query(Course)
            .filter(Course.is_active == True, Course.title.ilike(f"%{q}%"))
            .limit(10)
            .all()
        )
        for c in courses:
            results.append(SearchResult(
                type="course", id=c.id, title=c.title,
                subtitle=c.company, link="/student/enrollments/browse",
            ))

        my_enrs = (
            db.query(Enrollment)
            .options(joinedload(Enrollment.course))
            .filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course.has(Course.title.ilike(f"%{q}%")),
            )
            .limit(10)
            .all()
        )
        for e in my_enrs:
            results.append(SearchResult(
                type="enrollment", id=e.id,
                title=e.course.title if e.course else "Course",
                subtitle=f"Status: {e.status.value}",
                link="/student/enrollments",
            ))

        materials = (
            db.query(StudyMaterial)
            .options(joinedload(StudyMaterial.course))
            .filter(StudyMaterial.title.ilike(f"%{q}%"))
            .limit(10)
            .all()
        )
        for m in materials:
            results.append(SearchResult(
                type="material", id=m.id, title=m.title,
                subtitle=m.course.title if m.course else None,
                link="/student/materials",
            ))

        certs = (
            db.query(Certificate)
            .options(joinedload(Certificate.enrollment))
            .join(Enrollment)
            .filter(
                Enrollment.student_id == current_user.id,
                Certificate.is_issued == True,
            )
            .limit(10)
            .all()
        )
        for c in certs:
            results.append(SearchResult(
                type="certificate", id=c.id,
                title=f"Certificate #{c.id}",
                subtitle=c.issue_date.isoformat() if c.issue_date else None,
                link="/student/certificate",
            ))

    else:
        courses = db.query(Course).filter(Course.title.ilike(f"%{q}%")).limit(10).all()
        for c in courses:
            results.append(SearchResult(
                type="course", id=c.id, title=c.title,
                subtitle=c.company, link="/admin/courses",
            ))

        enrollments = (
            db.query(Enrollment)
            .options(joinedload(Enrollment.student), joinedload(Enrollment.course))
            .filter(Enrollment.student.has(User.full_name.ilike(f"%{q}%")))
            .limit(10)
            .all()
        )
        for e in enrollments:
            results.append(SearchResult(
                type="enrollment", id=e.id,
                title=f"{e.student.full_name if e.student else '?'} - {e.course.title if e.course else '?'}",
                subtitle=f"Status: {e.status.value}",
                link="/admin/enrollments",
            ))

    return results
