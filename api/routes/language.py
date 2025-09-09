import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep, get_session
from models.language import Language, LanguageCreate, LanguagePublic, LanguageUpdate

router = APIRouter(
    prefix="/languages",
    tags=["languages"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[LanguagePublic])
def read_languages(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
):
    """Get all languages"""
    languages = session.exec(select(Language).offset(skip).limit(limit)).all()
    return languages


@router.get("/{language_id}", response_model=LanguagePublic)
def read_language(
    language_id: uuid.UUID,
    session: SessionDep
):
    """Get a specific language by ID"""
    language = session.get(Language, language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.get("/code/{code}", response_model=LanguagePublic)
def read_language_by_code(
    code: str,
    session: SessionDep
):
    """Get a specific language by ISO code"""
    statement = select(Language).where(Language.code == code)
    language = session.exec(statement).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.post("/", response_model=LanguagePublic)
def create_language(
    language: LanguageCreate,
    session: SessionDep
):
    """Create a new language"""
    # Check if language with code already exists
    existing = session.exec(select(Language).where(Language.code == language.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Language code already exists")
    
    # Create the language using model_validate
    db_language = Language.model_validate(language)
    session.add(db_language)
    session.commit()
    session.refresh(db_language)
    return db_language


@router.patch("/{language_id}", response_model=LanguagePublic)
def update_language(
    language_id: uuid.UUID,
    language_update: LanguageUpdate,
    session: SessionDep
):
    """Update a language"""
    language = session.get(Language, language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Update with only the fields that were set
    language_data = language_update.model_dump(exclude_unset=True)
    for key, value in language_data.items():
        setattr(language, key, value)
    session.add(language)
    session.commit()
    session.refresh(language)
    return language


@router.delete("/{language_id}")
def delete_language(
    language_id: uuid.UUID,
    session: SessionDep
):
    """Delete a language"""
    language = session.get(Language, language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    session.delete(language)
    session.commit()
    return {"ok": True}