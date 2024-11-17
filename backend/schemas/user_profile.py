from typing import Optional, Dict
from pydantic import BaseModel, HttpUrl

class UserAddressBase(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

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

class UserProfileBase(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None
    bio: Optional[str] = None
    website: Optional[HttpUrl] = None
    social_media: Optional[Dict[str, str]] = None
    notification_preferences: Optional[Dict[str, bool]] = None
    privacy_settings: Optional[Dict[str, str]] = None

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