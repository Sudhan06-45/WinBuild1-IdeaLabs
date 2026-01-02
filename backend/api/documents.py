"""
Documents API Routes
Generate, list, and export SQA documents
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database.connection import get_db
from database.models import Document, AgentExecution, User
from utils.jwt import get_current_user
from agents.document_generator import DocumentGeneratorAgent

router = APIRouter(prefix="/documents", tags=["Documents"])


class DocumentGenerateRequest(BaseModel):
    title: str
    code_execution_id: Optional[int] = None
    requirement_execution_id: Optional[int] = None
    test_execution_id: Optional[int] = None


class DocumentResponse(BaseModel):
    uuid: str
    title: str
    document_type: Optional[str] = None
    summary: Optional[str] = None
    overall_score: Optional[int] = None
    compliance_score: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_document(
    request: DocumentGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a new SQA document from agent executions"""
    
    # Gather execution data
    code_data = None
    requirement_data = None
    test_data = None
    
    if request.code_execution_id:
        result = await db.execute(
            select(AgentExecution).where(
                AgentExecution.id == request.code_execution_id,
                AgentExecution.user_id == current_user.id
            )
        )
        execution = result.scalar_one_or_none()
        if execution:
            code_data = execution.output_data
    
    if request.requirement_execution_id:
        result = await db.execute(
            select(AgentExecution).where(
                AgentExecution.id == request.requirement_execution_id,
                AgentExecution.user_id == current_user.id
            )
        )
        execution = result.scalar_one_or_none()
        if execution:
            requirement_data = execution.output_data
    
    if request.test_execution_id:
        result = await db.execute(
            select(AgentExecution).where(
                AgentExecution.id == request.test_execution_id,
                AgentExecution.user_id == current_user.id
            )
        )
        execution = result.scalar_one_or_none()
        if execution:
            test_data = execution.output_data
    
    # Generate document using agent
    generator = DocumentGeneratorAgent()
    document_content = await generator.generate(
        code_analysis=code_data,
        requirement_validation=requirement_data,
        test_results=test_data,
        title=request.title
    )
    
    # Create document record
    document = Document(
        user_id=current_user.id,
        title=request.title,
        document_type="sqa_report",
        code_execution_id=request.code_execution_id,
        requirement_execution_id=request.requirement_execution_id,
        test_execution_id=request.test_execution_id,
        content=document_content,
        summary=document_content.get("executive_summary", ""),
        overall_score=document_content.get("overall_score"),
        compliance_score=document_content.get("compliance_score")
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return {
        "uuid": document.uuid,
        "title": document.title,
        "message": "Document generated successfully"
    }


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all documents for the current user"""
    
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(desc(Document.created_at))
        .limit(limit)
        .offset(offset)
    )
    
    documents = result.scalars().all()
    return documents


@router.get("/{document_uuid}")
async def get_document(
    document_uuid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific document by UUID"""
    
    result = await db.execute(
        select(Document).where(
            Document.uuid == document_uuid,
            Document.user_id == current_user.id
        )
    )
    
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return {
        "uuid": document.uuid,
        "title": document.title,
        "document_type": document.document_type,
        "content": document.content,
        "summary": document.summary,
        "overall_score": document.overall_score,
        "compliance_score": document.compliance_score,
        "created_at": document.created_at,
        "updated_at": document.updated_at
    }


@router.delete("/{document_uuid}")
async def delete_document(
    document_uuid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a document"""
    
    result = await db.execute(
        select(Document).where(
            Document.uuid == document_uuid,
            Document.user_id == current_user.id
        )
    )
    
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    await db.delete(document)
    await db.commit()
    
    return {"message": "Document deleted successfully"}


@router.get("/{document_uuid}/export/json")
async def export_document_json(
    document_uuid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export document as JSON"""
    
    result = await db.execute(
        select(Document).where(
            Document.uuid == document_uuid,
            Document.user_id == current_user.id
        )
    )
    
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return {
        "title": document.title,
        "document_type": document.document_type,
        "generated_at": document.created_at.isoformat(),
        "summary": document.summary,
        "overall_score": document.overall_score,
        "compliance_score": document.compliance_score,
        "content": document.content
    }


@router.get("/{document_uuid}/export/markdown")
async def export_document_markdown(
    document_uuid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export document as Markdown"""
    
    result = await db.execute(
        select(Document).where(
            Document.uuid == document_uuid,
            Document.user_id == current_user.id
        )
    )
    
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    content = document.content or {}
    
    # Build markdown
    md = f"# {document.title}\n\n"
    md += f"**Generated:** {document.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    md += f"**Overall Score:** {document.overall_score or 'N/A'}/100\n\n"
    md += f"**Compliance Score:** {document.compliance_score or 'N/A'}/100\n\n"
    md += "---\n\n"
    
    if document.summary:
        md += f"## Executive Summary\n\n{document.summary}\n\n"
    
    if content.get("code_analysis"):
        md += "## Code Analysis\n\n"
        code = content["code_analysis"]
        md += f"- Quality Issues: {code.get('total_quality_issues', 0)}\n"
        md += f"- Security Issues: {code.get('total_security_issues', 0)}\n\n"
    
    if content.get("requirement_validation"):
        md += "## Requirement Validation\n\n"
        req = content["requirement_validation"]
        md += f"- Total Score: {req.get('total_score', 'N/A')}/100\n"
        md += f"- Decision: {req.get('decision', 'N/A')}\n\n"
    
    if content.get("test_results"):
        md += "## Test Results\n\n"
        test = content["test_results"]
        md += f"- Functions Detected: {test.get('functions_detected', 0)}\n"
        md += f"- Test Cases Generated: {test.get('test_cases_generated', 0)}\n\n"
    
    if content.get("recommendations"):
        md += "## Recommendations\n\n"
        for rec in content["recommendations"]:
            md += f"- {rec}\n"
    
    return {"markdown": md, "filename": f"{document.title.replace(' ', '_')}.md"}