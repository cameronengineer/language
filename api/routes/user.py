import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select, func, union_all
from database import SessionDep, get_session
from models.user import User, UserCreate, UserPublic, UserUpdate
from models.translation import Translation, TranslationPublic
from models.term import Term
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[UserPublic])
def read_users(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all users - requires authentication"""
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return users


@router.get("/{user_id}", response_model=UserPublic)
def read_user(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific user by ID - requires authentication"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/username/{username}", response_model=UserPublic)
def read_user_by_username(
    username: str,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific user by username - requires authentication"""
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/email/{email}", response_model=UserPublic)
def read_user_by_email(
    email: str,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific user by email - requires authentication"""
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserPublic)
def create_user(
    user: UserCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Create a new user - requires authentication"""
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
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Update a user - requires authentication and ownership"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user can only update their own profile
    if user.id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own profile")
    
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


@router.get("/{user_id}/translations/random", response_model=TranslationPublic)
def get_random_translation(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    include_catalogue: bool = True
):
    """Get a random translation for the user - requires authentication"""
    # Users can only access their own translations
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only access your own translations")
        
    # Validate that the user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if include_catalogue:
        # Create aliases for the Term table to join both study and native terms
        study_term = Term.__table__.alias('study_term')
        native_term = Term.__table__.alias('native_term')
        
        # Query for either custom translations OR catalogue translations matching language pair
        query = select(Translation).select_from(
            Translation.__table__.outerjoin(
                study_term, Translation.study_term_id == study_term.c.id
            ).outerjoin(
                native_term, Translation.native_term_id == native_term.c.id
            )
        ).where(
            # Either custom translation for this user
            (Translation.user_id == user_id) & (Translation.is_custom == True) |
            # Or catalogue translation matching user's language pair
            (Translation.is_custom == False) &
            (study_term.c.language_id == user.study_language_id) &
            (native_term.c.language_id == user.native_language_id)
        ).order_by(func.random()).limit(1)
    else:
        # Only custom translations
        query = select(Translation).where(
            Translation.user_id == user_id,
            Translation.is_custom == True
        ).order_by(func.random()).limit(1)
    
    # Execute query and get random translation
    translation = session.exec(query).first()
    
    if not translation:
        raise HTTPException(status_code=404, detail="No translations found")
    
    return translation


@router.get("/{user_id}/translations/count")
def get_translation_count(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    include_catalogue: bool = True
):
    """Get the count of translations available for the user - requires authentication"""
    # Users can only access their own translations
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only access your own translations")
        
    # Validate that the user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if include_catalogue:
        # Create aliases for the Term table to join both study and native terms
        study_term = Term.__table__.alias('study_term')
        native_term = Term.__table__.alias('native_term')
        
        # Count either custom translations OR catalogue translations matching language pair
        query = select(func.count()).select_from(
            Translation.__table__.outerjoin(
                study_term, Translation.study_term_id == study_term.c.id
            ).outerjoin(
                native_term, Translation.native_term_id == native_term.c.id
            )
        ).where(
            # Either custom translation for this user
            (Translation.user_id == user_id) & (Translation.is_custom == True) |
            # Or catalogue translation matching user's language pair
            (Translation.is_custom == False) &
            (study_term.c.language_id == user.study_language_id) &
            (native_term.c.language_id == user.native_language_id)
        )
    else:
        # Only custom translations
        query = select(func.count()).where(
            Translation.user_id == user_id,
            Translation.is_custom == True
        )
    
    # Execute query and get count
    count = session.exec(query).one()
    
    return {"count": count}


@router.delete("/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Delete a user - requires authentication and ownership"""
    # Users can only delete their own account
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own account")
        
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"ok": True}