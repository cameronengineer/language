import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .term import Term


class TypeBase(SQLModel):
    """Base class for Type with shared fields"""
    name: str = Field(
        max_length=50,
        description="Grammatical type name"
    )


class Type(TypeBase, table=True):
    """Type table model"""
    
    __tablename__ = "types"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    terms: List["Term"] = Relationship(back_populates="type")


class TypeCreate(TypeBase):
    """Schema for creating a Type"""
    pass


class TypePublic(TypeBase):
    """Public schema for reading a Type"""
    id: uuid.UUID


class TypeUpdate(SQLModel):
    """Schema for updating a Type"""
    name: str | None = None