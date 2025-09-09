from datetime import datetime
from uuid import uuid4
from sqlmodel import Field, SQLModel


def generate_uuid() -> str:
    """Generate a UUID string without dashes"""
    return uuid4().hex