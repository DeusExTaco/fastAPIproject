from pydantic import BaseModel, EmailStr, Field, constr, field_validator, ValidationError
from datetime import datetime
from models import UserStatus, UserRole
from typing import Optional, List
from fastapi import HTTPException
import re
import string

def validate_password_strength(password: str) -> str:
    """
    Validates password strength against defined criteria.
    Returns the password if valid, raises HTTPException if invalid.
    """
    errors = []

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
        raise HTTPException(status_code=422, detail=errors)

    return password

class PasswordValidatorMixin:
    """Mixin class for single password validation"""
    @field_validator('password')
    def validate_password(cls, v):
        return validate_password_strength(v)

class NewPasswordValidatorMixin:
    """Mixin class for new password validation"""
    @field_validator('new_password')
    def validate_new_password(cls, v):
        return validate_password_strength(v)

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    user_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr


class UserCreate(UserBase, PasswordValidatorMixin):
    password: str
    roles: List[UserRole] = Field(default=[UserRole.USER])
    status: UserStatus = Field(default=UserStatus.PENDING)


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

class ChangePasswordRequest(NewPasswordValidatorMixin, BaseModel):
    user_id: int
    current_password: str
    new_password: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    status: Optional[UserStatus] = None
    roles: Optional[List[UserRole]] = None

    class Config:
        use_enum_values = True

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(NewPasswordValidatorMixin, BaseModel):
    token: str
    new_password: str