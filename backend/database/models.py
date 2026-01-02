"""
Database Models
SQLAlchemy models for Users, Sessions, Agent Executions, and Documents
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    agent_executions = relationship("AgentExecution", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    """User session management"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sessions")


class AgentExecution(Base):
    """Track agent execution history"""
    __tablename__ = "agent_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=generate_uuid, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    agent_type = Column(String(50), nullable=False)  # 'code', 'requirement', 'test', 'document'
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    status = Column(String(20), default="pending")  # 'pending', 'running', 'completed', 'failed'
    error_message = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="agent_executions")


class Document(Base):
    """Generated SQA documents"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=generate_uuid, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), default="sqa_report")  # 'sqa_report', 'code_review', 'test_report'
    
    # Agent execution references
    code_execution_id = Column(Integer, ForeignKey("agent_executions.id"), nullable=True)
    requirement_execution_id = Column(Integer, ForeignKey("agent_executions.id"), nullable=True)
    test_execution_id = Column(Integer, ForeignKey("agent_executions.id"), nullable=True)
    
    # Document content
    content = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    
    # Scores
    overall_score = Column(Integer, nullable=True)
    compliance_score = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="documents")


class Requirement(Base):
    """Stored requirements for tracking"""
    __tablename__ = "requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=generate_uuid, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requirement_id = Column(String(50), nullable=False)  # e.g., "FR-01"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    acceptance_criteria = Column(JSON, nullable=True)  # List of criteria
    nfrs = Column(JSON, nullable=True)  # List of NFRs
    status = Column(String(20), default="draft")  # 'draft', 'validated', 'approved', 'rejected'
    quality_score = Column(Integer, nullable=True)
    validation_result = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
