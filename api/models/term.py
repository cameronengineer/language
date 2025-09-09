import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .language import Language
    from .type import Type
    from .translation import Translation


class TermBase(SQLModel):
    """Base class for Term with shared fields"""
    text: str = Field(description="The term text")
    language_id: uuid.UUID = Field(foreign_key="languages.id", description="Language ID this term belongs to")
    type_id: uuid.UUID = Field(foreign_key="types.id", description="Grammatical type ID of this term")


class Term(TermBase, table=True):
    """Term table model"""
    
    __tablename__ = "terms"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    language: "Language" = Relationship(back_populates="terms")
    type: "Type" = Relationship(back_populates="terms")
    study_translations: List["Translation"] = Relationship(
        back_populates="study_term",
        sa_relationship_kwargs={"foreign_keys": "[Translation.study_term_id]"}
    )
    native_translations: List["Translation"] = Relationship(
        back_populates="native_term",
        sa_relationship_kwargs={"foreign_keys": "[Translation.native_term_id]"}
    )


class TermCreate(TermBase):
    """Schema for creating a Term"""
    pass


class TermPublic(TermBase):
    """Public schema for reading a Term"""
    id: uuid.UUID


class TermUpdate(SQLModel):
    """Schema for updating a Term"""
    text: str | None = None
    language_id: uuid.UUID | None = None
    type_id: uuid.UUID | None = None