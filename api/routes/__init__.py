from .language import router as language_router
from .type import router as type_router
from .term import router as term_router
from .user import router as user_router
from .translation import router as translation_router
from .catalogue import router as catalogue_router
from .study_session import router as study_session_router, user_study_session_router

__all__ = [
    "language_router",
    "type_router",
    "term_router",
    "user_router",
    "translation_router",
    "catalogue_router",
    "study_session_router",
    "user_study_session_router"
]