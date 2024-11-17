
import logging
import secrets
from datetime import datetime, timedelta, UTC
from typing import Optional, Dict, Any, List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import User, UserRole
from services.password_service import PasswordService


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.password_service = PasswordService()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.user_name == username).first()

    def get_user_by_reset_token(self, token: str) -> Optional[User]:
        return self.db.query(User).filter(User.reset_token == token).first()

    def get_all_users(self) -> List[User]:
        return self.db.query(User).all()

    def create_user(self, user_data: dict) -> User:
        """Create a new user with proper role handling"""
        try:
            logging.info(f"Creating user with data: {user_data}")

            # Handle roles conversion
            if 'roles' in user_data:
                # Convert roles to list if it's not already
                if isinstance(user_data['roles'], str):
                    user_data['roles'] = [user_data['roles']]
                # Convert role enums to string values and join
                user_data['roles'] = ','.join([
                    role.value if isinstance(role, UserRole) else str(role)
                    for role in user_data['roles']
                ])

            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            reset_token_expiry = datetime.now(UTC) + timedelta(hours=24)

            # Hash the password
            if 'password' in user_data:
                user_data['hashed_password'] = self.password_service.hash_password(
                    user_data.pop('password')
                )

            # Add reset token data
            user_data.update({
                'reset_token': reset_token,
                'reset_token_expiry': reset_token_expiry,
                'last_passwords': []
            })

            logging.info(f"Processed user data: {user_data}")
            new_user = User(**user_data)

            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)

            logging.info(f"Successfully created user: {new_user.user_name}")
            return new_user

        except Exception as e:
            self.db.rollback()
            logging.error(f"Error creating user: {str(e)}", exc_info=True)
            if 'duplicate key' in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email or username already exists"
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating user: {str(e)}"
            )

    def update_user(self, user: User, update_data: Dict[str, Any]) -> User:
        try:
            logging.info("Starting update_user function")

            # Check if the new email already exists for a different user
            new_email = update_data.get("email")
            if new_email:
                logging.info(f"Checking for existing user with email: {new_email}")
                existing_user = self.db.query(User).filter(User.email == new_email, User.id != user.id).first()
                if existing_user:
                    logging.warning("Duplicate email detected")
                    raise HTTPException(status_code=400, detail="A user with this email already exists.")

            # Convert roles list to comma-separated string if roles exist
            if "roles" in update_data and isinstance(update_data["roles"], list):
                update_data["roles"] = ','.join(update_data["roles"])
                logging.info(f"Roles converted to string: {update_data['roles']}")

            # Update the user fields
            for key, value in update_data.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
                    logging.info(f"Updated {key} to {value}")

            # Commit changes
            self.db.commit()
            self.db.refresh(user)
            logging.info("User updated successfully")
            return user

        except HTTPException as e:
            # Specifically handle HTTP exceptions
            logging.error(f"HTTPException in update_user: {e.detail}")
            self.db.rollback()
            raise e

        except Exception as e:
            # Catch any other exceptions and log them
            self.db.rollback()
            logging.error(f"Error updating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error updating user"
            )

    def delete_user(self, user: User) -> None:
        try:
            self.db.delete(user)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logging.error(f"Error deleting user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error deleting user"
            )

    def update_last_login(self, user: User) -> None:
        user.last_login = datetime.now(UTC)
        self.db.commit()