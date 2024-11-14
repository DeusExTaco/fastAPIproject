# schemas/user_profile.py
from typing import Optional, Dict
from pydantic import BaseModel, Field, field_validator


class UserAddressBase(BaseModel):
    street: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    state: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)
    postal_code: Optional[str] = Field(default=None)


class UserAddressCreate(UserAddressBase):
    pass


class UserAddressUpdate(UserAddressBase):
    pass


class UserAddressResponse(UserAddressBase):
    id: int
    user_id: int

    model_config = {
        "from_attributes": True
    }


class PrivacySettings(BaseModel):
    profile_visibility: str = Field(default="private")
    show_email: str = Field(default="no")
    show_phone: str = Field(default="no")


class NotificationPreferences(BaseModel):
    email: bool = Field(default=False)
    push: bool = Field(default=False)
    sms: bool = Field(default=False)


class SocialMedia(BaseModel):
    twitter: Optional[str] = Field(default=None)
    linkedin: Optional[str] = Field(default=None)
    github: Optional[str] = Field(default=None)
    instagram: Optional[str] = Field(default=None)


class UserProfileBase(BaseModel):
    date_of_birth: Optional[str] = Field(default=None)
    gender: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)  # Changed from HttpUrl
    bio: Optional[str] = Field(default=None)
    website: Optional[str] = Field(default=None)  # Changed from HttpUrl
    social_media: Optional[Dict] = Field(default_factory=dict)
    notification_preferences: Optional[Dict] = Field(default_factory=dict)
    privacy_settings: Optional[Dict] = Field(default_factory=dict)

    @field_validator('privacy_settings')
    def validate_privacy_settings(cls, v):
        if v is None:
            return {
                "profile_visibility": "private",
                "show_email": "no",
                "show_phone": "no"
            }

        # Convert boolean values to strings
        if 'show_email' in v:
            v['show_email'] = 'yes' if v['show_email'] in [True, 'yes'] else 'no'
        if 'show_phone' in v:
            v['show_phone'] = 'yes' if v['show_phone'] in [True, 'yes'] else 'no'
        if 'profile_visibility' not in v:
            v['profile_visibility'] = 'private'

        return v

    @field_validator('website', 'avatar_url')
    def validate_urls(cls, v):
        if not v:
            return None
        return v


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int

    model_config = {
        "from_attributes": True
    }