"""
Authentication API Routes
Handles user registration, login, logout, and profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timedelta, timezone

from database import get_db, User, UserSession
from utils import hash_password, verify_password, create_access_token, get_current_user
from config import settings

router = APIRouter()


# ============================================
# Request/Response Models
# ============================================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class UserResponse(BaseModel):
    id: int
    uuid: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str


# ============================================
# Routes
# ============================================

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name
    )
    
    db.add(user)
    await db.flush()
    await db.refresh(user)
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "full_name": user.full_name
        }
    )
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    session = UserSession(
        user_id=user.id,
        token=access_token,
        expires_at=expires_at
    )
    db.add(session)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
        user={
            "id": user.id,
            "uuid": user.uuid,
            "email": user.email,
            "full_name": user.full_name
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return token"""
    
    # Find user
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "full_name": user.full_name
        }
    )
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    session = UserSession(
        user_id=user.id,
        token=access_token,
        expires_at=expires_at
    )
    db.add(session)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
        user={
            "id": user.id,
            "uuid": user.uuid,
            "email": user.email,
            "full_name": user.full_name
        }
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Logout current user (invalidate session)"""
    
    # Delete all sessions for user
    result = await db.execute(
        select(UserSession).where(UserSession.user_id == current_user["user_id"])
    )
    sessions = result.scalars().all()
    
    for session in sessions:
        await db.delete(session)
    
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user profile"""
    
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    full_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if full_name is not None:
        user.full_name = full_name
    
    await db.flush()
    await db.refresh(user)
    
    return user
