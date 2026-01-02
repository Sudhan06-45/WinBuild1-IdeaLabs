"""
Agents API Routes
Exposes Code Agent, Requirement Agent, and Test Agent as REST APIs
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import time
import json

from database import get_db, AgentExecution, User
from utils import get_current_user

# Import agents
from agents.code_agent import CodeReviewAgent
from agents.requirement_agent import RequirementQualityAgent
from agents.test_agent import TestGenerationAgent

router = APIRouter()


# ============================================
# Request/Response Models
# ============================================

class CodeAnalysisRequest(BaseModel):
    code: str
    filename: str = "code.py"
    language: str = "python"


class RequirementRequest(BaseModel):
    id: str = "REQ-01"
    title: str
    description: str
    acceptance_criteria: Optional[List[str]] = []
    nfrs: Optional[List[str]] = []


class TestGenerationRequest(BaseModel):
    code: str
    filename: str = "code.py"
    test_count: int = 3


class AgentResponse(BaseModel):
    execution_id: str
    agent_type: str
    status: str
    result: dict
    execution_time_ms: int


class ExecutionHistoryResponse(BaseModel):
    id: int
    uuid: str
    agent_type: str
    status: str
    created_at: datetime
    execution_time_ms: Optional[int]
    
    class Config:
        from_attributes = True


# ============================================
# Code Agent Routes
# ============================================

@router.post("/code/analyze", response_model=AgentResponse)
async def analyze_code(
    request: CodeAnalysisRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Run code analysis using the Code Review Agent"""
    
    start_time = time.time()
    
    # Create execution record
    execution = AgentExecution(
        user_id=current_user["user_id"],
        agent_type="code",
        input_data={
            "code": request.code[:500] + "..." if len(request.code) > 500 else request.code,
            "filename": request.filename,
            "language": request.language
        },
        status="running"
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)
    
    try:
        # Run code analysis
        agent = CodeReviewAgent()
        result = agent.analyze(request.code, request.filename)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        # Update execution record
        execution.status = "completed"
        execution.output_data = result
        execution.execution_time_ms = execution_time
        execution.completed_at = datetime.now(timezone.utc)
        
        return AgentResponse(
            execution_id=execution.uuid,
            agent_type="code",
            status="completed",
            result=result,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code analysis failed: {str(e)}"
        )


@router.post("/code/analyze-file", response_model=AgentResponse)
async def analyze_code_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze uploaded code file"""
    
    start_time = time.time()
    
    # Read file content
    content = await file.read()
    code = content.decode("utf-8", errors="ignore")
    
    # Create execution record
    execution = AgentExecution(
        user_id=current_user["user_id"],
        agent_type="code",
        input_data={
            "filename": file.filename,
            "file_size": len(content)
        },
        status="running"
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)
    
    try:
        agent = CodeReviewAgent()
        result = agent.analyze(code, file.filename)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        execution.status = "completed"
        execution.output_data = result
        execution.execution_time_ms = execution_time
        execution.completed_at = datetime.now(timezone.utc)
        
        return AgentResponse(
            execution_id=execution.uuid,
            agent_type="code",
            status="completed",
            result=result,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code analysis failed: {str(e)}"
        )


# ============================================
# Requirement Agent Routes
# ============================================

@router.post("/requirement/validate", response_model=AgentResponse)
async def validate_requirement(
    request: RequirementRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Validate requirement quality using the Requirement Agent"""
    
    start_time = time.time()
    
    # Create execution record
    execution = AgentExecution(
        user_id=current_user["user_id"],
        agent_type="requirement",
        input_data=request.model_dump(),
        status="running"
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)
    
    try:
        agent = RequirementQualityAgent()
        result = await agent.validate(request.model_dump())
        
        execution_time = int((time.time() - start_time) * 1000)
        
        execution.status = "completed"
        execution.output_data = result
        execution.execution_time_ms = execution_time
        execution.completed_at = datetime.now(timezone.utc)
        
        return AgentResponse(
            execution_id=execution.uuid,
            agent_type="requirement",
            status="completed",
            result=result,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Requirement validation failed: {str(e)}"
        )


@router.post("/requirement/extract", response_model=AgentResponse)
async def extract_requirements(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Extract requirements from uploaded document"""
    
    start_time = time.time()
    
    # Read file content
    content = await file.read()
    
    # Create execution record
    execution = AgentExecution(
        user_id=current_user["user_id"],
        agent_type="requirement",
        input_data={
            "action": "extract",
            "filename": file.filename
        },
        status="running"
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)
    
    try:
        agent = RequirementQualityAgent()
        result = await agent.extract_from_file(content, file.filename)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        execution.status = "completed"
        execution.output_data = result
        execution.execution_time_ms = execution_time
        execution.completed_at = datetime.now(timezone.utc)
        
        return AgentResponse(
            execution_id=execution.uuid,
            agent_type="requirement",
            status="completed",
            result=result,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Requirement extraction failed: {str(e)}"
        )


# ============================================
# Test Agent Routes
# ============================================

@router.post("/test/generate", response_model=AgentResponse)
async def generate_tests(
    request: TestGenerationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate test cases using the Test Agent"""
    
    start_time = time.time()
    
    # Create execution record
    execution = AgentExecution(
        user_id=current_user["user_id"],
        agent_type="test",
        input_data={
            "filename": request.filename,
            "test_count": request.test_count
        },
        status="running"
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)
    
    try:
        agent = TestGenerationAgent()
        result = agent.generate(request.code, request.filename, request.test_count)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        execution.status = "completed"
        execution.output_data = result
        execution.execution_time_ms = execution_time
        execution.completed_at = datetime.now(timezone.utc)
        
        return AgentResponse(
            execution_id=execution.uuid,
            agent_type="test",
            status="completed",
            result=result,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test generation failed: {str(e)}"
        )


@router.post("/test/generate-file", response_model=AgentResponse)
async def generate_tests_from_file(
    file: UploadFile = File(...),
    test_count: int = Form(default=3),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate tests from uploaded code file"""
    
    start_time = time.time()
    
    content = await file.read()
    code = content.decode("utf-8", errors="ignore")
    
    execution = AgentExecution(
        user_id=current_user["user_id"],
        agent_type="test",
        input_data={
            "filename": file.filename,
            "test_count": test_count
        },
        status="running"
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)
    
    try:
        agent = TestGenerationAgent()
        result = agent.generate(code, file.filename, test_count)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        execution.status = "completed"
        execution.output_data = result
        execution.execution_time_ms = execution_time
        execution.completed_at = datetime.now(timezone.utc)
        
        return AgentResponse(
            execution_id=execution.uuid,
            agent_type="test",
            status="completed",
            result=result,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test generation failed: {str(e)}"
        )


# ============================================
# Execution History Routes
# ============================================

@router.get("/history", response_model=List[ExecutionHistoryResponse])
async def get_execution_history(
    agent_type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get agent execution history for current user"""
    
    query = select(AgentExecution).where(
        AgentExecution.user_id == current_user["user_id"]
    )
    
    if agent_type:
        query = query.where(AgentExecution.agent_type == agent_type)
    
    query = query.order_by(AgentExecution.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    executions = result.scalars().all()
    
    return executions


@router.get("/execution/{execution_uuid}")
async def get_execution_detail(
    execution_uuid: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed execution result by UUID"""
    
    result = await db.execute(
        select(AgentExecution).where(
            AgentExecution.uuid == execution_uuid,
            AgentExecution.user_id == current_user["user_id"]
        )
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    
    return {
        "id": execution.id,
        "uuid": execution.uuid,
        "agent_type": execution.agent_type,
        "status": execution.status,
        "input_data": execution.input_data,
        "output_data": execution.output_data,
        "error_message": execution.error_message,
        "execution_time_ms": execution.execution_time_ms,
        "created_at": execution.created_at,
        "completed_at": execution.completed_at
    }
