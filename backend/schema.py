import re
import string
from datetime import datetime
from typing import Optional, List
import logging

from fastapi import HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator

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

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    status: Optional[UserStatus] = None
    roles: Optional[List[UserRole]] = None

    class Config:
        use_enum_values = True