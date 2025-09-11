import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from pydantic import model_validator

if TYPE_CHECKING:
    from .user import User


class StudySessionBase(SQLModel):
    """Base class for StudySession with shared fields"""
    user_id: uuid.UUID = Field(foreign_key="users.id", description="ID of the user who owns this study session")
    start_time: datetime = Field(description="When the study session started")
    stop_time: Optional[datetime] = Field(None, description="When the study session ended (None for active sessions)")


class StudySession(StudySessionBase, table=True):
    """StudySession table model"""
    
    __tablename__ = "study_sessions"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    user: "User" = Relationship(back_populates="study_sessions")


class StudySessionCreate(StudySessionBase):
    """Schema for creating a StudySession"""
    
    @model_validator(mode='after')
    def validate_time_range(self):
        """Ensure stop_time is after start_time when both are present"""
        if self.stop_time is not None and self.stop_time <= self.start_time:
            raise ValueError("stop_time must be after start_time")
        return self


class StudySessionPublic(StudySessionBase):
    """Public schema for reading a StudySession"""
    id: uuid.UUID


class StudySessionUpdate(SQLModel):
    """Schema for updating a StudySession"""
    user_id: uuid.UUID | None = None
    start_time: datetime | None = None
    stop_time: Optional[datetime] | None = None
    
    @model_validator(mode='after')
    def validate_time_range(self):
        """Ensure stop_time is after start_time when both are present"""
        if (self.stop_time is not None and 
            self.start_time is not None and 
            self.stop_time <= self.start_time):
            raise ValueError("stop_time must be after start_time")
        return self