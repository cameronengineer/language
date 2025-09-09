import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep, get_session
from models.catalogue import Catalogue, CatalogueCreate, CataloguePublic, CatalogueUpdate

router = APIRouter(
    prefix="/catalogues",
    tags=["catalogues"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[CataloguePublic])
def read_catalogues(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
):
    """Get all catalogues"""
    catalogues = session.exec(select(Catalogue).offset(skip).limit(limit)).all()
    return catalogues


@router.get("/{catalogue_id}", response_model=CataloguePublic)
def read_catalogue(
    catalogue_id: uuid.UUID,
    session: SessionDep
):
    """Get a specific catalogue by ID"""
    catalogue = session.get(Catalogue, catalogue_id)
    if not catalogue:
        raise HTTPException(status_code=404, detail="Catalogue not found")
    return catalogue


@router.get("/search/{search_term}", response_model=List[CataloguePublic])
def search_catalogues(
    search_term: str,
    session: SessionDep
):
    """Search catalogues by name or description"""
    statement = select(Catalogue).where(
        (Catalogue.name.contains(search_term)) |
        (Catalogue.description.contains(search_term))
    )
    catalogues = session.exec(statement).all()
    return catalogues


@router.post("/", response_model=CataloguePublic)
def create_catalogue(
    catalogue: CatalogueCreate,
    session: SessionDep
):
    """Create a new catalogue"""
    # Create the catalogue using model_validate
    db_catalogue = Catalogue.model_validate(catalogue)
    session.add(db_catalogue)
    session.commit()
    session.refresh(db_catalogue)
    return db_catalogue


@router.patch("/{catalogue_id}", response_model=CataloguePublic)
def update_catalogue(
    catalogue_id: uuid.UUID,
    catalogue_update: CatalogueUpdate,
    session: SessionDep
):
    """Update a catalogue"""
    catalogue = session.get(Catalogue, catalogue_id)
    if not catalogue:
        raise HTTPException(status_code=404, detail="Catalogue not found")
    
    # Update with only the fields that were set
    catalogue_data = catalogue_update.model_dump(exclude_unset=True)
    for key, value in catalogue_data.items():
        setattr(catalogue, key, value)
    session.add(catalogue)
    session.commit()
    session.refresh(catalogue)
    return catalogue


@router.delete("/{catalogue_id}")
def delete_catalogue(
    catalogue_id: uuid.UUID,
    session: SessionDep
):
    """Delete a catalogue"""
    catalogue = session.get(Catalogue, catalogue_id)
    if not catalogue:
        raise HTTPException(status_code=404, detail="Catalogue not found")
    session.delete(catalogue)
    session.commit()
    return {"ok": True}