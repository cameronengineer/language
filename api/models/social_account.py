import uuid
from typing import TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import UniqueConstraint
from datetime import datetime

if TYPE_CHECKING:
    from .user import User

class SocialAccountBase(SQLModel):
    """Base class for SocialAccount"""
    provider: str = Field(description="Social provider name (google, facebook, apple, twitter)")
    provider_user_id: str = Field(description="User ID from the social provider")
    provider_email: str | None = Field(default=None, description="Email from social provider")
    provider_username: str | None = Field(default=None, description="Username from social provider")
    provider_name: str | None = Field(default=None, description="Display name from social provider")
    raw_data: str | None = Field(default=None, description="JSON of additional provider data")
    user_id: uuid.UUID = Field(foreign_key="users.id", description="ID of associated user")

class SocialAccount(SocialAccountBase, table=True):
    """SocialAccount table model"""
    __tablename__ = "social_accounts"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Account link timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    # Relationships
    user: "User" = Relationship(back_populates="social_accounts")
    
    # Unique constraint on provider + provider_user_id
    __table_args__ = (
        UniqueConstraint('provider', 'provider_user_id', name='unique_provider_user'),
    )

class SocialAccountPublic(SQLModel):
    """Public schema for reading SocialAccount"""
    id: uuid.UUID
    provider: str
    provider_username: str | None
    provider_name: str | None
    created_at: datetime