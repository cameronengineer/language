import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep, get_session
from models.type import Type, TypeCreate, TypePublic, TypeUpdate
from models.user import User
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/types",
    tags=["types"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[TypePublic])
def read_types(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all types - requires authentication"""
    types = session.exec(select(Type).offset(skip).limit(limit)).all()
    return types


@router.get("/{type_id}", response_model=TypePublic)
def read_type(
    type_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific type by ID - requires authentication"""
    type_obj = session.get(Type, type_id)
    if not type_obj:
        raise HTTPException(status_code=404, detail="Type not found")
    return type_obj


@router.get("/name/{name}", response_model=TypePublic)
def read_type_by_name(
    name: str,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific type by name - requires authentication"""
    statement = select(Type).where(Type.name == name)
    type_obj = session.exec(statement).first()
    if not type_obj:
        raise HTTPException(status_code=404, detail="Type not found")
    return type_obj


@router.post("/", response_model=TypePublic)
def create_type(
    type_create: TypeCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Create a new type - requires authentication"""
    # Check if type with name already exists
    existing = session.exec(select(Type).where(Type.name == type_create.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Type name already exists")
    
    # Create the type using model_validate
    db_type = Type.model_validate(type_create)
    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type


@router.patch("/{type_id}", response_model=TypePublic)
def update_type(
    type_id: uuid.UUID,
    type_update: TypeUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Update a type - requires authentication"""
    type_obj = session.get(Type, type_id)
    if not type_obj:
        raise HTTPException(status_code=404, detail="Type not found")
    
    # Update with only the fields that were set
    type_data = type_update.model_dump(exclude_unset=True)
    for key, value in type_data.items():
        setattr(type_obj, key, value)
    session.add(type_obj)
    session.commit()
    session.refresh(type_obj)
    return type_obj


@router.delete("/{type_id}")
def delete_type(
    type_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Delete a type - requires authentication"""
    type_obj = session.get(Type, type_id)
    if not type_obj:
        raise HTTPException(status_code=404, detail="Type not found")
    session.delete(type_obj)
    session.commit()
    return {"ok": True}