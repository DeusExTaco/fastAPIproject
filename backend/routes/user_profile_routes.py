import logging
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect

from auth import get_current_user
from database import get_db
from models.user import User
from models.user_profile import UserProfile, UserAddress
from schemas.user_profile import (
    UserProfileUpdate,
    UserProfileResponse,
    UserAddressCreate,
    UserAddressResponse
)

# Get module logger
logger = logging.getLogger(__name__)

# Test log message on module import
logger.info("User profile routes module loaded")

router = APIRouter()

def object_as_dict(obj):
    """Convert SQLAlchemy object to dictionary"""
    return {c.key: getattr(obj, c.key)
            for c in inspect(obj).mapper.column_attrs}

# Profile routes
@router.get("/users/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get a user's profile"""
    logger.info(f"Fetching profile for user_id: {user_id}")

    if current_user.id != user_id and "ADMIN" not in current_user.roles:
        logger.error(f"User {current_user.id} not authorized to access profile for user {user_id}")
        raise HTTPException(status_code=403, detail="Not authorized to access this profile")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        logger.error(f"Profile not found for user {user_id}")
        raise HTTPException(status_code=404, detail="Profile not found")

    result_dict = object_as_dict(profile)
    # Convert JSON strings to dictionaries
    for key in ['social_media', 'notification_preferences', 'privacy_settings']:
        if result_dict[key]:
            try:
                result_dict[key] = json.loads(result_dict[key])
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON for {key}, defaulting to empty dict")
                result_dict[key] = {}

    logger.info(f"Found profile: {result_dict}")
    return result_dict


@router.put("/users/{user_id}/profile", response_model=UserProfileResponse)
async def update_user_profile(
        user_id: int,
        profile_data: UserProfileUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update a user's profile"""
    logger.info("=" * 50)
    logger.info("PROFILE UPDATE REQUEST STARTED")
    logger.info(f"User ID: {user_id}")
    logger.info(f"Current User ID: {current_user.id}")
    logger.info(f"Profile Data: {profile_data.model_dump()}")
    logger.info("=" * 50)

    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(">>> USER NOT FOUND <<<")
            raise HTTPException(status_code=404, detail="User not found")

        # Check authorization
        if current_user.id != user_id and "ADMIN" not in current_user.roles:
            logger.error(">>> UNAUTHORIZED ACCESS ATTEMPT <<<")
            raise HTTPException(status_code=403, detail="Not authorized to update this profile")

        # Get existing profile or create new one
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

        update_data = profile_data.model_dump(exclude_unset=True)
        if not update_data:
            logger.warning("No data provided for update")
            raise HTTPException(status_code=400, detail="No data provided for update")

        if profile:
            logger.info(">>> UPDATING EXISTING PROFILE <<<")
            logger.info(f"Current profile state: {object_as_dict(profile)}")

            # Handle JSON fields
            for key in ['social_media', 'notification_preferences', 'privacy_settings']:
                if key in update_data and update_data[key] is not None:
                    update_data[key] = json.dumps(update_data[key])
                    logger.info(f"Converting {key} to JSON: {update_data[key]}")

            logger.info(f"Applying updates: {update_data}")

            for key, value in update_data.items():
                setattr(profile, key, value)
                logger.info(f"Updated {key} = {value}")
        else:
            logger.info(">>> CREATING NEW PROFILE <<<")
            profile_dict = profile_data.model_dump()
            profile_dict['user_id'] = user_id

            # Handle JSON fields
            for key in ['social_media', 'notification_preferences', 'privacy_settings']:
                if profile_dict.get(key) is not None:
                    profile_dict[key] = json.dumps(profile_dict[key])
                else:
                    profile_dict[key] = '{}'
                logger.info(f"Setting {key} = {profile_dict[key]}")

            logger.info(f"Creating profile with: {profile_dict}")
            profile = UserProfile(**profile_dict)
            db.add(profile)

        db.commit()
        db.refresh(profile)
        logger.info("Database commit successful")

        # Prepare response
        result_dict = object_as_dict(profile)
        for key in ['social_media', 'notification_preferences', 'privacy_settings']:
            if result_dict[key]:
                try:
                    result_dict[key] = json.loads(result_dict[key])
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse JSON for {key}")
                    result_dict[key] = {}

        logger.info("=" * 50)
        logger.info("PROFILE UPDATE COMPLETED SUCCESSFULLY")
        logger.info(f"Final profile state: {result_dict}")
        logger.info("=" * 50)

        return result_dict

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error("=" * 50)
        logger.error(">>> ERROR IN PROFILE UPDATE <<<")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error("=" * 50)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )

# Address routes
@router.get("/users/{user_id}/addresses", response_model=List[UserAddressResponse])
async def get_user_addresses(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get all addresses for a user"""
    if current_user.id != user_id and "ADMIN" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Not authorized to access these addresses")

    addresses = db.query(UserAddress).filter(UserAddress.user_id == user_id).all()
    return addresses


@router.post("/users/{user_id}/addresses", response_model=UserAddressResponse)
async def create_user_address(
        user_id: int,
        address_data: UserAddressCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Create a new address for a user"""
    logger.info(f"Creating address for user_id: {user_id}")
    logger.info(f"Address data received: {address_data.model_dump()}")

    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")

        # Check authorization
        if current_user.id != user_id and "ADMIN" not in current_user.roles:
            logger.error(f"User {current_user.id} not authorized to create address for user {user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to create address")

        # Create new address
        address_dict = address_data.model_dump()
        address_dict['user_id'] = user_id

        logger.info(f"Creating address with data: {address_dict}")
        address = UserAddress(**address_dict)

        try:
            db.add(address)
            db.commit()
            db.refresh(address)
            logger.info("Successfully committed new address")
        except Exception as e:
            logger.error(f"Database error while saving address: {str(e)}")
            raise

        result = object_as_dict(address)
        logger.info(f"Created address: {result}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating address: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating address: {str(e)}"
        )


@router.put("/users/{user_id}/addresses/{address_id}", response_model=UserAddressResponse)
async def update_user_address(
        user_id: int,
        address_id: int,
        address_data: UserAddressCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update a specific address"""
    if current_user.id != user_id and "ADMIN" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Not authorized to update this address")

    address = db.query(UserAddress).filter(
        UserAddress.id == address_id,
        UserAddress.user_id == user_id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    for key, value in address_data.model_dump(exclude_unset=True).items():
        setattr(address, key, value)

    try:
        db.commit()
        db.refresh(address)
        return address
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/users/{user_id}/addresses/{address_id}", status_code=204)
async def delete_user_address(
        user_id: int,
        address_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Delete a specific address"""
    if current_user.id != user_id and "ADMIN" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Not authorized to delete this address")

    address = db.query(UserAddress).filter(
        UserAddress.id == address_id,
        UserAddress.user_id == user_id
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    try:
        db.delete(address)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))