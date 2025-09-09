import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .translation import Translation


class CatalogueBase(SQLModel):
    """Base class for Catalogue with shared fields"""
    name: str = Field(max_length=200, description="Catalogue name")
    description: Optional[str] = Field(None, description="Catalogue description")


class Catalogue(CatalogueBase, table=True):
    """Catalogue table model"""
    
    __tablename__ = "catalogues"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    translations: List["Translation"] = Relationship(back_populates="catalogue")


class CatalogueCreate(CatalogueBase):
    """Schema for creating a Catalogue"""
    pass


class CataloguePublic(CatalogueBase):
    """Public schema for reading a Catalogue"""
    id: uuid.UUID


class CatalogueUpdate(SQLModel):
    """Schema for updating a Catalogue"""
    name: str | None = None
    description: str | None = None