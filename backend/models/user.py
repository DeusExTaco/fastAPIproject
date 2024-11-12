import enum

from sqlalchemy import Column, Integer, String, Enum, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class UserStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"


class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    USER = "USER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    user_name = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(60), nullable=False)  # BCrypt hash is always 60 characters
    status = Column(Enum(UserStatus), default=UserStatus.PENDING, nullable=False)
    roles = Column(String(255), nullable=False)  # Store as comma-separated string of uppercase role values
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Fields for password reset
    reset_token = Column(String(64), nullable=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)

    # Store last 5 passwords as JSON
    last_passwords = Column(JSON, default=list)

    cascade = "all, delete-orphan"

    # Existing relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade=cascade)
    addresses = relationship("UserAddress", back_populates="user", cascade=cascade)

    # Add new preferences relationship
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade=cascade)

    def to_dict(self):
        """Convert user object to dictionary for API responses"""
        return {
            "id": self.id,
            "user_name": self.user_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "roles": self.roles,
            "status": self.status.value if isinstance(self.status, UserStatus) else self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }

    @property
    def role_list(self):
        """Convert comma-separated roles string to list of UserRole enums"""
        if not self.roles:
            return []
        return [UserRole(role.strip()) for role in self.roles.split(',')]

    @role_list.setter
    def role_list(self, roles):
        """Convert list of UserRole enums to comma-separated string"""
        if not roles:
            self.roles = ""
        else:
            role_values = [r.value if isinstance(r, UserRole) else r for r in roles]
            self.roles = ','.join(role_values)