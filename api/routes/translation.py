import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep, get_session
from models.translation import Translation, TranslationCreate, TranslationPublic, TranslationUpdate

router = APIRouter(
    prefix="/translations",
    tags=["translations"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[TranslationPublic])
def read_translations(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[uuid.UUID] = None,
    catalogue_id: Optional[uuid.UUID] = None
):
    """Get all translations with optional filtering"""
    statement = select(Translation)
    
    if user_id:
        statement = statement.where(Translation.user_id == user_id)
    elif catalogue_id:
        statement = statement.where(Translation.catalogue_id == catalogue_id)
    
    statement = statement.offset(skip).limit(limit)
    translations = session.exec(statement).all()
    return translations


@router.get("/{translation_id}", response_model=TranslationPublic)
def read_translation(
    translation_id: uuid.UUID,
    session: SessionDep
):
    """Get a specific translation by ID"""
    translation = session.get(Translation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    return translation


@router.get("/terms/{study_term_id}/{native_term_id}", response_model=List[TranslationPublic])
def read_translations_by_terms(
    study_term_id: uuid.UUID,
    native_term_id: uuid.UUID,
    session: SessionDep
):
    """Get translations by study and native term IDs"""
    statement = select(Translation).where(
        Translation.study_term_id == study_term_id,
        Translation.native_term_id == native_term_id
    )
    translations = session.exec(statement).all()
    return translations


@router.post("/", response_model=TranslationPublic)
def create_translation(
    translation: TranslationCreate,
    session: SessionDep
):
    """Create a new translation"""
    # The validation for custom vs catalogue is handled in the model validator
    try:
        # Create the translation using model_validate
        db_translation = Translation.model_validate(translation)
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
    session: SessionDep
):
    """Update a translation"""
    translation = session.get(Translation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
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
    session: SessionDep
):
    """Delete a translation"""
    translation = session.get(Translation, translation_id)
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    session.delete(translation)
    session.commit()
    return {"ok": True}