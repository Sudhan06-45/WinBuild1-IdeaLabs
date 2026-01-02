"""
Requirement Quality Agent
Validates requirements for clarity, completeness, testability, and NFR coverage
Adapted from the original requirement-agent code
"""

import json
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pydantic import BaseModel

from utils.llm import call_llm_async


# ============================================
# Configuration
# ============================================

QUALITY_GATE_THRESHOLD = 75

REQUIRED_NFRS = ["performance", "security", "usability", "availability"]

SCORING_WEIGHTS = {
    "clarity": 25,
    "completeness": 25,
    "testability": 25,
    "nfr": 25
}


# ============================================
# Data Models
# ============================================

class RequirementInput(BaseModel):
    id: str
    title: str
    description: str
    acceptance_criteria: Optional[List[str]] = []
    nfrs: Optional[List[str]] = []


# ============================================
# Requirement Quality Agent
# ============================================

class RequirementQualityAgent:
    """
    Validates requirements quality using LLM-powered analysis.
    """
    
    def __init__(self):
        pass
    
    async def validate(self, requirement_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a requirement and return quality assessment
        
        Args:
            requirement_data: Dictionary with requirement fields
        
        Returns:
            Quality assessment with scores and feedback
        """
        req = RequirementInput(**requirement_data)
        
        # Generate acceptance criteria if missing
        if not req.acceptance_criteria:
            generated_ac = await self._generate_acceptance_criteria(req.description)
            req.acceptance_criteria = generated_ac
        
        # Run validations
        clarity_result = await self._analyze_clarity(req.description)
        completeness_result = self._check_completeness(req)
        testability_result = await self._check_testability(req.acceptance_criteria)
        nfr_result = self._check_nfr_coverage(req.nfrs)
        
        # Calculate scores
        scores = {
            "clarity": clarity_result.get("clarity_score", 0),
            "completeness": completeness_result.get("completeness_score", 0),
            "testability": testability_result.get("testability_score", 0),
            "nfr": nfr_result.get("nfr_score", 0)
        }
        
        total_score = sum(scores.values())
        decision = "PASS" if total_score >= QUALITY_GATE_THRESHOLD else "FAIL"
        
        return {
            "requirement_id": req.id,
            "title": req.title,
            "scores": scores,
            "total_score": total_score,
            "decision": decision,
            "threshold": QUALITY_GATE_THRESHOLD,
            "feedback": {
                "clarity_issues": clarity_result.get("issues", []),
                "missing_items": completeness_result.get("missing_items", []),
                "non_testable": testability_result.get("non_testable", []),
                "missing_nfrs": nfr_result.get("missing", []),
                "covered_nfrs": nfr_result.get("covered", [])
            },
            "generated_acceptance_criteria": req.acceptance_criteria if not requirement_data.get("acceptance_criteria") else None
        }
    
    async def extract_from_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Extract requirements from uploaded document
        
        Args:
            file_content: File bytes
            filename: Original filename
        
        Returns:
            Extracted requirements
        """
        # Parse file content
        text = self._parse_file(file_content, filename)
        
        # Extract structured requirements using LLM
        extracted = await self._extract_requirements(text)
        
        return {
            "filename": filename,
            "extracted_requirements": extracted,
            "raw_text_length": len(text)
        }
    
    def _parse_file(self, content: bytes, filename: str) -> str:
        """Parse file content to text"""
        ext = filename.lower().split('.')[-1]
        
        if ext == 'txt':
            return content.decode('utf-8', errors='ignore')
        
        elif ext == 'json':
            try:
                data = json.loads(content.decode('utf-8'))
                return json.dumps(data, indent=2)
            except:
                return content.decode('utf-8', errors='ignore')
        
        elif ext == 'docx':
            try:
                from docx import Document
                import io
                doc = Document(io.BytesIO(content))
                return '\n'.join(p.text for p in doc.paragraphs)
            except ImportError:
                raise ValueError("python-docx not installed. Install with: pip install python-docx")
        
        elif ext == 'pdf':
            try:
                from pypdf import PdfReader
                import io
                reader = PdfReader(io.BytesIO(content))
                return '\n'.join(page.extract_text() or '' for page in reader.pages)
            except ImportError:
                raise ValueError("pypdf not installed. Install with: pip install pypdf")
        
        else:
            raise ValueError(f"Unsupported file format: {ext}")
    
    # ============================================
    # LLM-Powered Analysis
    # ============================================
    
    async def _analyze_clarity(self, description: str) -> Dict[str, Any]:
        """Analyze requirement clarity using LLM"""
        prompt = f"""
Analyze the following requirement for ambiguity and clarity.
Identify vague terms and unclear statements.

Requirement:
{description}

Respond in JSON with:
{{
  "issues": ["list of clarity issues found"],
  "clarity_score": <0-25>
}}

Only return valid JSON, no explanations.
"""
        
        try:
            result = await call_llm_async(
                "You are a Requirements Quality Analyst.",
                prompt
            )
            return self._parse_json_response(result)
        except Exception as e:
            return {"issues": [f"Analysis failed: {str(e)}"], "clarity_score": 15}
    
    async def _check_testability(self, acceptance_criteria: List[str]) -> Dict[str, Any]:
        """Check if acceptance criteria are testable"""
        if not acceptance_criteria:
            return {"non_testable": ["No acceptance criteria provided"], "testability_score": 0}
        
        prompt = f"""
Check whether the acceptance criteria below are testable and measurable.

Acceptance Criteria:
{json.dumps(acceptance_criteria, indent=2)}

Respond in JSON:
{{
  "non_testable": ["list of criteria that are not testable"],
  "testability_score": <0-25>
}}

Only return valid JSON, no explanations.
"""
        
        try:
            result = await call_llm_async(
                "You are a QA Engineer.",
                prompt
            )
            return self._parse_json_response(result)
        except Exception as e:
            return {"non_testable": [f"Analysis failed: {str(e)}"], "testability_score": 15}
    
    async def _generate_acceptance_criteria(self, description: str) -> List[str]:
        """Generate acceptance criteria from description"""
        prompt = f"""
You are a Business Analyst.

Generate acceptance criteria in Given-When-Then format.

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON array
- Do NOT include explanations
- Do NOT include markdown
- Do NOT include numbering

Example output:
[
  "Given ..., when ..., then ...",
  "Given ..., when ..., then ..."
]

Requirement:
{description}
"""
        
        try:
            result = await call_llm_async(
                "You generate structured acceptance criteria.",
                prompt
            )
            return self._parse_json_array(result)
        except Exception:
            return []
    
    async def _extract_requirements(self, text: str) -> Dict[str, Any]:
        """Extract structured requirements from text"""
        prompt = f"""
You are a Senior Business Analyst.

Extract structured requirement information from the text below.

Return ONLY valid JSON in this exact structure:

{{
  "id": "FR-XX",
  "title": "Requirement title",
  "description": "Clear user story or requirement",
  "acceptance_criteria": [
    "Given ... when ... then ..."
  ],
  "nfrs": [
    "Performance: ...",
    "Security: ...",
    "Usability: ...",
    "Availability: ..."
  ]
}}

Rules:
- If any section is missing, infer it
- Acceptance criteria MUST be testable
- NFRs MUST be measurable
- No markdown
- No explanations

TEXT:
{text[:3000]}
"""
        
        try:
            result = await call_llm_async(
                "You extract structured requirements.",
                prompt
            )
            return self._parse_json_response(result)
        except Exception as e:
            return {"error": str(e)}
    
    # ============================================
    # Non-LLM Validation
    # ============================================
    
    def _check_completeness(self, req: RequirementInput) -> Dict[str, Any]:
        """Check requirement completeness"""
        missing = []
        
        if not req.description or len(req.description) < 10:
            missing.append("Description is missing or too brief")
        
        if not req.title:
            missing.append("Title is missing")
        
        if not req.acceptance_criteria:
            missing.append("Acceptance criteria are missing")
        
        if not req.nfrs:
            missing.append("Non-functional requirements are missing")
        
        score = 25 if not missing else max(0, 25 - len(missing) * 6)
        
        return {
            "missing_items": missing,
            "completeness_score": score
        }
    
    def _check_nfr_coverage(self, nfrs: List[str]) -> Dict[str, Any]:
        """Check NFR coverage"""
        if not nfrs:
            return {
                "covered": [],
                "missing": REQUIRED_NFRS.copy(),
                "nfr_score": 0
            }
        
        nfrs_text = ' '.join(nfrs).lower()
        
        covered = [nfr for nfr in REQUIRED_NFRS if nfr in nfrs_text]
        missing = [nfr for nfr in REQUIRED_NFRS if nfr not in nfrs_text]
        
        score = int((len(covered) / len(REQUIRED_NFRS)) * 25)
        
        return {
            "covered": covered,
            "missing": missing,
            "nfr_score": score
        }
    
    # ============================================
    # Helpers
    # ============================================
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON from LLM response"""
        if not text or not text.strip():
            raise ValueError("Empty response from LLM")
        
        # Try to find JSON object
        match = re.search(r'\{[\s\S]*\}', text.strip())
        if not match:
            raise ValueError(f"No JSON object found in: {text[:100]}")
        
        return json.loads(match.group())
    
    def _parse_json_array(self, text: str) -> List[str]:
        """Parse JSON array from LLM response"""
        if not text or not text.strip():
            return []
        
        match = re.search(r'\[[\s\S]*\]', text.strip())
        if not match:
            return []
        
        return json.loads(match.group())
