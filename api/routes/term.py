import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep, get_session
from models.term import Term, TermCreate, TermPublic, TermUpdate
from models.user import User
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/terms",
    tags=["terms"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[TermPublic])
def read_terms(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    language_id: Optional[uuid.UUID] = None,
    type_id: Optional[uuid.UUID] = None
):
    """Get all terms with optional filtering - requires authentication"""
    statement = select(Term)
    
    if language_id:
        statement = statement.where(Term.language_id == language_id)
    if type_id:
        statement = statement.where(Term.type_id == type_id)
    
    statement = statement.offset(skip).limit(limit)
    terms = session.exec(statement).all()
    return terms


@router.get("/{term_id}", response_model=TermPublic)
def read_term(
    term_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific term by ID - requires authentication"""
    term = session.get(Term, term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    return term


@router.get("/search/{search_term}", response_model=List[TermPublic])
def search_terms(
    search_term: str,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    language_id: Optional[uuid.UUID] = None
):
    """Search for terms by partial match - requires authentication"""
    statement = select(Term).where(Term.text.contains(search_term))
    
    if language_id:
        statement = statement.where(Term.language_id == language_id)
    
    terms = session.exec(statement).all()
    return terms


@router.post("/", response_model=TermPublic)
def create_term(
    term: TermCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Create a new term - requires authentication"""
    # Create the term using model_validate
    db_term = Term.model_validate(term)
    session.add(db_term)
    session.commit()
    session.refresh(db_term)
    return db_term


@router.patch("/{term_id}", response_model=TermPublic)
def update_term(
    term_id: uuid.UUID,
    term_update: TermUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Update a term - requires authentication"""
    term = session.get(Term, term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    # Update with only the fields that were set
    term_data = term_update.model_dump(exclude_unset=True)
    for key, value in term_data.items():
        setattr(term, key, value)
    session.add(term)
    session.commit()
    session.refresh(term)
    return term


@router.delete("/{term_id}")
def delete_term(
    term_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Delete a term - requires authentication"""
    term = session.get(Term, term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    session.delete(term)
    session.commit()
    return {"ok": True}