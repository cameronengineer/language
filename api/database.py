from typing import Annotated, Generator
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from core.config import settings

# Create engine with proper SQLite configuration using environment variable
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=settings.debug  # Echo SQL queries when DEBUG is enabled
)


def create_db_and_tables():
    """Create all database tables"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Dependency injection for database session.
    Yields a database session and ensures it's closed after use.
    """
    with Session(engine) as session:
        yield session


# FastAPI recommended SessionDep pattern
SessionDep = Annotated[Session, Depends(get_session)]