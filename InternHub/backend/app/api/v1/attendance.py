from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import date, datetime

from app.core.database import get_db
from app.core.config import logger
from app.core.security import get_current_user, require_role
from app.services.permissions import require_approved_student
from app.models.user import User, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.attendance import AttendanceCreate, AttendanceBulkCreate, AttendanceResponse, AttendanceSummary

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("", response_model=List[AttendanceResponse])
def list_attendance(
    skip: int = 0,
    limit: int = 100,
    course_id: int = 0,
    month: int = 0,
    year: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(require_approved_student),
):
    query = db.query(Attendance)
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Attendance.student_id == current_user.id)
    if course_id:
        query = query.filter(Attendance.course_id == course_id)
    if month:
        query = query.filter(extract("month", Attendance.date) == month)
    if year:
        query = query.filter(extract("year", Attendance.date) == year)
    records = query.order_by(Attendance.date.desc()).offset(skip).limit(limit).all()
    return [AttendanceResponse.model_validate(r) for r in records]


@router.get("/summary", response_model=AttendanceSummary)
def attendance_summary(
    course_id: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: User = Depends(require_approved_student),
):
    query = db.query(Attendance).filter(Attendance.student_id == current_user.id)
    if course_id:
        query = query.filter(Attendance.course_id == course_id)
    records = query.all()
    total = len(records)
    present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    leave = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
    percentage = round((present / total * 100), 2) if total > 0 else 0
    return AttendanceSummary(total=total, present=present, absent=absent, leave=leave, percentage=percentage)


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    existing = db.query(Attendance).filter(
        Attendance.student_id == data.student_id,
        Attendance.course_id == data.course_id,
        Attendance.date == data.date,
    ).first()
    if existing:
        existing.status = data.status
        existing.remarks = data.remarks
        db.commit()
        db.refresh(existing)
        return AttendanceResponse.model_validate(existing)

    record = Attendance(
        student_id=data.student_id,
        course_id=data.course_id,
        date=data.date,
        status=data.status,
        marked_by=current_user.id,
        remarks=data.remarks,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return AttendanceResponse.model_validate(record)


@router.post("/bulk", response_model=List[AttendanceResponse])
def bulk_attendance(
    data: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    results = []
    for record_data in data.records:
        existing = db.query(Attendance).filter(
            Attendance.student_id == record_data.student_id,
            Attendance.course_id == record_data.course_id,
            Attendance.date == record_data.date,
        ).first()
        if existing:
            existing.status = record_data.status
            existing.remarks = record_data.remarks
            results.append(existing)
        else:
            record = Attendance(
                student_id=record_data.student_id,
                course_id=record_data.course_id,
                date=record_data.date,
                status=record_data.status,
                marked_by=current_user.id,
                remarks=record_data.remarks,
            )
            db.add(record)
            results.append(record)
    try:
        db.commit()
        for r in results:
            db.refresh(r)
    except Exception:
        db.rollback()
        logger.error("Bulk attendance commit failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save attendance records")
    logger.info("Bulk attendance: %d records processed", len(results))
    return [AttendanceResponse.model_validate(r) for r in results]
