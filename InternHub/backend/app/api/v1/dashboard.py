from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatus, PaymentStatus
from app.models.attendance import Attendance
from app.models.offer_letter import OfferLetter
from app.models.certificate import Certificate
from app.models.study_material import StudyMaterial
from app.models.notification import Notification
from app.models.project_submission import ProjectSubmission, SubmissionStatus
from pydantic import BaseModel
from typing import Optional, Any
from datetime import date


class AttendanceStats(BaseModel):
    total_records: int = 0
    present: int = 0
    absent: int = 0


class PendingRequestItem(BaseModel):
    id: int
    student_name: str
    email: str
    course_title: str
    applied_at: Optional[str] = None


class RecentActivityItem(BaseModel):
    id: int
    student_name: str
    course_title: str
    action: str
    timestamp: Optional[str] = None


class StudentCourseInfo(BaseModel):
    id: int
    title: str
    status: str
    attendance_percentage: float = 0
    fee: Optional[int] = None


class StudentNotifInfo(BaseModel):
    id: int
    title: str
    message: Optional[str] = None
    created_at: Optional[str] = None


class StudentActivityItem(BaseModel):
    id: int
    title: str
    message: Optional[str] = None
    type: str
    timestamp: Optional[str] = None


class StudentDashboardResponse(BaseModel):
    full_name: str
    email: str
    department: Optional[str] = None
    college: Optional[str] = None
    is_approved: bool
    total_enrollments: int
    pending_enrollments: int
    approved_enrollments: int
    rejected_enrollments: int
    attendance_percentage: float
    total_attendance: int = 0
    present_attendance: int = 0
    absent_attendance: int = 0
    has_offer_letter: bool
    has_certificate: bool
    unread_notifications: int
    materials_count: int
    certificates_count: int
    total_submissions: int = 0
    pending_submissions: int = 0
    approved_submissions: int = 0
    rejected_submissions: int = 0
    progress_percentage: float = 0
    internship_status: str = "not_started"
    internship_id: Optional[str] = None
    milestones: dict = {}
    profile_completion: float = 0
    missing_profile_fields: list = []
    enrollment_remarks: Optional[str] = None
    recent_enrollments: list
    my_courses: list[StudentCourseInfo] = []
    recent_notifications: list[StudentNotifInfo] = []
    recent_activity: list[StudentActivityItem] = []


class AdminDashboardResponse(BaseModel):
    total_students: int
    approved_students: int
    total_courses: int
    total_enrollments: int
    pending_approvals: int
    pending_payments: int
    active_internships: int
    ongoing_internships: int = 0
    completed_internships: int = 0
    students_below_attendance: int = 0
    total_offer_letters: int
    total_certificates: int
    pending_project_reviews: int = 0
    pending_project_evaluations: int = 0
    approved_projects: int = 0
    rejected_projects: int = 0
    pending_certificate_releases: int = 0
    attendance_stats: AttendanceStats
    recent_enrollments: list
    pending_requests: list[PendingRequestItem] = []
    payment_requests: list[PendingRequestItem] = []
    recent_activity: list[RecentActivityItem] = []


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/student", response_model=StudentDashboardResponse)
def student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.course)
    ).filter(Enrollment.student_id == current_user.id).all()

    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == current_user.id
    ).all()
    total_attendance = len(attendance_records)
    present_count = sum(1 for a in attendance_records if a.status.value == "present")
    attendance_pct = round((present_count / total_attendance * 100), 2) if total_attendance > 0 else 0

    has_offer = db.query(OfferLetter).join(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        OfferLetter.is_generated == True,
    ).first() is not None

    has_cert = db.query(Certificate).join(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Certificate.is_issued == True,
    ).first() is not None

    unread = db.query(func.count(Notification.id)).filter(
        Notification.student_id == current_user.id,
        Notification.is_read == False,
    ).scalar() or 0

    approved_ids = [e.course_id for e in enrollments if e.status == EnrollmentStatus.APPROVED]
    materials_count = (
        db.query(func.count(StudyMaterial.id))
        .filter(StudyMaterial.course_id.in_(approved_ids))
        .scalar() or 0
    ) if approved_ids else 0

    certs_count = db.query(func.count(Certificate.id)).join(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Certificate.is_issued == True,
    ).scalar() or 0

    recent = []
    for e in sorted(enrollments, key=lambda x: x.applied_at or datetime.min, reverse=True)[:5]:
        recent.append({
            "id": e.id,
            "course_title": e.course.title if e.course else "Unknown",
            "status": e.status.value,
            "applied_at": e.applied_at.isoformat() if e.applied_at else None,
        })

    my_courses_list = []
    for e in enrollments:
        if e.course:
            cid = e.course.id
            course_att = db.query(Attendance).filter(
                Attendance.student_id == current_user.id,
                Attendance.course_id == cid,
            ).all()
            ca_total = len(course_att)
            ca_present = sum(1 for a in course_att if a.status.value == "present")
            ca_pct = round((ca_present / ca_total * 100), 1) if ca_total > 0 else 0
            my_courses_list.append({
                "id": cid,
                "title": e.course.title,
                "status": e.status.value,
                "attendance_percentage": ca_pct,
                "fee": e.course.fee,
            })

    notif_list = []
    recent_notifs = db.query(Notification).filter(
        Notification.student_id == current_user.id,
    ).order_by(Notification.created_at.desc()).limit(5).all()
    for n in recent_notifs:
        notif_list.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        })

    submissions = db.query(ProjectSubmission).filter(
        ProjectSubmission.student_id == current_user.id
    ).all()
    total_subs = len(submissions)
    pending_subs = sum(1 for s in submissions if s.status in (SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW))
    approved_subs = sum(1 for s in submissions if s.status == SubmissionStatus.APPROVED)
    rejected_subs = sum(1 for s in submissions if s.status == SubmissionStatus.REJECTED)

    activity_list = []
    for n in recent_notifs:
        if n.notification_type:
            activity_list.append({
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.notification_type,
                "timestamp": n.created_at.isoformat() if n.created_at else None,
            })
    for s in sorted(submissions, key=lambda x: x.submitted_at or datetime.min, reverse=True)[:5]:
        activity_list.append({
            "id": s.id,
            "title": f"{s.project_type.value.replace('_', ' ').title()} Submitted",
            "message": s.title,
            "type": "project_submitted",
            "timestamp": s.submitted_at.isoformat() if s.submitted_at else None,
        })
    activity_list.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    activity_list = activity_list[:10]

    from datetime import timedelta
    if attendance_pct > 0 and attendance_pct < 75:
        recent_alert = db.query(Notification).filter(
            Notification.student_id == current_user.id,
            Notification.notification_type == "attendance_alert",
            Notification.created_at >= datetime.now(timezone.utc) - timedelta(days=1),
        ).first()
        if not recent_alert:
            alert = Notification(
                student_id=current_user.id,
                title="Attendance Alert",
                message=f"Your attendance is currently at {attendance_pct}%, which is below the required 75% threshold. Please attend upcoming sessions.",
                notification_type="attendance_alert",
            )
            db.add(alert)
            db.commit()

    milestones = {
        "enrollment_submitted": any(e.status != EnrollmentStatus.REJECTED for e in enrollments),
        "payment_verified": any(e.payment_status == PaymentStatus.VERIFIED for e in enrollments),
        "enrollment_approved": any(e.status == EnrollmentStatus.APPROVED for e in enrollments),
        "offer_letter_issued": has_offer,
        "project_submitted": total_subs > 0,
        "attendance_met": attendance_pct >= 75,
        "certificate_released": has_cert,
    }
    completed = sum(1 for v in milestones.values() if v)
    total = len(milestones)
    progress_pct = round((completed / total) * 100, 1) if total > 0 else 0

    has_approved_enrollment = any(e.status == EnrollmentStatus.APPROVED for e in enrollments)
    project_approved = approved_subs > 0
    if has_approved_enrollment and attendance_pct >= 75 and project_approved and has_cert:
        internship_status = "completed"
    elif has_approved_enrollment:
        internship_status = "ongoing"
    else:
        internship_status = "incomplete"

    approved_enrollment = next((e for e in enrollments if e.status == EnrollmentStatus.APPROVED), None)
    internship_id = approved_enrollment.internship_id if approved_enrollment else None

    profile_fields = {
        "Profile Photo": bool(current_user.profile_pic),
        "Phone Number": bool(current_user.phone),
        "College": bool(current_user.college),
        "Department": bool(current_user.department),
        "Email": bool(current_user.email),
    }
    filled = sum(1 for v in profile_fields.values() if v)
    total_fields = len(profile_fields)
    profile_pct = round((filled / total_fields) * 100, 1) if total_fields > 0 else 0
    missing_fields = [k for k, v in profile_fields.items() if not v]

    remarks_any = next((e.admin_remarks for e in enrollments if e.admin_remarks), None)

    return StudentDashboardResponse(
        full_name=current_user.full_name,
        email=current_user.email,
        department=current_user.department,
        college=current_user.college,
        is_approved=current_user.is_approved,
        total_enrollments=len(enrollments),
        pending_enrollments=sum(1 for e in enrollments if e.status == EnrollmentStatus.PENDING),
        approved_enrollments=sum(1 for e in enrollments if e.status == EnrollmentStatus.APPROVED),
        rejected_enrollments=sum(1 for e in enrollments if e.status == EnrollmentStatus.REJECTED),
        attendance_percentage=attendance_pct,
        total_attendance=total_attendance,
        present_attendance=present_count,
        absent_attendance=total_attendance - present_count,
        has_offer_letter=has_offer,
        has_certificate=has_cert,
        unread_notifications=unread,
        materials_count=materials_count,
        certificates_count=certs_count,
        total_submissions=total_subs,
        pending_submissions=pending_subs,
        approved_submissions=approved_subs,
        rejected_submissions=rejected_subs,
        progress_percentage=progress_pct,
        internship_status=internship_status,
        internship_id=internship_id,
        milestones=milestones,
        profile_completion=profile_pct,
        missing_profile_fields=missing_fields,
        enrollment_remarks=remarks_any,
        recent_enrollments=recent,
        my_courses=my_courses_list,
        recent_notifications=notif_list,
        recent_activity=activity_list,
    )


@router.get("/admin", response_model=AdminDashboardResponse)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    approved_students = (
        db.query(func.count(User.id))
        .filter(User.role == UserRole.STUDENT, User.is_approved == True)
        .scalar() or 0
    )
    total_courses = db.query(Course).count()
    total_enrollments = db.query(Enrollment).count()
    pending = db.query(Enrollment).filter(Enrollment.status == EnrollmentStatus.PENDING).count()
    pending_pay = db.query(Enrollment).filter(Enrollment.payment_status == PaymentStatus.PENDING_VERIFICATION).count()
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    offer_count = db.query(OfferLetter).filter(OfferLetter.is_generated == True).count()
    cert_count = db.query(Certificate).filter(Certificate.is_issued == True).count()

    recent = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).order_by(Enrollment.applied_at.desc()).limit(10).all()

    recent_list = []
    for e in recent:
        recent_list.append({
            "id": e.id,
            "student_name": e.student.full_name if e.student else "Unknown",
            "course_title": e.course.title if e.course else "Unknown",
            "status": e.status.value,
            "applied_at": e.applied_at.isoformat() if e.applied_at else None,
        })

    pending_req = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.status == EnrollmentStatus.PENDING).order_by(Enrollment.applied_at.desc()).limit(10).all()

    pending_list = []
    for e in pending_req:
        pending_list.append({
            "id": e.id,
            "student_name": e.student.full_name if e.student else "Unknown",
            "email": e.student.email if e.student else "",
            "course_title": e.course.title if e.course else "Unknown",
            "applied_at": e.applied_at.isoformat() if e.applied_at else None,
        })

    payment_reqs = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).filter(Enrollment.payment_status == PaymentStatus.PENDING_VERIFICATION).order_by(Enrollment.updated_at.desc()).limit(10).all()

    payment_req_list = []
    for e in payment_reqs:
        payment_req_list.append({
            "id": e.id,
            "student_name": e.student.full_name if e.student else "Unknown",
            "email": e.student.email if e.student else "",
            "course_title": e.course.title if e.course else "Unknown",
            "applied_at": e.updated_at.isoformat() if e.updated_at else None,
        })

    from app.models.attendance import AttendanceStatus as AttStatus
    attendance_total = db.query(Attendance).count()
    attendance_present = db.query(Attendance).filter(Attendance.status == AttStatus.PRESENT).count()
    attendance_absent = attendance_total - attendance_present

    recent_activity_list = []

    recent_enrollments_activity = db.query(Enrollment).options(
        joinedload(Enrollment.course),
        joinedload(Enrollment.student),
    ).order_by(Enrollment.updated_at.desc()).limit(10).all()
    for e in recent_enrollments_activity:
        action_text = f"Enrollment {e.status.value}"
        recent_activity_list.append({
            "id": e.id,
            "student_name": e.student.full_name if e.student else "Unknown",
            "course_title": e.course.title if e.course else "Unknown",
            "action": action_text,
            "timestamp": (e.updated_at or e.applied_at).isoformat() if (e.updated_at or e.applied_at) else None,
        })

    recent_notifs = db.query(Notification).filter(
        Notification.notification_type.in_(["new_registration", "payment_submitted"])
    ).order_by(Notification.created_at.desc()).limit(10).all()

    seen_activities = set()
    for n in recent_notifs:
        if n.notification_type == "new_registration":
            action_text = "New Registration"
            message_parts = n.message.split("(") if n.message else [""]
            student_name = message_parts[0].strip() if message_parts else "A new student"
        else:
            action_text = "Payment Submitted"
            message_parts = n.message.split("submitted payment proof for") if n.message else [""]
            student_name = message_parts[0].strip() if message_parts else "A student"
            message_parts2 = n.message.split("for") if n.message else [""]
            course_title = message_parts2[-1].strip() if len(message_parts2) > 1 else "a course"
            n.course_title = course_title

        unique_key = f"{n.created_at}-{n.title}"
        if unique_key in seen_activities:
            continue
        seen_activities.add(unique_key)

        recent_activity_list.append({
            "id": n.id,
            "student_name": student_name,
            "course_title": getattr(n, 'course_title', '') if n.notification_type == "payment_submitted" else "",
            "action": action_text,
            "timestamp": n.created_at.isoformat() if n.created_at else None,
        })

    recent_project_subs = db.query(ProjectSubmission).options(
        joinedload(ProjectSubmission.student),
    ).order_by(ProjectSubmission.submitted_at.desc()).limit(10).all()
    for s in recent_project_subs:
        recent_activity_list.append({
            "id": s.id,
            "student_name": s.student.full_name if s.student else "Unknown",
            "course_title": s.title,
            "action": f"Project Submission: {s.project_type.value}",
            "timestamp": s.submitted_at.isoformat() if s.submitted_at else None,
        })

    recent_activity_list.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    recent_activity_list = recent_activity_list[:15]

    from app.models.certificate import Certificate as CertModel
    pending_projects = db.query(ProjectSubmission).filter(
        ProjectSubmission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW])
    ).count()
    approved_projects = db.query(ProjectSubmission).filter(
        ProjectSubmission.status == SubmissionStatus.APPROVED
    ).count()
    rejected_projects = db.query(ProjectSubmission).filter(
        ProjectSubmission.status == SubmissionStatus.REJECTED
    ).count()

    pending_cert_releases = db.query(CertModel).filter(
        CertModel.file_path.isnot(None),
        CertModel.is_issued == False,
    ).count()

    from sqlalchemy import func as sa_func
    ongoing = db.query(sa_func.count(func.distinct(Enrollment.student_id))).filter(
        Enrollment.status == EnrollmentStatus.APPROVED,
        Enrollment.internship_id.isnot(None),
    ).scalar() or 0

    cert_students = db.query(sa_func.count(func.distinct(CertModel.student_id))).filter(
        CertModel.is_issued == True,
    ).scalar() or 0
    completed_internships = min(cert_students, ongoing)

    from app.models.attendance import Attendance as AttModel, AttendanceStatus as AttStatus
    below_threshold = 0
    all_students = db.query(User).filter(User.role == UserRole.STUDENT).all()
    required_attendance_pct = 75
    for student in all_students:
        att_recs = db.query(AttModel).filter(AttModel.student_id == student.id).all()
        if att_recs:
            att_present = sum(1 for a in att_recs if a.status == AttStatus.PRESENT)
            att_pct = (att_present / len(att_recs)) * 100
            if att_pct < required_attendance_pct:
                below_threshold += 1
    students_below_attendance = below_threshold

    pending_evaluations = db.query(ProjectSubmission).filter(
        ProjectSubmission.status == SubmissionStatus.APPROVED,
        ProjectSubmission.total_score.is_(None),
    ).count()

    return AdminDashboardResponse(
        total_students=total_students,
        approved_students=approved_students,
        total_courses=total_courses,
        total_enrollments=total_enrollments,
        pending_approvals=pending,
        pending_payments=pending_pay,
        active_internships=active_courses,
        ongoing_internships=ongoing,
        completed_internships=completed_internships,
        students_below_attendance=students_below_attendance,
        total_offer_letters=offer_count,
        total_certificates=cert_count,
        pending_project_reviews=pending_projects,
        pending_project_evaluations=pending_evaluations,
        approved_projects=approved_projects,
        rejected_projects=rejected_projects,
        pending_certificate_releases=pending_cert_releases,
        attendance_stats={
            "total_records": attendance_total,
            "present": attendance_present,
            "absent": attendance_absent,
        },
        recent_enrollments=recent_list,
        pending_requests=pending_list,
        payment_requests=payment_req_list,
        recent_activity=recent_activity_list,
    )
