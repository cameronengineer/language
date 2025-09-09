from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import create_db_and_tables
from routes import (
    language_router,
    type_router,
    term_router,
    user_router,
    translation_router,
    catalogue_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager for FastAPI app lifespan.
    Creates database tables on startup.
    """
    # Startup
    create_db_and_tables()
    print("Database tables created")
    yield
    # Shutdown
    print("Shutting down")


# Create FastAPI app
app = FastAPI(
    title="Language Learning API",
    description="API for managing language learning terms and translations",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(language_router)
app.include_router(type_router)
app.include_router(term_router)
app.include_router(user_router)
app.include_router(translation_router)
app.include_router(catalogue_router)


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to the Language Learning API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}