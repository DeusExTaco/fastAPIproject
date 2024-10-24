import logging
import secrets
from typing import List, Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette import status

from auth import get_current_user, check_admin
from database import get_db
from email_utils import send_recovery_email
from models import User, UserRole
from schema import UserCreate, UserResponse, UserLogin, ChangePasswordRequest, UserUpdate, PasswordRecoveryRequest, \
    ResetPasswordRequest
from random_password import PasswordGenerator

router = APIRouter()


class PasswordService:
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    @staticmethod
    def check_password_history(new_password: str, password_history: List[str]) -> bool:
        """Returns True if password can be used, False if it's in history"""
        if not password_history:
            return True

        for old_password in password_history:
            if PasswordService.verify_password(new_password, old_password):
                return False
        return True

    @staticmethod
    def update_password_history(current_hash: str, history: List[str]) -> List[str]:
        """Updates password history, keeping last 5 passwords"""
        if history is None:
            history = []
        new_history = history + [current_hash]
        return new_history[-5:]


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.user_name == username).first()

    def get_user_by_reset_token(self, token: str) -> Optional[User]:
        return self.db.query(User).filter(User.reset_token == token).first()

    def update_user(self, user: User, update_data: dict):
        try:
            for key, value in update_data.items():
                if key == 'roles' and value is not None:
                    setattr(user, key, ','.join(value))
                else:
                    setattr(user, key, value)
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail="Username or email already exists")


# Test route
@router.get("/")
async def read_root():
    return {"message": "Hello from FastAPI!"}

# Create user
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        user_data = user.model_dump()
        user_data['hashed_password'] = PasswordService.hash_password(user_data.pop('password'))
        user_data['roles'] = ','.join([role.value for role in user_data['roles']])

        db_user = User(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        db_user.roles = [UserRole(role) for role in db_user.roles.split(',')]
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Login
@router.post("/login", status_code=status.HTTP_200_OK)
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user_service = UserService(db)
    user = user_service.get_user_by_username(user_login.username)
    if not user or not PasswordService.verify_password(user_login.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "message": "Login successful",
        "user_id": user.id,
        "roles": user.roles.split(',')
    }


# Get user
@router.get("/users/{user_id}")
def get_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_admin(current_user)
    user_service = UserService(db)
    user_to_return = user_service.get_user_by_id(user_id)

    if not user_to_return:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return user_to_return


# Delete User
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_admin(current_user)
    user_service = UserService(db)
    user_to_delete = user_service.get_user_by_id(user_id)

    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db.delete(user_to_delete)
    db.commit()
    return {"message": f"User {user_id} has been deleted successfully"}

# Update user
@router.put("/users/{user_id}", response_model=UserResponse, status_code=status.HTTP_202_ACCEPTED)
def edit_user(
        user_id: int,
        user_update: UserUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    user_service = UserService(db)
    db_user = user_service.get_user_by_id(user_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.id != user_id and 'ADMIN' not in current_user.roles.split(','):
        raise HTTPException(status_code=403, detail="You don't have permission to edit this user")

    update_data = user_update.model_dump(exclude_unset=True)
    if 'ADMIN' not in current_user.roles.split(','):
        update_data.pop('roles', None)
        update_data.pop('status', None)

    user_service.update_user(db_user, update_data)
    db_user.roles = db_user.roles.split(',') if db_user.roles else []
    return db_user

# Change password
@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    logging.info(f"Received change password request: {request.model_dump_json()}")

    user_service = UserService(db)
    user = user_service.get_user_by_id(request.user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not PasswordService.verify_password(request.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if not PasswordService.check_password_history(request.new_password, user.last_passwords):
        raise HTTPException(status_code=400, detail="You cannot use any of your last 5 passwords.")

    new_last_passwords = PasswordService.update_password_history(
        user.hashed_password,
        user.last_passwords
    )
    new_hashed_password = PasswordService.hash_password(request.new_password)
    new_last_passwords.append(new_hashed_password)

    db.query(User).filter(User.id == user.id).update(
        {
            "hashed_password": new_hashed_password,
            "last_passwords": new_last_passwords
        },
        synchronize_session="fetch"
    )
    db.commit()

    logging.info(f"Password successfully changed for user_id: {request.user_id}")
    return {
        "message": "Password changed successfully",
        "require_relogin": True,
        "request_payload": request.model_dump()
    }

# Send password recovery email
@router.post("/password-recovery", status_code=status.HTTP_200_OK)
async def password_recovery(
        request: PasswordRecoveryRequest,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    logging.info(f"Password recovery requested for email: {request.email}")
    user_service = UserService(db)
    user = user_service.get_user_by_email(request.email)

    if not user:
        logging.warning(f"Password recovery requested for non-existent email: {request.email}")
        return {"message": "If the email exists, a recovery link will be sent."}

    token = secrets.token_urlsafe(32)
    expiry_time = db.query(func.now() + text("INTERVAL 2 HOUR")).scalar()

    user.reset_token = token
    user.reset_token_expiry = expiry_time
    db.commit()

    logging.info(f"Token stored for user {user.id}. Token expiry time: {user.reset_token_expiry}")

    try:
        background_tasks.add_task(send_recovery_email, user.email, token)
        logging.info(f"Recovery email task added for user {user.id}")
        return {"message": "If the email exists, a recovery link will be sent."}
    except Exception as e:
        logging.error(f"Error sending recovery email: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while sending the recovery email.")

# Verify that the password reset token is valid
@router.get("/verify-reset-token", status_code=status.HTTP_200_OK)
async def verify_reset_token(token: str, db: Session = Depends(get_db)):
    logging.info(f"Received token for verification: {token}")
    user_service = UserService(db)
    user = user_service.get_user_by_reset_token(token)

    if not user:
        logging.warning(f"No user found with token: {token}")
        raise HTTPException(status_code=400, detail="Invalid reset token")

    current_time = db.query(func.now()).scalar()
    if user.reset_token_expiry < current_time:
        logging.warning(f"Token expired for user: {user.id}")
        raise HTTPException(status_code=400, detail="Reset token has expired")

    logging.info(f"Token valid for user: {user.id}")
    return {"message": "Token is valid", "user_id": user.id, "email": user.email}

# Reset the users password if token if valid
@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    logging.info(f"Received reset password request: {request.model_dump_json()}")

    user_service = UserService(db)
    user = user_service.get_user_by_reset_token(request.token)

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    current_time = db.query(func.now()).scalar()
    if user.reset_token_expiry < current_time:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    if not PasswordService.check_password_history(request.new_password, user.last_passwords):
        raise HTTPException(status_code=400, detail="You cannot use any of your last 5 passwords.")

    new_last_passwords = PasswordService.update_password_history(
        user.hashed_password,
        user.last_passwords
    )
    new_hashed_password = PasswordService.hash_password(request.new_password)
    new_last_passwords.append(new_hashed_password)

    db.query(User).filter(User.id == user.id).update({
        "hashed_password": new_hashed_password,
        "last_passwords": new_last_passwords,
        "reset_token": None,
        "reset_token_expiry": None
    }, synchronize_session="fetch")

    db.commit()
    logging.info(f"Password reset successfully for user {user.id}")
    return {"message": "Password reset successfully"}

# Generates a random password
@router.post("/generate-password", status_code=status.HTTP_201_CREATED)
def generate_password(options: dict):
    try:
        password_generator = PasswordGenerator()
        password = password_generator.generate_password(
            length=options.get("length", 12),
            use_upper=options.get("use_upper", True),
            use_lower=options.get("use_lower", True),
            use_numbers=options.get("use_numbers", True),
            use_special=options.get("use_special", True)
        )
        return {"generated_password": password}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))