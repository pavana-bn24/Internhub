import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.core.config import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    return user


def build_token_response(user: User) -> TokenResponse:
    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if "@" not in data.email or "." not in data.email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format",
        )
    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )

    existing = db.query(User).filter(
        (User.email == data.email) | (User.username == data.username)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered",
        )

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=UserRole.STUDENT,
        phone=data.phone,
        department=data.department,
        college=data.college,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        notif = Notification(
            student_id=admin.id,
            title="New Registration",
            message=f"{user.full_name} ({user.email}) has registered as a student.",
            notification_type="new_registration",
        )
        db.add(notif)
    db.commit()

    logger.info("New user registered: %s (%s)", data.username, data.email)

    return build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.username, data.password)
    logger.info("User logged in: %s", user.username)
    return build_token_response(user)


@router.post("/token", response_model=TokenResponse)
def token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    logger.info("User logged in via token: %s", user.username)
    return build_token_response(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
