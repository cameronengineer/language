import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep, get_session
from models.user import User, UserCreate, UserPublic, UserUpdate

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[UserPublic])
def read_users(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
):
    """Get all users"""
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return users


@router.get("/{user_id}", response_model=UserPublic)
def read_user(
    user_id: uuid.UUID,
    session: SessionDep
):
    """Get a specific user by ID"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/username/{username}", response_model=UserPublic)
def read_user_by_username(
    username: str,
    session: SessionDep
):
    """Get a specific user by username"""
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/email/{email}", response_model=UserPublic)
def read_user_by_email(
    email: str,
    session: SessionDep
):
    """Get a specific user by email"""
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserPublic)
def create_user(
    user: UserCreate,
    session: SessionDep
):
    """Create a new user"""
    # Check if user with username already exists
    existing_username = session.exec(select(User).where(User.username == user.username)).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if user with email already exists
    existing_email = session.exec(select(User).where(User.email == user.email)).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create the user using model_validate
    db_user = User.model_validate(user)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.patch("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: uuid.UUID,
    user_update: UserUpdate,
    session: SessionDep
):
    """Update a user"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get update data excluding unset fields
    user_data = user_update.model_dump(exclude_unset=True)
    
    # Check if new username conflicts with existing user
    if "username" in user_data and user_data["username"] != user.username:
        existing_username = session.exec(select(User).where(User.username == user_data["username"])).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if new email conflicts with existing user
    if "email" in user_data and user_data["email"] != user.email:
        existing_email = session.exec(select(User).where(User.email == user_data["email"])).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
    
    # Update user with the data
    for key, value in user_data.items():
        setattr(user, key, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    session: SessionDep
):
    """Delete a user"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"ok": True}