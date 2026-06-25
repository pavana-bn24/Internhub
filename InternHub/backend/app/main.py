import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

from app.core.security import get_current_user
from app.models.user import User

from app.core.config import settings, logger
from app.core.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.course import Course
from app.core.security import get_password_hash
from app.api.v1 import auth, users, courses, enrollments, attendance, offer_letters, certificates, study_materials, notifications, dashboard, search, project_submissions, payments

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redirect_slashes=False,
)

cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(courses.router, prefix=settings.API_V1_STR)
app.include_router(enrollments.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(offer_letters.router, prefix=settings.API_V1_STR)
app.include_router(certificates.router, prefix=settings.API_V1_STR)
app.include_router(study_materials.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)
app.include_router(project_submissions.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                username=settings.ADMIN_USERNAME,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="System Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_approved=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Admin user created: %s (%s)", settings.ADMIN_EMAIL, settings.ADMIN_USERNAME)

        existing_courses = db.query(Course).count()
        if existing_courses == 0:
            courses = [
                Course(title="Full Stack Development", fee=5000, duration="3 Months", mode="Online", description="Build complete web applications with frontend and backend technologies.", company="InternHub", skills_required="HTML, CSS, JavaScript, React, Node.js, MongoDB"),
                Course(title="AI & Machine Learning", fee=5000, duration="3 Months", mode="Online", description="Learn artificial intelligence and machine learning algorithms.", company="InternHub", skills_required="Python, Statistics, Linear Algebra, ML Algorithms"),
                Course(title="Data Science", fee=4000, duration="3 Months", mode="Online", description="Master data analysis, visualization and statistical modeling.", company="InternHub", skills_required="Python, SQL, Statistics, Data Visualization"),
                Course(title="Cyber Security", fee=4000, duration="3 Months", mode="Online", description="Learn network security, ethical hacking and security protocols.", company="InternHub", skills_required="Networking, Linux, Python, Security Fundamentals"),
                Course(title="Cloud Computing", fee=4000, duration="3 Months", mode="Online", description="Understand cloud architecture, AWS, Azure and deployment strategies.", company="InternHub", skills_required="Linux, Networking, AWS/Azure Basics"),
                Course(title="Python Development", fee=4000, duration="3 Months", mode="Online", description="Build applications using Python programming language.", company="InternHub", skills_required="Python, OOP, APIs, Databases"),
                Course(title="Java Development", fee=4000, duration="3 Months", mode="Online", description="Develop enterprise applications with Java.", company="InternHub", skills_required="Java, OOP, Spring Boot, SQL"),
                Course(title="Web Development", fee=4000, duration="3 Months", mode="Online", description="Create modern websites using HTML, CSS and JavaScript.", company="InternHub", skills_required="HTML, CSS, JavaScript, Responsive Design"),
            ]
            for c in courses:
                db.add(c)
            db.commit()
            logger.info("%d internship courses created", len(courses))
    except Exception as e:
        logger.critical("Startup failed: %s", e)
        raise
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "InternHub API", "version": settings.VERSION, "docs": "/docs"}


@app.get("/health")
def health():
    from sqlalchemy import text
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "healthy", "database": db_status}


@app.get("/uploads/{file_path:path}")
def serve_file(
    file_path: str,
    current_user: User = Depends(get_current_user),
):
    safe_path = os.path.normpath(file_path)
    if safe_path.startswith("..") or os.path.isabs(safe_path):
        logger.warning("Path traversal attempt by user %d: %s", current_user.id, file_path)
        raise HTTPException(status_code=400, detail="Invalid file path")
    full_path = os.path.join("uploads", safe_path)
    full_path = os.path.normpath(full_path)
    if not full_path.startswith(os.path.normpath("uploads")):
        logger.warning("Path traversal attempt by user %d: %s", current_user.id, file_path)
        raise HTTPException(status_code=400, detail="Invalid file path")
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full_path)
