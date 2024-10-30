# routes/user_routes.py
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from typing import List
from sqlalchemy.orm import Session
from database import get_db
from services.user_service import UserService
from auth import get_current_user, check_admin
from models import User
from schema import UserCreate, UserResponse, UserUpdateRequest, UserListResponse
from templates.email.welcome_template import send_welcome_email

router = APIRouter(tags=["users"])


@router.get("/", response_model=List[UserListResponse])
async def get_all_users(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    check_admin(current_user)
    user_service = UserService(db)
    return user_service.get_all_users()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    check_admin(current_user)
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# routes/user_routes.py
@router.post("/", response_model=UserResponse)
async def create_user(
        user_data: UserCreate,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new user with enhanced error handling and logging"""
    try:
        logging.info(f"Create user request received from admin: {current_user.user_name}")
        logging.info(f"Raw user data received: {user_data.model_dump(exclude={'password'})}")

        # Verify admin access
        check_admin(current_user)

        # Convert the Pydantic model to dict
        user_dict = user_data.model_dump()
        logging.info(f"Converted user data: {user_dict}")

        user_service = UserService(db)

        # Check for existing user
        if user_service.get_user_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        if user_service.get_user_by_username(user_data.user_name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )

        # Create user
        new_user = user_service.create_user(user_dict)

        # Queue welcome email
        try:
            background_tasks.add_task(
                send_welcome_email,
                email=new_user.email,
                token=new_user.reset_token,
                username=new_user.user_name
            )
            logging.info(f"Welcome email queued for: {new_user.email}")
        except Exception as email_error:
            logging.error(f"Error queuing welcome email: {str(email_error)}")
            # Don't fail the request if email queuing fails

        return new_user

    except HTTPException as http_exc:
        logging.error(f"HTTP error in create_user: {http_exc.detail}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error in create_user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
        user_id: int,
        user_update: UserUpdateRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    check_admin(current_user)
    user_service = UserService(db)

    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    return user_service.update_user(user, update_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    check_admin(current_user)
    user_service = UserService(db)

    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user_service.delete_user(user)