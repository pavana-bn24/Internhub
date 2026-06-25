from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.services.permissions import require_approved_student
from app.models.user import User, UserRole
from app.models.project_submission import ProjectSubmission, ProjectType, SubmissionStatus
from app.models.notification import Notification
from app.schemas.project_submission import ProjectSubmissionReview, ProjectEvaluationSchema, ProjectSubmissionResponse
from app.utils.file_utils import save_upload_file, remove_file
from app.core.config import logger

router = APIRouter(prefix="/project-submissions", tags=["Project Submissions"])

UPLOAD_DIR = "uploads/project_submissions"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".rar", ".py", ".java", ".js", ".ts", ".html", ".css"}
MAX_FILE_SIZE = 50 * 1024 * 1024


@router.get("", response_model=List[ProjectSubmissionResponse])
def list_submissions(
    project_type: str = "",
    status_filter: str = "",
    search: str = "",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ProjectSubmission).options(joinedload(ProjectSubmission.student))
    if current_user.role == UserRole.STUDENT:
        query = query.filter(ProjectSubmission.student_id == current_user.id)
    if project_type:
        query = query.filter(ProjectSubmission.project_type == project_type)
    if status_filter:
        query = query.filter(ProjectSubmission.status == status_filter)
    if search:
        query = query.filter(
            ProjectSubmission.title.ilike(f"%{search}%") |
            ProjectSubmission.student.has(User.full_name.ilike(f"%{search}%"))
        )
    submissions = query.order_by(ProjectSubmission.submitted_at.desc()).offset(skip).limit(limit).all()
    result = []
    for s in submissions:
        r = ProjectSubmissionResponse.model_validate(s)
        r.student_name = s.student.full_name if s.student else None
        result.append(r)
    return result


@router.post("/upload", response_model=ProjectSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def upload_submission(
    project_type: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_student),
):
    valid_types = [t.value for t in ProjectType]
    if project_type not in valid_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid project type. Must be one of: {', '.join(valid_types)}")

    file_path = save_upload_file(file, UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, prefix=f"sub_{current_user.id}")

    existing = db.query(ProjectSubmission).filter(
        ProjectSubmission.student_id == current_user.id,
        ProjectSubmission.project_type == project_type,
        ProjectSubmission.title == title,
    ).first()

    if existing:
        if existing.file_path and os.path.exists(existing.file_path):
            os.remove(existing.file_path)
        existing.file_path = file_path
        existing.status = SubmissionStatus.SUBMITTED
        existing.admin_comments = None
        existing.reviewed_by = None
        existing.reviewed_at = None
        submission = existing
    else:
        submission = ProjectSubmission(
            student_id=current_user.id,
            project_type=project_type,
            title=title,
            description=description,
            file_path=file_path,
            status=SubmissionStatus.SUBMITTED,
        )
        db.add(submission)

    try:
        db.commit()
        db.refresh(submission)
    except Exception:
        db.rollback()
        remove_file(file_path)
        logger.error("Failed to save project submission for student %d", current_user.id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save submission")

    logger.info("Project submission uploaded: %s by student %d", title, current_user.id)
    r = ProjectSubmissionResponse.model_validate(submission)
    r.student_name = current_user.full_name
    return r


@router.patch("/{submission_id}", response_model=ProjectSubmissionResponse)
def review_submission(
    submission_id: int,
    data: ProjectSubmissionReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    submission = db.query(ProjectSubmission).options(
        joinedload(ProjectSubmission.student)
    ).filter(ProjectSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    submission.status = data.status
    if data.admin_comments:
        submission.admin_comments = data.admin_comments
    submission.reviewed_by = current_user.id

    from datetime import datetime, timezone
    submission.reviewed_at = datetime.now(timezone.utc)

    notif = Notification(
        student_id=submission.student_id,
        title=f"Project {data.status.replace('_', ' ').title()}",
        message=f"Your project '{submission.title}' has been {data.status}. {data.admin_comments or ''}",
        notification_type=f"project_{data.status}",
    )
    db.add(notif)

    try:
        db.commit()
        db.refresh(submission)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update submission")

    logger.info("Submission %d reviewed as %s by admin %d", submission_id, data.status, current_user.id)
    r = ProjectSubmissionResponse.model_validate(submission)
    r.student_name = submission.student.full_name if submission.student else None
    return r


@router.patch("/{submission_id}/evaluate", response_model=ProjectSubmissionResponse)
def evaluate_submission(
    submission_id: int,
    data: ProjectEvaluationSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    submission = db.query(ProjectSubmission).options(
        joinedload(ProjectSubmission.student)
    ).filter(ProjectSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    submission.innovation_score = data.innovation_score
    submission.implementation_score = data.implementation_score
    submission.documentation_score = data.documentation_score
    submission.presentation_score = data.presentation_score
    submission.total_score = (
        data.innovation_score + data.implementation_score + data.documentation_score + data.presentation_score
    )
    submission.evaluation_remarks = data.evaluation_remarks
    submission.evaluated_by = current_user.id
    submission.evaluated_at = datetime.now(timezone.utc)

    notif = Notification(
        student_id=submission.student_id,
        title="Project Evaluated",
        message=f"Your project '{submission.title}' has been evaluated. Score: {submission.total_score}/40",
        notification_type="project_evaluated",
    )
    db.add(notif)

    try:
        db.commit()
        db.refresh(submission)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to evaluate submission")

    logger.info("Submission %d evaluated by admin %d with score %d/40", submission_id, current_user.id, submission.total_score)
    r = ProjectSubmissionResponse.model_validate(submission)
    r.student_name = submission.student.full_name if submission.student else None
    return r


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = db.query(ProjectSubmission).filter(ProjectSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if current_user.role == UserRole.STUDENT and submission.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if submission.file_path and os.path.exists(submission.file_path):
        os.remove(submission.file_path)
    db.delete(submission)
    db.commit()
