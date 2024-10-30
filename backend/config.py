# backend/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os
from dotenv import load_dotenv

# Load .env file from project root
load_dotenv(dotenv_path="../.env")


class Settings(BaseSettings):
    # API Settings
    API_VERSION: str = "1.0.0"
    PROJECT_NAME: str = "User Authentication API"
    PROJECT_DESCRIPTION: str = "API for user authentication and management"

    # Environment Settings
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # CORS Settings
    CORS_ORIGINS: str = "*"
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: str = "*"
    CORS_HEADERS: str = "*"

    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database Settings
    MYSQL_HOST: str
    MYSQL_PORT: int
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_DATABASE: str

    # JWT Settings
    JWT_PRIVATE_KEY_PATH: str
    JWT_PUBLIC_KEY_PATH: str

    # Email Settings
    EMAIL_HOST: str
    EMAIL_PORT: int
    EMAIL_USERNAME: str
    EMAIL_PASSWORD: str
    EMAIL_FROM: str

    # Initial Admin Settings
    INITIAL_USER: str
    INITIAL_PASSWORD: str

    class Config:
        env_file = "../.env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def cors_methods_list(self) -> List[str]:
        """Convert CORS_METHODS string to list"""
        if self.CORS_METHODS == "*":
            return ["*"]
        return [method.strip() for method in self.CORS_METHODS.split(",")]

    @property
    def cors_headers_list(self) -> List[str]:
        """Convert CORS_HEADERS string to list"""
        if self.CORS_HEADERS == "*":
            return ["*"]
        return [header.strip() for header in self.CORS_HEADERS.split(",")]

    @property
    def database_url(self) -> str:
        """Construct database URL"""
        return f"mysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    """
    return Settings()