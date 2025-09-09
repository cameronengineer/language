import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .term import Term
    from .user import User


class LanguageBase(SQLModel):
    """Base class for Language with shared fields"""
    code: str = Field(
        index=True,
        unique=True,
        max_length=10,
        description="ISO 639 language code"
    )
    name: str = Field(
        max_length=100,
        description="Language name"
    )


class Language(LanguageBase, table=True):
    """Language table model"""
    
    __tablename__ = "languages"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    terms: List["Term"] = Relationship(back_populates="language")
    native_speakers: List["User"] = Relationship(
        back_populates="native_language",
        sa_relationship_kwargs={"foreign_keys": "[User.native_language_id]"}
    )
    study_speakers: List["User"] = Relationship(
        back_populates="study_language",
        sa_relationship_kwargs={"foreign_keys": "[User.study_language_id]"}
    )


class LanguageCreate(LanguageBase):
    """Schema for creating a Language"""
    pass


class LanguagePublic(LanguageBase):
    """Public schema for reading a Language"""
    id: uuid.UUID


class LanguageUpdate(SQLModel):
    """Schema for updating a Language"""
    code: str | None = None
    name: str | None = None