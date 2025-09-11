import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep, get_session
from models.translation import Translation, TranslationCreate, TranslationPublic, TranslationUpdate
from models.user import User
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/translations",
    tags=["translations"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[TranslationPublic])
def read_translations(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[uuid.UUID] = None,
    catalogue_id: Optional[uuid.UUID] = None
):
    """Get all translations with optional filtering - requires authentication"""
    statement = select(Translation)
    
    if user_id:
        # Users can only access their own custom translations
        if user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Can only access your own translations")
        statement = statement.where(Translation.user_id == user_id)
    elif catalogue_id:
        # Anyone can access catalogue translations
        statement = statement.where(Translation.catalogue_id == catalogue_id)
    else:
        # Default: show user's own translations and public catalogue translations
        statement = statement.where(
            (Translation.user_id == current_user.id) |
            (Translation.is_custom == False)
        )
    
    statement = statement.offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.get("/{translation_id}", response_model=TranslationPublic)
def read_translation(
    translation_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific translation by ID - requires authentication"""
    translation = session.get(Translation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    # Check access permissions
    if translation.is_custom and translation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only access your own custom translations")
    
    return translation


@router.get("/terms/{study_term_id}/{native_term_id}", response_model=List[TranslationPublic])
def read_translations_by_terms(
    study_term_id: uuid.UUID,
    native_term_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get translations by study and native term IDs - requires authentication"""
    statement = select(Translation).where(
        Translation.study_term_id == study_term_id,
        Translation.native_term_id == native_term_id,
        # Only show user's custom translations or public catalogue translations
        (Translation.user_id == current_user.id) | (Translation.is_custom == False)
    )
    translations = session.exec(statement).all()
    return translations


@router.post("/", response_model=TranslationPublic)
def create_translation(
    translation: TranslationCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Create a new translation - requires authentication"""
    # The validation for custom vs catalogue is handled in the model validator
    try:
        # Set the user_id for custom translations
        translation_data = translation.model_dump()
        if translation_data.get('is_custom', True):
            translation_data['user_id'] = current_user.id
        
        # Create the translation using model_validate
        db_translation = Translation.model_validate(translation_data)
        session.add(db_translation)
        session.commit()
        session.refresh(db_translation)
        return db_translation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{translation_id}", response_model=TranslationPublic)
def update_translation(
    translation_id: uuid.UUID,
    translation_update: TranslationUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Update a translation - requires authentication and ownership"""
    translation = session.get(Translation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    # Check ownership for custom translations
    if translation.is_custom and translation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own custom translations")
    
    # Don't allow updating catalogue translations
    if not translation.is_custom:
        raise HTTPException(status_code=403, detail="Cannot update catalogue translations")
    
    try:
        # Update with only the fields that were set
        translation_data = translation_update.model_dump(exclude_unset=True)
        for key, value in translation_data.items():
            setattr(translation, key, value)
        session.add(translation)
        session.commit()
        session.refresh(translation)
        return translation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{translation_id}")
def delete_translation(
    translation_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Delete a translation - requires authentication and ownership"""
    translation = session.get(Translation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    # Check ownership for custom translations
    if translation.is_custom and translation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own custom translations")
    
    # Don't allow deleting catalogue translations
    if not translation.is_custom:
        raise HTTPException(status_code=403, detail="Cannot delete catalogue translations")
    
    session.delete(translation)
    session.commit()
    return {"ok": True}