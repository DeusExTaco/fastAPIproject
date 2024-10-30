
from typing import Dict, Any, List
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import secrets
import logging

from models import User, UserStatus, UserRole
from services.password_service import PasswordService
from services.user_service import UserService
from auth import create_token


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
        self.password_service = PasswordService()

    @staticmethod
    def _validate_roles(role: str) -> bool:
        return role in {role.value for role in UserRole}

    def _process_roles(self, roles: str | List[str] | None) -> List[str]:
        if not roles:
            return ["USER"]

        processed_roles = [role.strip().upper() for role in
                           (roles.split(',') if isinstance(roles, str) else roles)
                           if role.strip()]

        invalid_roles = [role for role in processed_roles
                         if not self._validate_roles(role)]
        if invalid_roles:
            raise ValueError(f"Invalid roles: {', '.join(invalid_roles)}")

        return processed_roles

    @staticmethod
    def _handle_login_checks(user: User, password_service: PasswordService,
                             password: str) -> None:
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Invalid username or password")

        if user.status != UserStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Account is not active")

        if not password_service.verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Invalid username or password")

    def login(self, username: str, password: str) -> Dict[str, Any]:
        try:
            user = self.user_service.get_user_by_username(username)
            self._handle_login_checks(user, self.password_service, password)

            self.user_service.update_last_login(user)
            user_roles = self._process_roles(user.roles)

            token = create_token({
                "sub": user.user_name,
                "roles": user_roles,
                "user_id": user.id
            })

            return {
                "message": "Login successful",
                "user_id": user.id,
                "roles": user_roles,
                "access_token": token,
                "token_type": "bearer"
            }
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Login error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="An unexpected error occurred during login")

    def initiate_password_recovery(self, email: str) -> Dict[str, str]:
        try:
            user = self.user_service.get_user_by_email(email)
            if not user:
                return {"message": "If the email exists, a recovery link will be sent."}

            token = secrets.token_urlsafe(32)
            expiry_time = self.db.query(func.now() + text("INTERVAL 1 HOUR")).scalar()

            user.reset_token = token
            user.reset_token_expiry = expiry_time
            self.db.commit()

            return {"token": token, "message": "Recovery initiated successfully"}
        except Exception as e:
            self.db.rollback()
            logging.error(f"Password recovery error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Error initiating password recovery")

    def update_password(self, user: User, new_password: str,
                        current_password: str = None) -> Dict[str, Any]:
        try:
            if current_password and not self.password_service.verify_password(
                    current_password, user.hashed_password):
                raise HTTPException(status_code=400,
                                    detail="Current password is incorrect")

            if not self.password_service.check_password_history(
                    new_password, user.last_passwords):
                raise HTTPException(status_code=400,
                                    detail="Cannot use any of your last 5 passwords")

            new_hash = self.password_service.hash_password(new_password)
            new_history = self.password_service.update_password_history(
                user.hashed_password, user.last_passwords)

            update_data = {
                "hashed_password": new_hash,
                "last_passwords": new_history,
                "reset_token": None,
                "reset_token_expiry": None
            }

            status_updated = False
            if user.status == UserStatus.PENDING:
                update_data["status"] = UserStatus.ACTIVE
                status_updated = True

            self.user_service.update_user(user, update_data)

            return {
                "message": "Password updated successfully",
                "require_relogin": bool(current_password),
                "status_updated": status_updated
            }
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Password update error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Error updating password")