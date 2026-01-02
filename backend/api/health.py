"""
Health Check API
Provides endpoints for monitoring application health
"""

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "SQA Management System API"
    }


@router.get("/health/ready")
async def readiness_check():
    """Readiness check - can service handle requests"""
    # Add database connectivity check here if needed
    return {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/health/live")
async def liveness_check():
    """Liveness check - is service running"""
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
