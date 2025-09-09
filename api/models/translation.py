import uuid
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from pydantic import model_validator

if TYPE_CHECKING:
    from .term import Term
    from .user import User
    from .catalogue import Catalogue


class TranslationBase(SQLModel):
    """Base class for Translation with shared fields"""
    study_term_id: uuid.UUID = Field(foreign_key="terms.id", description="ID of the study language term")
    native_term_id: uuid.UUID = Field(foreign_key="terms.id", description="ID of the native language term")
    is_custom: bool = Field(default=False, description="Whether this is a custom user translation")
    catalogue_id: Optional[uuid.UUID] = Field(None, foreign_key="catalogues.id", description="ID of the catalogue (if not custom)")
    user_id: Optional[uuid.UUID] = Field(None, foreign_key="users.id", description="ID of the user (if custom)")


class Translation(TranslationBase, table=True):
    """Translation table model"""
    
    __tablename__ = "translations"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    study_term: "Term" = Relationship(
        back_populates="study_translations",
        sa_relationship_kwargs={"foreign_keys": "[Translation.study_term_id]"}
    )
    native_term: "Term" = Relationship(
        back_populates="native_translations",
        sa_relationship_kwargs={"foreign_keys": "[Translation.native_term_id]"}
    )
    catalogue: Optional["Catalogue"] = Relationship(back_populates="translations")
    user: Optional["User"] = Relationship(back_populates="translations")


class TranslationCreate(TranslationBase):
    """Schema for creating a Translation"""
    
    @model_validator(mode='after')
    def validate_custom_or_catalogue(self):
        """Ensure translation is either custom OR from catalogue, not both"""
        if self.is_custom and self.catalogue_id:
            raise ValueError("Translation cannot be both custom and from a catalogue")
        if self.is_custom and not self.user_id:
            raise ValueError("Custom translations must have a user_id")
        if not self.is_custom and not self.catalogue_id:
            raise ValueError("Non-custom translations must have a catalogue_id")
        return self


class TranslationPublic(TranslationBase):
    """Public schema for reading a Translation"""
    id: uuid.UUID


class TranslationUpdate(SQLModel):
    """Schema for updating a Translation"""
    study_term_id: uuid.UUID | None = None
    native_term_id: uuid.UUID | None = None
    is_custom: bool | None = None
    catalogue_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None