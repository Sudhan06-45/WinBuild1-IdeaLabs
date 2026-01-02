"""
Document Generator Agent
Aggregates outputs from all agents and generates comprehensive SQA documents
NEW FEATURE - Combines Code, Requirement, and Test Agent outputs
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from utils.llm import call_llm_async


class DocumentGeneratorAgent:
    """
    Generates comprehensive SQA documents by aggregating outputs from all agents.
    """
    
    def __init__(self):
        pass
    
    async def generate(
        self,
        code_analysis: Optional[Dict[str, Any]] = None,
        requirement_validation: Optional[Dict[str, Any]] = None,
        test_results: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive SQA document
        
        Args:
            code_analysis: Output from Code Review Agent
            requirement_validation: Output from Requirement Agent
            test_results: Output from Test Generation Agent
        
        Returns:
            Comprehensive document content
        """
        # Calculate overall scores
        scores = self._calculate_overall_scores(
            code_analysis, 
            requirement_validation, 
            test_results
        )
        
        # Generate executive summary using LLM
        executive_summary = await self._generate_executive_summary(
            code_analysis,
            requirement_validation,
            test_results,
            scores
        )
        
        # Build document sections
        document = {
            "generated_at": datetime.utcnow().isoformat(),
            "executive_summary": executive_summary,
            "overall_score": scores["overall"],
            "compliance_score": scores["compliance"],
            "scores_breakdown": scores,
            "sections": {}
        }
        
        # Add Code Analysis Section
        if code_analysis:
            document["sections"]["code_analysis"] = self._format_code_section(code_analysis)
        
        # Add Requirement Validation Section
        if requirement_validation:
            document["sections"]["requirement_validation"] = self._format_requirement_section(requirement_validation)
        
        # Add Test Results Section
        if test_results:
            document["sections"]["test_results"] = self._format_test_section(test_results)
        
        # Add Recommendations
        document["recommendations"] = await self._generate_recommendations(
            code_analysis,
            requirement_validation,
            test_results
        )
        
        # Add Conclusions
        document["conclusions"] = self._generate_conclusions(scores)
        
        return document
    
    def _calculate_overall_scores(
        self,
        code_analysis: Optional[Dict],
        requirement_validation: Optional[Dict],
        test_results: Optional[Dict]
    ) -> Dict[str, Any]:
        """Calculate overall and individual scores"""
        scores = {
            "code_quality": 0,
            "code_security": 0,
            "requirement_quality": 0,
            "test_coverage": 0,
            "overall": 0,
            "compliance": 0
        }
        
        active_scores = []
        
        # Code Analysis Scores
        if code_analysis and "summary" in code_analysis:
            summary = code_analysis["summary"]
            scores["code_quality"] = summary.get("quality_score", 0)
            scores["code_security"] = summary.get("security_score", 0)
            active_scores.extend([scores["code_quality"], scores["code_security"]])
        
        # Requirement Validation Scores
        if requirement_validation:
            scores["requirement_quality"] = requirement_validation.get("total_score", 0)
            active_scores.append(scores["requirement_quality"])
        
        # Test Results Scores
        if test_results and "coverage" in test_results:
            coverage = test_results["coverage"]
            scores["test_coverage"] = coverage.get("coverage_percent", 0)
            active_scores.append(scores["test_coverage"])
        
        # Calculate overall
        if active_scores:
            scores["overall"] = int(sum(active_scores) / len(active_scores))
        
        # Calculate compliance (weighted)
        if code_analysis or requirement_validation:
            compliance_factors = []
            if scores["code_security"] > 0:
                compliance_factors.append(scores["code_security"] * 0.4)  # 40% weight
            if scores["requirement_quality"] > 0:
                compliance_factors.append(scores["requirement_quality"] * 0.3)  # 30% weight
            if scores["test_coverage"] > 0:
                compliance_factors.append(scores["test_coverage"] * 0.3)  # 30% weight
            
            if compliance_factors:
                scores["compliance"] = int(sum(compliance_factors))
        
        return scores
    
    def _format_code_section(self, code_analysis: Dict) -> Dict[str, Any]:
        """Format code analysis section"""
        return {
            "title": "Code Analysis Report",
            "file_analyzed": code_analysis.get("file", "Unknown"),
            "language": code_analysis.get("language", "Unknown"),
            "lines_of_code": code_analysis.get("lines_of_code", 0),
            "summary": code_analysis.get("summary", {}),
            "quality_issues": code_analysis.get("quality_issues", []),
            "security_issues": code_analysis.get("security_issues", []),
            "issue_count": {
                "quality": len(code_analysis.get("quality_issues", [])),
                "security": len(code_analysis.get("security_issues", []))
            }
        }
    
    def _format_requirement_section(self, requirement_validation: Dict) -> Dict[str, Any]:
        """Format requirement validation section"""
        return {
            "title": "Requirement Quality Report",
            "requirement_id": requirement_validation.get("requirement_id", "Unknown"),
            "requirement_title": requirement_validation.get("title", "Unknown"),
            "decision": requirement_validation.get("decision", "Unknown"),
            "total_score": requirement_validation.get("total_score", 0),
            "scores": requirement_validation.get("scores", {}),
            "feedback": requirement_validation.get("feedback", {}),
            "generated_acceptance_criteria": requirement_validation.get("generated_acceptance_criteria")
        }
    
    def _format_test_section(self, test_results: Dict) -> Dict[str, Any]:
        """Format test results section"""
        summary = test_results.get("summary", {})
        return {
            "title": "Test Generation Report",
            "file_tested": test_results.get("filename", "Unknown"),
            "functions_detected": test_results.get("functions_detected", 0),
            "functions": test_results.get("functions", []),
            "test_cases": test_results.get("test_cases", []),
            "coverage": test_results.get("coverage", {}),
            "execution_summary": {
                "total_tests": summary.get("total_tests", 0),
                "passed": summary.get("tests_passed", 0),
                "failed": summary.get("tests_failed", 0)
            }
        }
    
    async def _generate_executive_summary(
        self,
        code_analysis: Optional[Dict],
        requirement_validation: Optional[Dict],
        test_results: Optional[Dict],
        scores: Dict
    ) -> str:
        """Generate executive summary using LLM"""
        
        # Build context for LLM
        context_parts = []
        
        if code_analysis:
            summary = code_analysis.get("summary", {})
            context_parts.append(
                f"Code Analysis: {summary.get('total_issues', 0)} issues found, "
                f"Quality Score: {summary.get('quality_score', 'N/A')}, "
                f"Security Score: {summary.get('security_score', 'N/A')}"
            )
        
        if requirement_validation:
            context_parts.append(
                f"Requirement Validation: {requirement_validation.get('decision', 'N/A')}, "
                f"Score: {requirement_validation.get('total_score', 'N/A')}/100"
            )
        
        if test_results:
            summary = test_results.get("summary", {})
            coverage = test_results.get("coverage", {})
            context_parts.append(
                f"Test Results: {summary.get('total_tests', 0)} tests, "
                f"{summary.get('tests_passed', 0)} passed, "
                f"Coverage: {coverage.get('coverage_percent', 0)}%"
            )
        
        context = "\n".join(context_parts)
        
        prompt = f"""
Generate a brief executive summary (2-3 paragraphs) for an SQA report with these findings:

{context}

Overall Score: {scores['overall']}/100
Compliance Score: {scores['compliance']}/100

Write a professional summary highlighting key findings, risks, and recommendations.
Keep it concise and actionable.
"""
        
        try:
            return await call_llm_async(
                "You are a Technical Writer creating SQA documentation.",
                prompt
            )
        except Exception as e:
            return f"Executive Summary: Analysis completed with an overall score of {scores['overall']}/100. " \
                   f"Please review individual sections for detailed findings."
    
    async def _generate_recommendations(
        self,
        code_analysis: Optional[Dict],
        requirement_validation: Optional[Dict],
        test_results: Optional[Dict]
    ) -> List[str]:
        """Generate recommendations based on findings"""
        recommendations = []
        
        # Code-based recommendations
        if code_analysis:
            security_issues = code_analysis.get("security_issues", [])
            if security_issues:
                error_count = sum(1 for i in security_issues if i.get("severity") == "Error")
                if error_count > 0:
                    recommendations.append(
                        f"CRITICAL: Address {error_count} security vulnerabilities immediately"
                    )
            
            quality_issues = code_analysis.get("quality_issues", [])
            if len(quality_issues) > 5:
                recommendations.append(
                    "Consider refactoring code to reduce complexity and improve maintainability"
                )
        
        # Requirement-based recommendations
        if requirement_validation:
            feedback = requirement_validation.get("feedback", {})
            if feedback.get("missing_nfrs"):
                recommendations.append(
                    f"Add missing NFRs: {', '.join(feedback['missing_nfrs'])}"
                )
            if feedback.get("non_testable"):
                recommendations.append(
                    "Review acceptance criteria to ensure they are testable and measurable"
                )
        
        # Test-based recommendations
        if test_results:
            coverage = test_results.get("coverage", {})
            if coverage.get("coverage_percent", 0) < 80:
                recommendations.append(
                    f"Increase test coverage from {coverage.get('coverage_percent', 0)}% to at least 80%"
                )
            
            summary = test_results.get("summary", {})
            if summary.get("tests_failed", 0) > 0:
                recommendations.append(
                    f"Fix {summary['tests_failed']} failing tests before deployment"
                )
        
        if not recommendations:
            recommendations.append("All quality gates passed. Continue with current practices.")
        
        return recommendations
    
    def _generate_conclusions(self, scores: Dict) -> Dict[str, Any]:
        """Generate conclusions based on scores"""
        overall = scores["overall"]
        compliance = scores["compliance"]
        
        # Determine status
        if overall >= 80 and compliance >= 75:
            status = "APPROVED"
            message = "The software meets quality standards and is ready for the next phase."
        elif overall >= 60:
            status = "CONDITIONAL"
            message = "The software requires improvements before proceeding. Address identified issues."
        else:
            status = "REJECTED"
            message = "The software does not meet minimum quality standards. Significant rework required."
        
        return {
            "status": status,
            "message": message,
            "overall_score": overall,
            "compliance_score": compliance,
            "quality_gate": "PASS" if overall >= 75 else "FAIL"
        }
    
    def to_markdown(self, title: str, content: Dict[str, Any]) -> str:
        """Convert document content to Markdown format"""
        md = []
        
        # Title
        md.append(f"# {title}")
        md.append(f"\n*Generated: {content.get('generated_at', 'N/A')}*\n")
        
        # Executive Summary
        md.append("## Executive Summary")
        md.append(content.get("executive_summary", "No summary available."))
        md.append("")
        
        # Scores
        md.append("## Quality Scores")
        md.append(f"- **Overall Score:** {content.get('overall_score', 0)}/100")
        md.append(f"- **Compliance Score:** {content.get('compliance_score', 0)}/100")
        
        breakdown = content.get("scores_breakdown", {})
        if breakdown:
            md.append("\n### Score Breakdown")
            for key, value in breakdown.items():
                if key not in ("overall", "compliance"):
                    md.append(f"- {key.replace('_', ' ').title()}: {value}")
        md.append("")
        
        # Sections
        sections = content.get("sections", {})
        
        if "code_analysis" in sections:
            section = sections["code_analysis"]
            md.append("## Code Analysis")
            md.append(f"- **File:** {section.get('file_analyzed', 'N/A')}")
            md.append(f"- **Language:** {section.get('language', 'N/A')}")
            md.append(f"- **Lines of Code:** {section.get('lines_of_code', 0)}")
            
            issue_count = section.get("issue_count", {})
            md.append(f"- **Quality Issues:** {issue_count.get('quality', 0)}")
            md.append(f"- **Security Issues:** {issue_count.get('security', 0)}")
            md.append("")
        
        if "requirement_validation" in sections:
            section = sections["requirement_validation"]
            md.append("## Requirement Validation")
            md.append(f"- **Requirement:** {section.get('requirement_id', 'N/A')} - {section.get('requirement_title', 'N/A')}")
            md.append(f"- **Decision:** {section.get('decision', 'N/A')}")
            md.append(f"- **Score:** {section.get('total_score', 0)}/100")
            md.append("")
        
        if "test_results" in sections:
            section = sections["test_results"]
            md.append("## Test Results")
            md.append(f"- **File Tested:** {section.get('file_tested', 'N/A')}")
            md.append(f"- **Functions Detected:** {section.get('functions_detected', 0)}")
            
            coverage = section.get("coverage", {})
            md.append(f"- **Test Coverage:** {coverage.get('coverage_percent', 0)}%")
            
            exec_summary = section.get("execution_summary", {})
            md.append(f"- **Tests Passed:** {exec_summary.get('passed', 0)}/{exec_summary.get('total_tests', 0)}")
            md.append("")
        
        # Recommendations
        recommendations = content.get("recommendations", [])
        if recommendations:
            md.append("## Recommendations")
            for rec in recommendations:
                md.append(f"- {rec}")
            md.append("")
        
        # Conclusions
        conclusions = content.get("conclusions", {})
        if conclusions:
            md.append("## Conclusion")
            md.append(f"**Status:** {conclusions.get('status', 'N/A')}")
            md.append(f"\n{conclusions.get('message', '')}")
            md.append(f"\n**Quality Gate:** {conclusions.get('quality_gate', 'N/A')}")
        
        return "\n".join(md)
