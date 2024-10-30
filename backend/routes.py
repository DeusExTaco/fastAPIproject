import logging
import secrets
from typing import List, Optional
import base64

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from starlette import status
from datetime import datetime, timedelta, UTC
from pydantic import BaseModel
from models import UserStatus


from templates.email.password_reset_template import send_recovery_email
from templates.email.welcome_template import send_welcome_email
import models
import schema
from auth import get_current_user, check_admin, create_token
from database import get_db
from models import User, UserRole
from random_password import PasswordGenerator
from schema import (UserResponse, UserLogin, UserUpdateRequest,
                    PasswordUpdateRequest, PasswordRecoveryInitRequest)

router = APIRouter()

class UserListResponse(BaseModel):
    id: int
    user_name: str
    first_name: str
    last_name: str
    email: str
    roles: str
    status: str
    created_at: datetime | None
    last_login: datetime | None

    class Config:
        from_attributes = True


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

    def update_user(self, user: User, update_data: dict) -> User:
        """
        Update user with the provided data

        Args:
            user: User object to update
            update_data: Dictionary containing the fields to update

        Returns:
            Updated User object
        """
        # Convert roles to string format if present in update data
        if 'roles' in update_data and update_data['roles']:
            if isinstance(update_data['roles'], list):
                update_data['roles'] = ','.join([role.value for role in update_data['roles']])

        # Update user attributes
        for key, value in update_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)

        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            logging.error(f"Error updating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error updating user"
            )


@router.post("/password-recovery", status_code=status.HTTP_200_OK)
async def password_recovery(
        request: PasswordRecoveryInitRequest,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    logging.info(f"Password recovery requested for email: {request.email}")
    user_service = UserService(db)
    user = user_service.get_user_by_email(request.email)

    if not user:
        logging.warning(f"Password recovery requested for non-existent email: {request.email}")
        return {"message": "If the email exists, a recovery link will be sent."}

    # Generate a secure token and set an expiry time of 1 hour from now
    token = secrets.token_urlsafe(32)
    expiry_time = db.query(func.now() + text("INTERVAL 1 HOUR")).scalar()

    # Store the token and its expiry time in the user record
    user.reset_token = token
    user.reset_token_expiry = expiry_time
    db.commit()

    try:
        # Now using the template-specific function
        background_tasks.add_task(send_recovery_email, user.email, token)
        logging.info(f"Recovery email task added for user {user.id}")
        return {"message": "If the email exists, a recovery link will be sent."}
    except Exception as e:
        logging.error(f"Error sending recovery email: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while sending the recovery email.")



@router.post("/update-password", status_code=status.HTTP_200_OK)
async def update_password(
        request: PasswordUpdateRequest,
        db: Session = Depends(get_db)
):
    logging.info("Received password update request")

    try:
        # Check if this is a token-based reset
        if request.token:
            try:
                token = base64.urlsafe_b64decode(request.token.encode()).decode()
            except ValueError:
                token = request.token

            user = UserService(db).get_user_by_reset_token(token)
            if not user:
                raise HTTPException(status_code=400, detail="Invalid reset token")

            # Verify token expiry
            current_time = db.query(func.now()).scalar()
            if user.reset_token_expiry < current_time:
                raise HTTPException(status_code=400, detail="Reset token has expired")

        # Check if this is a password change
        elif request.user_id and request.current_password:
            user = UserService(db).get_user_by_id(request.user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            if not PasswordService.verify_password(request.current_password, user.hashed_password):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
        else:
            raise HTTPException(status_code=400, detail="Invalid request parameters")

        # Common password update logic
        if not PasswordService.check_password_history(request.new_password, user.last_passwords):
            raise HTTPException(status_code=400, detail="You cannot use any of your last 5 passwords.")

        new_last_passwords = PasswordService.update_password_history(
            user.hashed_password,
            user.last_passwords
        )
        new_hashed_password = PasswordService.hash_password(request.new_password)
        new_last_passwords.append(new_hashed_password)

        # Update user record
        update_data = {
            "hashed_password": new_hashed_password,
            "last_passwords": new_last_passwords,
        }

        # If this was a token-based reset, check if it's a new user setup
        if request.token:
            update_data.update({
                "reset_token": None,
                "reset_token_expiry": None
            })

            # If user's status is pending, change it to active
            if user.status == UserStatus.PENDING:
                update_data["status"] = UserStatus.ACTIVE
                logging.info(f"Activating user account for {user.email}")

        db.query(User).filter(User.id == user.id).update(
            update_data,
            synchronize_session="fetch"
        )
        db.commit()

        return {
            "message": "Password updated successfully",
            "require_relogin": bool(request.current_password),
            "status_updated": user.status == UserStatus.PENDING
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error during password update: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while updating the password."
        )


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


# Test route
@router.get("/")
async def read_root():
    return {"message": "Hello from FastAPI!"}


# Login
@router.post("/login", status_code=status.HTTP_200_OK)
def login(user_login: UserLogin, db: Session = Depends(get_db)):

    user_service = UserService(db)
    user = user_service.get_user_by_username(user_login.username)

    logging.info(f"Login attempt for username: {user_login.username}")

    if not user or not PasswordService.verify_password(user_login.password, user.hashed_password):
        logging.warning(f"Failed login attempt for username: {user_login.username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Update last login time
    user.last_login = datetime.now(UTC)
    db.commit()

    # Normalize user roles
    if isinstance(user.roles, str):
        user_roles = [role.strip() for role in user.roles.split(',')]
    else:
        user_roles = [role.strip() for role in user.roles]

    logging.info(f"User roles for {user.user_name}: {user_roles}")

    # Create token data with proper role format
    token_data = {
        "sub": user.user_name,
        "roles": user_roles,
        "user_id": user.id
    }

    token = create_token(token_data)
    logging.info(f"Generated token for user {user.user_name} with roles {user_roles}")

    return {
        "message": "Login successful",
        "user_id": user.id,
        "roles": user_roles,
        "access_token": token,
        "token_type": "bearer"
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
def delete_user(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Delete a user - Admin only endpoint
    """
    logging.info(f"Delete user request received for user_id: {user_id} from user: {current_user.user_name}")

    try:
        # Verify admin access
        check_admin(current_user)

        user_service = UserService(db)
        user_to_delete = user_service.get_user_by_id(user_id)

        if not user_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if user_to_delete.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )

        db.delete(user_to_delete)
        db.commit()

        logging.info(f"Successfully deleted user {user_id}")
        # For 204 No Content, we simply return None
        return None

    except HTTPException as http_exc:
        logging.error(f"HTTP error in delete_user: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logging.error(f"Unexpected error in delete_user: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while deleting the user: {str(e)}"
        )

# Update user
@router.put("/users/{user_id}", response_model=UserResponse, status_code=status.HTTP_202_ACCEPTED)
async def edit_user(
        user_id: int,
        user_update: UserUpdateRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Update user details - Admin only endpoint
    """
    logging.info(f"Edit user request received for user_id: {user_id}")
    logging.info(f"Update data received: {user_update.model_dump()}")

    try:
        # Verify admin access
        check_admin(current_user)

        user_service = UserService(db)
        db_user = user_service.get_user_by_id(user_id)

        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Convert the Pydantic model to a dictionary and remove None values
        update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}

        # Handle roles conversion
        if 'roles' in update_data and update_data['roles']:
            try:
                # Validate each role
                roles = [role for role in update_data['roles']]
                valid_roles = {role.value for role in UserRole}
                invalid_roles = [role for role in roles if role not in valid_roles]

                if invalid_roles:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid roles: {', '.join(invalid_roles)}"
                    )

                update_data['roles'] = ','.join(roles)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid role format: {str(e)}"
                )

        # Handle status conversion
        if 'status' in update_data and update_data['status']:
            try:
                # Handle both string and enum cases
                if isinstance(update_data['status'], str):
                    status_value = update_data['status']
                elif isinstance(update_data['status'], UserStatus):
                    status_value = update_data['status'].value
                else:
                    status_value = str(update_data['status'])

                # Validate the status
                try:
                    update_data['status'] = UserStatus(status_value)
                except ValueError:
                    valid_statuses = ', '.join(status.value for status in UserStatus)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid status: {status_value}. Valid statuses are: {valid_statuses}"
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status format: {str(e)}"
                )

        logging.info(f"Processed update data: {update_data}")

        try:
            updated_user = user_service.update_user(db_user, update_data)

            # Format the response
            response_data = {
                "id": updated_user.id,
                "user_name": updated_user.user_name,
                "first_name": updated_user.first_name,
                "last_name": updated_user.last_name,
                "email": updated_user.email,
                "roles": updated_user.roles.split(',') if updated_user.roles else [],
                "status": updated_user.status.value,
                "created_at": updated_user.created_at,
                "updated_at": updated_user.updated_at,
                "last_login": updated_user.last_login
            }

            return response_data

        except Exception as e:
            logging.error(f"Error updating user: {str(e)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

    except HTTPException as http_exc:
        logging.error(f"HTTP error in edit_user: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logging.error(f"Unexpected error in edit_user: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/resend-password-recovery")
def resend_password_recovery(
    request: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    user = user_service.get_user_by_email(request.get("email"))

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Regenerate a new reset token for security
    new_reset_token = secrets.token_urlsafe(32)
    reset_token_expiry = db.query(func.now() + text("INTERVAL 1 HOUR")).scalar()

    user.reset_token = new_reset_token
    user.reset_token_expiry = reset_token_expiry
    db.commit()

    # Now using the template-specific function
    background_tasks.add_task(send_recovery_email, request.get("email"), new_reset_token)

    return {"message": f"Password recovery email resent to {request.get('email')}"}


@router.post("/check-password-history", status_code=status.HTTP_200_OK)
async def check_password_history(request: dict, db: Session = Depends(get_db)):
    """
    Check if a password exists in the user's password history
    """
    logging.info("Checking password history")

    if not request.get("user_id"):
        raise HTTPException(status_code=400, detail="User ID is required")
    if not request.get("new_password"):
        raise HTTPException(status_code=400, detail="New password is required")

    try:
        user_service = UserService(db)
        user = user_service.get_user_by_id(request.get("user_id"))

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if the new password matches any in the history
        if not PasswordService.check_password_history(
                request.get("new_password"),
                user.last_passwords or []
        ):
            raise HTTPException(
                status_code=400,
                detail="Password found in history"
            )

        return {"message": "Password not found in history"}
    except Exception as e:
        logging.error(f"Error checking password history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while checking password history"
        )


@router.post("/users")
async def create_user(
        user_data: schema.UserCreate,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    Create a new user with admin privileges required.
    Also sends a password reset email to the new user.
    """
    logging.info(f"Create user request received from user: {current_user.user_name}")
    logging.info(f"Current user roles: {current_user.roles}")
    logging.info(f"Request data: {user_data}")

    try:
        # Verify admin access
        check_admin(current_user)

        # Check if user already exists
        existing_user = db.query(models.User).filter(
            (models.User.email == user_data.email) |
            (models.User.user_name == user_data.user_name)
        ).first()

        if existing_user:
            logging.warning(f"Attempt to create duplicate user: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )

        # Convert roles to string format for database storage
        roles_str = ",".join([role.value for role in user_data.roles])
        logging.info(f"Processed roles for new user: {roles_str}")

        # Generate reset token first
        reset_token = secrets.token_urlsafe(32)
        reset_token_expiry = datetime.now(UTC) + timedelta(hours=24)

        # Create new user instance with token
        new_user = models.User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            user_name=user_data.user_name,
            email=user_data.email,
            hashed_password=PasswordService.hash_password(user_data.password),
            roles=roles_str,
            status=user_data.status.value if user_data.status else models.UserStatus.PENDING.value,
            reset_token=reset_token,
            reset_token_expiry=reset_token_expiry
        )

        try:
            # Add and commit in a single transaction
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            logging.info(f"Successfully created new user: {new_user.user_name}")

            # Now using the template-specific function
            try:
                background_tasks.add_task(
                    send_welcome_email,
                    email=new_user.email,
                    token=reset_token,
                    username=new_user.user_name
                )
                logging.info(f"Queued welcome email for: {new_user.email}")
            except Exception as e:
                logging.error(f"Error queuing welcome email: {str(e)}")
                # Don't raise an exception here, as the user is already created

            # Return success response
            return {
                "message": "User created successfully and welcome email queued",
                "user_id": new_user.id,
                "username": new_user.user_name,
                "email": new_user.email,
                "status": new_user.status,
                "roles": new_user.roles.split(',') if new_user.roles else []
            }

        except Exception as e:
            db.rollback()
            logging.error(f"Database error while creating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error occurred while creating user"
            )

    except HTTPException as http_exc:
        logging.error(f"HTTP error in create_user: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logging.error(f"Unexpected error in create_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )



@router.get("/users", response_model=List[UserListResponse])
async def get_all_users(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get all users - Admin only endpoint
    """
    try:
        # Log the attempt
        logging.info(f"User {current_user.user_name} attempting to fetch all users")

        # Verify admin access
        if 'admin' not in current_user.roles.lower():
            logging.warning(f"Non-admin user {current_user.user_name} attempted to fetch users")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )

        # Query all users
        users = db.query(User).all()
        logging.info(f"Successfully fetched {len(users)} users")

        # Return the users
        return users

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e:
        # Log the error
        logging.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )