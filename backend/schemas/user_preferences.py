from typing import Optional, Dict
from pydantic import BaseModel, Field

class UserPreferencesBase(BaseModel):
    dark_mode: Optional[bool] = False
    theme_preferences: Optional[Dict] = Field(default_factory=dict)

class UserPreferencesCreate(UserPreferencesBase):
    pass

class UserPreferencesUpdate(UserPreferencesBase):
    pass

class UserPreferencesResponse(UserPreferencesBase):
    id: int
    user_id: int

    model_config = {
        "from_attributes": True
    }