
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import get_db
from random_password import PasswordGenerator
from services.auth_service import AuthService
from services.password_service import PasswordService
from services.user_service import UserService
from templates.email.password_reset_template import send_recovery_email
from schemas.user import (
    UserLogin, PasswordUpdateRequest,
    PasswordRecoveryInitRequest
)

router = APIRouter()

def get_user_or_404(db: Session, user_id: Optional[int] = None, email: Optional[str] = None,
                    reset_token: Optional[str] = None):
    user_service = UserService(db)
    user = None

    if reset_token:
        user = user_service.get_user_by_reset_token(reset_token)
    elif user_id:
        user = user_service.get_user_by_id(user_id)
    elif email:
        user = user_service.get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


def create_reset_token(db: Session, user):
    reset_token = secrets.token_urlsafe(32)
    reset_token_expiry = db.query(func.now() + text("INTERVAL 1 HOUR")).scalar()

    user.reset_token = reset_token
    user.reset_token_expiry = reset_token_expiry
    db.commit()

    return reset_token


@router.post("/login")
async def login(user_login: UserLogin, response: Response, db: Session = Depends(get_db)):
    try:
        result = AuthService(db).login(user_login.username, user_login.password)

        # Add CORS headers explicitly
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.post("/password-recovery")
async def password_recovery(
        request: PasswordRecoveryInitRequest,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    result = AuthService(db).initiate_password_recovery(request.email)
    if result.get("token"):
        background_tasks.add_task(send_recovery_email, request.email, result["token"])
    return {"message": result["message"]}


@router.post("/update-password")
async def update_password(request: PasswordUpdateRequest, db: Session = Depends(get_db)):
    user = get_user_or_404(
        db,
        user_id=request.user_id,
        reset_token=request.token
    )
    return AuthService(db).update_password(
        user,
        request.new_password,
        request.current_password
    )


@router.post("/check-password-history")
async def check_password_history(request: dict, db: Session = Depends(get_db)):
    if not all(k in request for k in ["user_id", "new_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID and new password are required"
        )

    user = get_user_or_404(db, user_id=request["user_id"])

    if not PasswordService.check_password_history(
            request["new_password"],
            user.last_passwords or []
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password found in history"
        )

    return {"message": "Password not found in history"}


@router.post("/generate-password", status_code=status.HTTP_201_CREATED)
def generate_password(options: dict):
    try:
        return {
            "generated_password": PasswordGenerator().generate_password(
                length=options.get("length", 16),
                use_upper=options.get("use_upper", True),
                use_lower=options.get("use_lower", True),
                use_numbers=options.get("use_numbers", True),
                use_special=options.get("use_special", True)
            )
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/resend-password-recovery")
def resend_password_recovery(
        request: dict,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    user = get_user_or_404(db, email=request.get("email"))
    reset_token = create_reset_token(db, user)

    background_tasks.add_task(
        send_recovery_email,
        request.get("email"),
        reset_token
    )

    return {"message": f"Password recovery email resent to {request.get('email')}"}