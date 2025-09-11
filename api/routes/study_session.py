import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import SessionDep
from models.study_session import StudySession, StudySessionCreate, StudySessionPublic, StudySessionUpdate
from models.user import User
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/study-sessions",
    tags=["study-sessions"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[StudySessionPublic])
def read_study_sessions(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all study sessions for current user - requires authentication"""
    # Users can only see their own study sessions
    study_sessions = session.exec(
        select(StudySession)
        .where(StudySession.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    ).all()
    return study_sessions


@router.get("/{session_id}", response_model=StudySessionPublic)
def read_study_session(
    session_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get a specific study session by ID - requires authentication and ownership"""
    study_session = session.get(StudySession, session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    # Users can only access their own study sessions
    if study_session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only access your own study sessions")
    
    return study_session


@router.post("/", response_model=StudySessionPublic)
def create_study_session(
    study_session: StudySessionCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Create a new study session - requires authentication"""
    # Ensure the user_id matches the current user
    if study_session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only create study sessions for yourself")
    
    try:
        # Create the study session using model_validate
        db_study_session = StudySession.model_validate(study_session)
        session.add(db_study_session)
        session.commit()
        session.refresh(db_study_session)
        return db_study_session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{session_id}", response_model=StudySessionPublic)
def update_study_session(
    session_id: uuid.UUID,
    study_session_update: StudySessionUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Update a study session - requires authentication and ownership"""
    study_session = session.get(StudySession, session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    # Users can only update their own study sessions
    if study_session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own study sessions")
    
    try:
        # Get update data excluding unset fields
        session_data = study_session_update.model_dump(exclude_unset=True)
        
        # Don't allow changing user_id
        if "user_id" in session_data:
            raise HTTPException(status_code=400, detail="Cannot change user_id of existing study session")
        
        # Update study session with the data
        for key, value in session_data.items():
            setattr(study_session, key, value)
        session.add(study_session)
        session.commit()
        session.refresh(study_session)
        return study_session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{session_id}")
def delete_study_session(
    session_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Delete a study session - requires authentication and ownership"""
    study_session = session.get(StudySession, session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Study session not found")
    
    # Users can only delete their own study sessions
    if study_session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own study sessions")
    
    session.delete(study_session)
    session.commit()
    return {"ok": True}


# User-specific router for the /users/{user_id}/study-sessions/* endpoints
user_study_session_router = APIRouter(
    prefix="/users",
    tags=["study-sessions"],
    responses={404: {"description": "Not found"}},
)


@user_study_session_router.get("/{user_id}/study-sessions", response_model=List[StudySessionPublic])
def read_user_study_sessions(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all study sessions for a specific user - requires authentication and ownership"""
    # Users can only access their own study sessions
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only access your own study sessions")
    
    # Validate that the user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    statement = select(StudySession).where(StudySession.user_id == user_id).offset(skip).limit(limit)
    study_sessions = session.exec(statement).all()
    return study_sessions


@user_study_session_router.post("/{user_id}/study-sessions", response_model=StudySessionPublic)
def create_user_study_session(
    user_id: uuid.UUID,
    study_session: StudySessionCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Create a new study session for a specific user - requires authentication and ownership"""
    # Users can only create study sessions for themselves
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only create study sessions for yourself")
    
    # Validate that the user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure the user_id matches the one in the URL
    if study_session.user_id != user_id:
        raise HTTPException(status_code=400, detail="User ID in URL must match user ID in request body")
    
    try:
        # Create the study session using model_validate
        db_study_session = StudySession.model_validate(study_session)
        session.add(db_study_session)
        session.commit()
        session.refresh(db_study_session)
        return db_study_session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@user_study_session_router.get("/{user_id}/study-sessions/active", response_model=StudySessionPublic)
def read_user_active_study_session(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """Get the active study session for a user - requires authentication and ownership"""
    # Users can only access their own study sessions
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only access your own study sessions")
    
    # Validate that the user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    statement = select(StudySession).where(
        StudySession.user_id == user_id,
        StudySession.stop_time.is_(None)
    )
    active_session = session.exec(statement).first()
    
    if not active_session:
        raise HTTPException(status_code=404, detail="No active study session found for user")
    
    return active_session