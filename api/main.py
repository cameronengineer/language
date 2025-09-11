from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from database import create_db_and_tables
from core.config import settings
from middleware.rate_limiting import RateLimitMiddleware
from middleware.security_headers import SecurityHeadersMiddleware
from routes import (
    language_router,
    type_router,
    term_router,
    user_router,
    translation_router,
    catalogue_router,
    study_session_router,
    user_study_session_router
)
from routes.auth import router as auth_router


# Configure logging based on DEBUG setting
if settings.debug:
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    logger.debug("Debug mode enabled")
else:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager for FastAPI app lifespan.
    Creates database tables on startup.
    """
    # Startup
    create_db_and_tables()
    if settings.debug:
        print(f"Database tables created (DEBUG mode: {settings.debug})")
        print(f"Database URL: {settings.database_url}")
        print(f"Environment: {settings.app_env}")
    else:
        print("Database tables created")
    print("JWT Authentication enabled")
    yield
    # Shutdown
    if settings.debug:
        print("Shutting down (DEBUG mode)")
    else:
        print("Shutting down")


# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    debug=settings.debug,  # Use DEBUG setting from environment
    lifespan=lifespan
)

# Add security middleware (order matters - add before CORS)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)  # Add auth routes first
app.include_router(language_router)
app.include_router(type_router)
app.include_router(term_router)
app.include_router(user_router)
app.include_router(translation_router)
app.include_router(catalogue_router)
app.include_router(study_session_router)
app.include_router(user_study_session_router)


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to the Language Learning API",
        "version": settings.api_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "authentication": "Social login enabled",
        "security": "Rate limiting and security headers active"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "authentication": "enabled",
        "security": "active",
        "features": ["JWT", "Social Login", "Rate Limiting", "Security Headers"]
    }