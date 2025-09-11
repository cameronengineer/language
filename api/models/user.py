import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from pydantic import EmailStr
from datetime import datetime

if TYPE_CHECKING:
    from .language import Language
    from .translation import Translation
    from .study_session import StudySession
    from .social_account import SocialAccount


class UserBase(SQLModel):
    """Base class for User with shared fields"""
    username: str = Field(index=True, unique=True, description="Unique username")
    email: str = Field(index=True, unique=True, description="User email address")
    first_name: str = Field(description="User's first name")
    last_name: str = Field(description="User's last name")
    native_language_id: uuid.UUID = Field(foreign_key="languages.id", description="ID of user's native language")
    study_language_id: uuid.UUID = Field(foreign_key="languages.id", description="ID of user's study language")
    
    # Authentication fields
    is_active: bool = Field(default=True, description="User account status")
    email_verified: bool = Field(default=True, description="Email verification status")
    profile_picture_url: str | None = Field(default=None, description="User profile picture URL")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Account creation timestamp")
    last_login: datetime | None = Field(default=None, description="Last login timestamp")


class User(UserBase, table=True):
    """User table model"""
    
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    native_language: "Language" = Relationship(
        back_populates="native_speakers",
        sa_relationship_kwargs={"foreign_keys": "[User.native_language_id]"}
    )
    study_language: "Language" = Relationship(
        back_populates="study_speakers",
        sa_relationship_kwargs={"foreign_keys": "[User.study_language_id]"}
    )
    translations: List["Translation"] = Relationship(back_populates="user")
    study_sessions: List["StudySession"] = Relationship(back_populates="user")
    
    # New authentication relationships
    social_accounts: List["SocialAccount"] = Relationship(back_populates="user", cascade_delete=True)


class UserCreate(SQLModel):
    """Schema for creating a User (for social login)"""
    first_name: str
    last_name: str
    native_language_id: uuid.UUID
    study_language_id: uuid.UUID


class UserPublic(UserBase):
    """Public schema for reading a User"""
    id: uuid.UUID


class UserUpdate(SQLModel):
    """Schema for updating a User"""
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    native_language_id: uuid.UUID | None = None
    study_language_id: uuid.UUID | None = None
    profile_picture_url: str | None = None