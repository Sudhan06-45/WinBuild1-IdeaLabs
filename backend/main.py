"""
SQA Management System - FastAPI Backend
Main application entry point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from database.connection import init_db, close_db

# Import routers
from api.auth import router as auth_router
from api.agents import router as agents_router
from api.documents import router as documents_router
from api.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("🚀 Starting SQA Management System API...")
    await init_db()
    yield
    print("👋 Shutting down...")
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="SQA Management System",
    description="AI-Powered Software Quality Assurance Management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - ORDER MATTERS!
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(agents_router, prefix="/api/agents")
app.include_router(documents_router, prefix="/api")  # Changed: documents router has its own /documents prefix


@app.get("/")
async def root():
    return {
        "message": "SQA Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )