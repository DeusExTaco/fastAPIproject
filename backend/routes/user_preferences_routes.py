import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect

from auth import get_current_user
from database import get_db
from models.user import User
from models.user_preferences import UserPreferences
from schemas.user_preferences import (
    UserPreferencesUpdate,
    UserPreferencesResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


def object_as_dict(obj):
    return {c.key: getattr(obj, c.key)
            for c in inspect(obj).mapper.column_attrs}


@router.get("/users/{user_id}/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get a user's preferences"""
    if current_user.id != user_id and "ADMIN" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Not authorized to access these preferences")

    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    if not preferences:
        # Create default preferences if none exist
        preferences = UserPreferences(user_id=user_id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences


@router.patch("/users/{user_id}/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
        user_id: int,
        preferences_data: UserPreferencesUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update a user's preferences"""
    if current_user.id != user_id and "ADMIN" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Not authorized to update these preferences")

    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    if not preferences:
        preferences = UserPreferences(user_id=user_id)
        db.add(preferences)

    for key, value in preferences_data.model_dump(exclude_unset=True).items():
        setattr(preferences, key, value)

    try:
        db.commit()
        db.refresh(preferences)
        return preferences
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating preferences: {str(e)}"
        )