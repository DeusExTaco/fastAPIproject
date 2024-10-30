import re
import string
from datetime import datetime
from typing import Optional, List
import logging

from fastapi import HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

from models import UserStatus, UserRole

def validate_password_strength(password: str) -> str:
    """
    Validates password strength against defined criteria.
    """
    validations = [
        (len(password) < 16, "Password must be at least 16 characters long."),
        (not re.search(r'[A-Z]', password), "Password must contain at least one uppercase letter."),
        (not re.search(r'[a-z]', password), "Password must contain at least one lowercase letter."),
        (not re.search(r'[0-9]', password), "Password must contain at least one number."),
        (not re.search(r'[%s]' % re.escape(string.punctuation), password),
         "Password must contain at least one special character.")
    ]

    errors = [
        {"field": "password", "msg": msg}
        for condition, msg in validations
        if condition
    ]

    if errors:
        logging.info(f"{errors}")
        raise HTTPException(status_code=422, detail=errors)

    return password

class NewPasswordValidatorMixin:
    """Mixin class for new password validation"""
    @field_validator('new_password')
    def validate_new_password(cls, v):
        return validate_password_strength(v)

class PasswordUpdateRequest(NewPasswordValidatorMixin, BaseModel):
    user_id: Optional[int] = None
    current_password: Optional[str] = None
    new_password: str
    token: Optional[str] = None

    @field_validator('current_password', 'user_id')
    def validate_required_fields(cls, v, field):
        token = getattr(field.data, 'token', None)
        if not token and v is None:
            raise ValueError(f"{field.name} is required when token is not provided")
        return v

class PasswordRecoveryInitRequest(BaseModel):
    """Request to initiate password recovery"""
    email: EmailStr

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    user_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str
    roles: List[UserRole] = Field(default=[UserRole.USER])
    status: UserStatus = Field(default=UserStatus.PENDING)

    @field_validator('password')
    def validate_password(cls, v):
        return validate_password_strength(v)

class UserResponse(UserBase):
    id: int
    status: UserStatus
    roles: List[UserRole]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    username: str
    password: str

# Add this to your existing schema.py, keeping all other classes unchanged

class UserUpdateRequest(BaseModel):
    """Schema for updating user details"""
    """Schema for updating user details"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    status: Optional[UserStatus] = None
    roles: Optional[List[str]] = None

    @field_validator('roles')
    def validate_roles(cls, v):
        if v is not None:
            # Validate each role string against UserRole enum
            valid_roles = set(role.value for role in UserRole)
            for role in v:
                if role.upper() not in valid_roles:
                    raise ValueError(f"Invalid role: {role}. Valid roles are: {', '.join(valid_roles)}")
            return [role.upper() for role in v]
        return v

    @field_validator('status')
    def validate_status(cls, v):
        logging.info(f"Validating status: {v}")
        logging.info(f"Status type: {type(v)}")
        if v is not None:
            try:
                if isinstance(v, UserStatus):
                    logging.info("Status is already a UserStatus enum")
                    return v
                if isinstance(v, str):
                    logging.info("Status is a string, converting to enum")
                    return UserStatus(v)
                logging.info(f"Status is type {type(v)}, converting to string then enum")
                status_str = str(v)
                return UserStatus(status_str)
            except ValueError as e:
                logging.error(f"Status validation error: {str(e)}")
                valid_statuses = ', '.join(status.value for status in UserStatus)
                raise ValueError(f"Invalid status: {v}. Valid statuses are: {valid_statuses}")
        return v

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com",
                "roles": ["USER", "ADMIN"],
                "status": "ACTIVE",
                "user_name": "johndoe"
            }
        }
    )

class UserListResponse(BaseModel):
    """Schema for user list responses"""
    id: int
    user_name: str
    first_name: str
    last_name: str
    email: str
    roles: str
    status: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "user_name": "johndoe",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com",
                "roles": "user",
                "status": "active",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-01T00:00:00Z"
            }
        }
    )