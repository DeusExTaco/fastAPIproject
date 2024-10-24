
from sqlalchemy import Column, Integer, String, Enum, DateTime, JSON, MetaData
from sqlalchemy.sql import func
# from database import Base
from sqlalchemy.ext.declarative import declarative_base
import enum

# Create a single MetaData instance
metadata = MetaData()

# Create a single Base instance
Base = declarative_base(metadata=metadata)

class UserStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class UserRole(enum.Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    user_name = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(60), nullable=False)  # BCrypt hash is always 60 characters
    status = Column(Enum(UserStatus), default=UserStatus.PENDING, nullable=False)
    roles = Column(String(255), nullable=False)  # Store as comma-separated string
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    #  Fields for password reset
    reset_token = Column(String(64), nullable=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)

    # Store last 5 passwords as JSON
    last_passwords = Column(JSON, default=list)  # Initialize to an empty list by default