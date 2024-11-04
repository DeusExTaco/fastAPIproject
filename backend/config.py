# config.py
from functools import lru_cache
from typing import List, Literal
import os
from pydantic import EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: Literal["development", "staging", "production"]
    DEBUG: bool = Field(default=False, description="Debug mode flag")

    # API Settings
    API_VERSION: str = Field(default="1.0.0", description="API version")
    PROJECT_NAME: str = Field(default="User Authentication API", description="Project name")
    PROJECT_DESCRIPTION: str = Field(
        default="API for user authentication and management"
    )

    # Server Settings
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, ge=1, le=65535, description="Server port")

    # Logging
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    SQLALCHEMY_LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "WARNING"

    # Database Settings
    MYSQL_HOST: str
    MYSQL_PORT: int = Field(..., ge=1, le=65535)
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_DATABASE: str

    # Email Settings
    EMAIL_HOST: str
    EMAIL_PORT: int = Field(..., ge=1, le=65535)
    EMAIL_USERNAME: EmailStr
    EMAIL_PASSWORD: str
    EMAIL_FROM: EmailStr

    # Security Settings
    JWT_PRIVATE_KEY_PATH: str
    JWT_PUBLIC_KEY_PATH: str
    CORS_ORIGINS: str = "*"
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: str = "*"
    CORS_HEADERS: str = "*"

    # Admin Settings
    INITIAL_USER: str
    INITIAL_PASSWORD: str

    # Model config using SettingsConfigDict
    model_config = SettingsConfigDict(
        env_file="../.env",
        case_sensitive=True
    )

    @classmethod
    @field_validator('INITIAL_PASSWORD', mode='before')
    def validate_password(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError('Password must be a string')
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain digit")
        return value

    @classmethod
    @field_validator('JWT_PRIVATE_KEY_PATH', 'JWT_PUBLIC_KEY_PATH', mode='before')
    def validate_file_exists(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError('Path must be a string')
        if not os.path.exists(value):
            raise ValueError(f"File {value} does not exist")
        return value

    # Properties
    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def cors_methods_list(self) -> List[str]:
        if self.CORS_METHODS == "*":
            return ["*"]
        return [method.strip() for method in self.CORS_METHODS.split(",")]

    @property
    def cors_headers_list(self) -> List[str]:
        if self.CORS_HEADERS == "*":
            return ["*"]
        return [header.strip() for header in self.CORS_HEADERS.split(",")]

    @property
    def database_url(self) -> str:
        """Property method using implicit self"""
        return (
            f"mysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        )

    def is_development(self) -> bool:
        """Instance method using self as it operates on an instance"""
        return self.ENVIRONMENT == "development"

    def is_production(self) -> bool:
        """Instance method using self as it operates on an instance"""
        return self.ENVIRONMENT == "production"


# Global Settings Instance
@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()