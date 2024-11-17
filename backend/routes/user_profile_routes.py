import logging
import json
from typing import List, TypeVar, Type, Optional, Any, Dict, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect, select
from sqlalchemy.sql import func

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

logger = logging.getLogger(__name__)
logger.info("User profile routes module loaded")

router = APIRouter()

ModelType = TypeVar("ModelType", UserProfile, UserAddress)
SchemaType = TypeVar("SchemaType", UserProfileUpdate, UserAddressCreate)


def check_authorization(db: Session, current_user: User, user_id: int, action: str) -> None:
    """Check if user is authorized to perform an action"""
    stmt = select(User).where(
        (User.id == current_user.id) &
        ((User.id == user_id) |
         func.json_contains(User.roles, func.json_quote('ADMIN')))
    )

    authorized_user = db.execute(stmt).scalar_one_or_none()

    if not authorized_user:
        logger.error(f"User {current_user.id} not authorized to {action} for user {user_id}")
        raise HTTPException(status_code=403, detail=f"Not authorized to {action}")


def get_user_or_404(db: Session, user_id: int) -> User:
    """Get user or raise 404"""
    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        logger.error(f"User {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _process_json_field(value: Any, action: str) -> Union[str, dict]:
    """Process a single JSON field based on action type"""
    if action == "serialize":
        if value is None or isinstance(value, str):
            return value or '{}'
        try:
            return json.dumps(value)
        except Exception as e:
            logger.warning(f"Failed to serialize JSON: {e}")
            return '{}'

    # Parse action
    if not value or isinstance(value, dict):
        return value or {}
    try:
        return json.loads(value)
    except Exception as e:
        logger.warning(f"Failed to parse JSON: {e}")
        return {}


def handle_json_fields(data: Dict[str, Any], action: str = "parse") -> Dict[str, Any]:
    """Handle JSON serialization/deserialization for profile fields"""
    json_fields = ['social_media', 'notification_preferences', 'privacy_settings']
    result = data.copy()

    for key in json_fields:
        if key in result:
            result[key] = _process_json_field(result[key], action)

    return result


class CrudOperations:
    def __init__(self, db: Session, model: Type[ModelType], user_id: int, current_user: User):
        self.db = db
        self.model = model
        self.user_id = user_id
        self.current_user = current_user

    def _get_base_query(self, item_id: Optional[int] = None):
        stmt = select(self.model).where(self.model.user_id == self.user_id)
        if item_id is not None:
            stmt = stmt.where(self.model.id == item_id)
        return stmt

    async def get(self, item_id: Optional[int] = None) -> Union[List[Dict[str, Any]], Dict[str, Any]]:
        stmt = self._get_base_query(item_id)
        if item_id is not None:  # Changed this condition
            result = self.db.execute(stmt).scalar_one_or_none()
            if not result:
                raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")
            return self._prepare_response(result)

        results = self.db.execute(stmt).scalars().all()
        return [self._prepare_response(item) for item in results]

    async def create(self, schema_data: SchemaType) -> Dict[str, Any]:
        data_dict = schema_data.model_dump()
        data_dict['user_id'] = self.user_id

        if self.model == UserProfile:
            data_dict = handle_json_fields(data_dict, "serialize")

        item = self.model(**data_dict)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return self._prepare_response(item)

    async def update(self, item_id: int, schema_data: SchemaType) -> Dict[str, Any]:
        stmt = self._get_base_query(item_id)
        item = self.db.execute(stmt).scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")

        update_data = schema_data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")

        if self.model == UserProfile:
            update_data = handle_json_fields(update_data, "serialize")

        for key, value in update_data.items():
            setattr(item, key, value)

        self.db.commit()
        self.db.refresh(item)
        return self._prepare_response(item)

    async def delete(self, item_id: int) -> None:
        stmt = self._get_base_query(item_id)
        item = self.db.execute(stmt).scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} not found")

        self.db.delete(item)
        self.db.commit()

    def _prepare_response(self, item: ModelType) -> Dict[str, Any]:
        """Convert SQLAlchemy model to dictionary and handle JSON fields"""
        result = {c.key: getattr(item, c.key)
                  for c in inspect(item).mapper.column_attrs}

        if self.model == UserProfile:
            result = handle_json_fields(result, "parse")
        return result


async def handle_crud_operation(
        operation: str,
        db: Session,
        model: Type[ModelType],
        user_id: int,
        current_user: User,
        schema_data: Optional[SchemaType] = None,
        item_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """Handler for CRUD operations"""
    try:
        action_map = {"get": "access", "create": "create", "update": "update", "delete": "delete"}
        action = action_map[operation]
        check_authorization(db, current_user, user_id, action)

        if operation in ["create", "update"]:
            get_user_or_404(db, user_id)

        crud = CrudOperations(db, model, user_id, current_user)
        operations = {
            "get": lambda: crud.get(item_id),
            "create": lambda: crud.create(schema_data),
            "update": lambda: crud.update(item_id, schema_data),
            "delete": lambda: crud.delete(item_id)
        }

        return await operations[operation]()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in {operation} operation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during {operation}: {str(e)}"
        )


# Profile routes
@router.get("/users/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get a user's profile"""
    result = await handle_crud_operation("get", db, UserProfile, user_id, current_user)
    if isinstance(result, list) and len(result) > 0:
        return result[0]
    if isinstance(result, dict):
        return result
    raise HTTPException(status_code=404, detail="Profile not found")


@router.put("/users/{user_id}/profile", response_model=UserProfileResponse)
async def update_user_profile(
        user_id: int,
        profile_data: UserProfileUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update a user's profile"""
    result = await handle_crud_operation("update", db, UserProfile, user_id, current_user, profile_data)
    if not result:
        result = await handle_crud_operation("create", db, UserProfile, user_id, current_user, profile_data)
    return result


# Address routes with same pattern
@router.get("/users/{user_id}/addresses", response_model=List[UserAddressResponse])
async def get_user_addresses(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get all addresses for a user"""
    return await handle_crud_operation("get", db, UserAddress, user_id, current_user)


@router.post("/users/{user_id}/addresses", response_model=UserAddressResponse)
async def create_user_address(
        user_id: int,
        address_data: UserAddressCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Create a new address for a user"""
    return await handle_crud_operation("create", db, UserAddress, user_id, current_user, address_data)


@router.put("/users/{user_id}/addresses/{address_id}", response_model=UserAddressResponse)
async def update_user_address(
        user_id: int,
        address_id: int,
        address_data: UserAddressCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update a specific address"""
    return await handle_crud_operation("update", db, UserAddress, user_id, current_user, address_data, address_id)


@router.delete("/users/{user_id}/addresses/{address_id}", status_code=204)
async def delete_user_address(
        user_id: int,
        address_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Delete a specific address"""
    await handle_crud_operation("delete", db, UserAddress, user_id, current_user, item_id=address_id)