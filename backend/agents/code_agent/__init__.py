"""
Code Review Agent
Static code analysis with quality and security checks
Adapted from the original Streamlit code-review-agent-v4
"""

import re
import ast
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict


# ============================================
# Configuration for False Positive Reduction
# ============================================

FALSE_POSITIVE_PATTERNS = {
    'ignore_files': [
        r'migrations?/', r'\.min\.js$', r'\.generated\.',
        r'package-lock\.json', r'yarn\.lock', r'\.config\.',
    ],
    'framework_files': [
        r'Program\.cs$', r'Startup\.cs$', r'main\.py$', r'app\.py$',
        r'__init__\.py$', r'index\.(js|ts)$', r'server\.(js|ts)$',
    ],
    'expected_complexity': [
        r'@Injectable', r'@Component', r'@Controller', r'@Service',
        r'app\.use\(', r'router\.', r'middleware',
    ]
}


# ============================================
# Data Classes
# ============================================

@dataclass
class CodeIssue:
    category: str  # 'Quality' or 'Security'
    severity: str  # 'Error', 'Warning', 'Info'
    line: int
    explanation: str
    impact: str
    suggested_fix: str
    cwe: Optional[str] = None


# ============================================
# Code Review Agent
# ============================================

class CodeReviewAgent:
    """
    Multi-language code analyzer with quality and security checks.
    """
    
    LANGUAGE_EXTENSIONS = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.java': 'java',
        '.go': 'go',
        '.cs': 'csharp',
        '.cpp': 'cpp',
        '.c': 'c',
    }
    
    def __init__(self):
        pass
    
    def get_language(self, file_path: str) -> str:
        """Detect language from file extension"""
        ext = Path(file_path).suffix.lower()
        return self.LANGUAGE_EXTENSIONS.get(ext, 'unknown')
    
    def should_ignore_file(self, file_path: str) -> bool:
        """Check if file should be ignored"""
        for pattern in FALSE_POSITIVE_PATTERNS['ignore_files']:
            if re.search(pattern, file_path, re.IGNORECASE):
                return True
        return False
    
    def is_framework_file(self, file_path: str) -> bool:
        """Check if file is a framework file"""
        for pattern in FALSE_POSITIVE_PATTERNS['framework_files']:
            if re.search(pattern, file_path, re.IGNORECASE):
                return True
        return False
    
    def analyze(self, code: str, file_path: str) -> Dict[str, Any]:
        """
        Analyze code and return comprehensive results
        
        Args:
            code: Source code string
            file_path: File path/name for language detection
        
        Returns:
            Dictionary with analysis results
        """
        if self.should_ignore_file(file_path):
            return {
                "file": file_path,
                "language": self.get_language(file_path),
                "skipped": True,
                "reason": "File matches ignore pattern",
                "quality_issues": [],
                "security_issues": [],
                "summary": {
                    "total_issues": 0,
                    "errors": 0,
                    "warnings": 0,
                    "info": 0
                }
            }
        
        lang = self.get_language(file_path)
        is_framework = self.is_framework_file(file_path)
        lines = code.split('\n')
        
        # Run analyzers
        quality_issues = self._analyze_quality(code, lines, lang, is_framework, file_path)
        security_issues = self._analyze_security(code, lines, lang)
        
        # Calculate summary
        all_issues = quality_issues + security_issues
        summary = {
            "total_issues": len(all_issues),
            "errors": sum(1 for i in all_issues if i["severity"] == "Error"),
            "warnings": sum(1 for i in all_issues if i["severity"] == "Warning"),
            "info": sum(1 for i in all_issues if i["severity"] == "Info"),
            "quality_score": self._calculate_quality_score(quality_issues, len(lines)),
            "security_score": self._calculate_security_score(security_issues)
        }
        
        return {
            "file": file_path,
            "language": lang,
            "lines_of_code": len(lines),
            "quality_issues": quality_issues,
            "security_issues": security_issues,
            "summary": summary,
            "skipped": False
        }
    
    def _calculate_quality_score(self, issues: List[Dict], total_lines: int) -> int:
        """Calculate quality score (0-100)"""
        if total_lines == 0:
            return 100
        
        penalty = 0
        for issue in issues:
            if issue["severity"] == "Error":
                penalty += 10
            elif issue["severity"] == "Warning":
                penalty += 5
            else:
                penalty += 1
        
        # Normalize by lines of code
        normalized_penalty = (penalty / max(total_lines / 100, 1)) * 10
        return max(0, int(100 - normalized_penalty))
    
    def _calculate_security_score(self, issues: List[Dict]) -> int:
        """Calculate security score (0-100)"""
        if not issues:
            return 100
        
        penalty = 0
        for issue in issues:
            if issue["severity"] == "Error":
                penalty += 25
            elif issue["severity"] == "Warning":
                penalty += 10
            else:
                penalty += 2
        
        return max(0, 100 - penalty)
    
    # ============================================
    # Quality Analysis
    # ============================================
    
    def _analyze_quality(self, code: str, lines: List[str], lang: str, 
                        is_framework: bool, file_path: str) -> List[Dict]:
        """Analyze code quality"""
        issues = []
        
        # Complexity checks
        issues.extend(self._check_complexity(code, lines, lang, is_framework))
        
        # Naming conventions
        issues.extend(self._check_naming(code, lang))
        
        # Code smells
        issues.extend(self._check_code_smells(lines, lang, is_framework))
        
        return issues
    
    def _check_complexity(self, code: str, lines: List[str], lang: str, 
                         is_framework: bool) -> List[Dict]:
        """Check function complexity"""
        issues = []
        
        if is_framework:
            return issues
        
        func_patterns = {
            'python': r'def\s+(\w+)\s*\(',
            'javascript': r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))',
            'typescript': r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))',
            'java': r'(?:public|private|protected)\s+\w+\s+(\w+)\s*\(',
            'go': r'func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(',
            'csharp': r'(?:public|private|protected)\s+\w+\s+(\w+)\s*\(',
        }
        
        pattern = func_patterns.get(lang)
        if not pattern:
            return issues
        
        for match in re.finditer(pattern, code):
            func_name = match.group(1) or match.group(2) if match.lastindex >= 2 else match.group(1)
            if not func_name:
                func_name = 'anonymous'
            
            start_line = code[:match.start()].count('\n') + 1
            
            # Count function lines
            brace_count, func_lines, started = 0, 0, False
            for char in code[match.start():]:
                if char == '{':
                    brace_count += 1
                    started = True
                elif char == '}':
                    brace_count -= 1
                    if started and brace_count == 0:
                        break
                elif char == '\n':
                    func_lines += 1
            
            if func_lines > 60:
                issues.append({
                    "category": "Quality",
                    "severity": "Warning",
                    "line": start_line,
                    "explanation": f"Function '{func_name}' is {func_lines} lines long.",
                    "impact": "Large functions are harder to test and maintain.",
                    "suggested_fix": f"Break '{func_name}' into smaller functions."
                })
        
        return issues
    
    def _check_naming(self, code: str, lang: str) -> List[Dict]:
        """Check naming conventions"""
        issues = []
        
        if lang == 'python':
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        if not node.name.startswith('_') and not re.match(r'^[a-z_][a-z0-9_]*$', node.name):
                            issues.append({
                                "category": "Quality",
                                "severity": "Info",
                                "line": node.lineno,
                                "explanation": f"Function '{node.name}' doesn't follow snake_case.",
                                "impact": "Inconsistent naming reduces readability.",
                                "suggested_fix": "Rename to snake_case format."
                            })
                    elif isinstance(node, ast.ClassDef):
                        if not re.match(r'^[A-Z][a-zA-Z0-9]*$', node.name):
                            issues.append({
                                "category": "Quality",
                                "severity": "Info",
                                "line": node.lineno,
                                "explanation": f"Class '{node.name}' doesn't follow PascalCase.",
                                "impact": "Inconsistent naming.",
                                "suggested_fix": "Rename to PascalCase."
                            })
            except SyntaxError as e:
                issues.append({
                    "category": "Quality",
                    "severity": "Error",
                    "line": e.lineno or 1,
                    "explanation": f"Syntax error: {e.msg}",
                    "impact": "Code will not execute.",
                    "suggested_fix": "Fix the syntax error."
                })
        
        return issues
    
    def _check_code_smells(self, lines: List[str], lang: str, is_framework: bool) -> List[Dict]:
        """Check for common code smells"""
        issues = []
        
        for i, line in enumerate(lines, 1):
            if lang == 'python':
                if re.search(r'except\s*:', line) and not is_framework:
                    issues.append({
                        "category": "Quality",
                        "severity": "Warning",
                        "line": i,
                        "explanation": "Bare except clause catches all exceptions.",
                        "impact": "May hide bugs and make debugging difficult.",
                        "suggested_fix": "Specify exception type (e.g., except ValueError:)."
                    })
                
                # Check for TODO/FIXME
                if re.search(r'#\s*(TODO|FIXME|XXX|HACK)', line, re.IGNORECASE):
                    issues.append({
                        "category": "Quality",
                        "severity": "Info",
                        "line": i,
                        "explanation": "TODO/FIXME comment found.",
                        "impact": "Technical debt indicator.",
                        "suggested_fix": "Address the TODO item or create a ticket."
                    })
            
            elif lang in ('javascript', 'typescript'):
                if re.search(r'\bvar\s+', line):
                    issues.append({
                        "category": "Quality",
                        "severity": "Info",
                        "line": i,
                        "explanation": "Using 'var' instead of 'let' or 'const'.",
                        "impact": "var has function scope which can lead to bugs.",
                        "suggested_fix": "Use 'const' for constants or 'let' for variables."
                    })
                
                if re.search(r'console\.log\(', line):
                    issues.append({
                        "category": "Quality",
                        "severity": "Info",
                        "line": i,
                        "explanation": "console.log statement found.",
                        "impact": "Should be removed in production code.",
                        "suggested_fix": "Remove or replace with proper logging."
                    })
        
        return issues
    
    # ============================================
    # Security Analysis
    # ============================================
    
    def _analyze_security(self, code: str, lines: List[str], lang: str) -> List[Dict]:
        """Analyze code for security issues"""
        issues = []
        
        issues.extend(self._check_hardcoded_secrets(lines))
        issues.extend(self._check_injection(lines, lang))
        issues.extend(self._check_dangerous_functions(lines, lang))
        issues.extend(self._check_security_best_practices(lines, lang))
        
        return issues
    
    def _check_hardcoded_secrets(self, lines: List[str]) -> List[Dict]:
        """Check for hardcoded secrets"""
        issues = []
        
        secret_patterns = [
            (r'(?:password|passwd|pwd)\s*[=:]\s*["\'][^"\']{4,}["\']', 'Hardcoded password'),
            (r'(?:api_?key|apikey|secret_?key)\s*[=:]\s*["\'][^"\']{8,}["\']', 'Hardcoded API key'),
            (r'["\'](?:sk-|pk_live_|sk_live_|ghp_|AKIA)[A-Za-z0-9]{10,}["\']', 'Exposed credential'),
        ]
        
        for i, line in enumerate(lines, 1):
            # Skip comments
            if line.strip().startswith(('#', '//', '/*', '*')):
                continue
            
            # Skip placeholder values
            if any(p in line.lower() for p in ['example', 'placeholder', 'xxx', 'changeme', 'your_', 'todo']):
                continue
            
            for pattern, msg in secret_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    issues.append({
                        "category": "Security",
                        "severity": "Error",
                        "line": i,
                        "explanation": f"{msg} detected.",
                        "impact": "Credentials can be leaked via version control.",
                        "suggested_fix": "Use environment variables or a secrets manager.",
                        "cwe": "798"
                    })
                    break
        
        return issues
    
    def _check_injection(self, lines: List[str], lang: str) -> List[Dict]:
        """Check for injection vulnerabilities"""
        issues = []
        
        sql_patterns = [
            r'execute\s*\(\s*f["\'].*SELECT',
            r'execute\s*\(\s*["\'].*%s.*%',
            r'query\s*\(\s*["\'].*\+\s*\w+',
            r'cursor\.execute\s*\(\s*["\'].*\+',
        ]
        
        for i, line in enumerate(lines, 1):
            for pattern in sql_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    issues.append({
                        "category": "Security",
                        "severity": "Error",
                        "line": i,
                        "explanation": "Potential SQL injection vulnerability.",
                        "impact": "Attackers can execute arbitrary SQL queries.",
                        "suggested_fix": "Use parameterized queries or prepared statements.",
                        "cwe": "89"
                    })
                    break
        
        return issues
    
    def _check_dangerous_functions(self, lines: List[str], lang: str) -> List[Dict]:
        """Check for dangerous function usage"""
        issues = []
        
        dangerous = {
            'python': [
                (r'\beval\s*\(', 'eval() executes arbitrary code', '95'),
                (r'\bexec\s*\(', 'exec() executes arbitrary code', '95'),
                (r'pickle\.loads?\s*\(', 'Pickle deserialization is unsafe', '502'),
                (r'subprocess\..*shell\s*=\s*True', 'Shell=True allows command injection', '78'),
            ],
            'javascript': [
                (r'\beval\s*\(', 'eval() executes arbitrary code', '95'),
                (r'innerHTML\s*=\s*[^"\'`]', 'innerHTML can cause XSS', '79'),
                (r'document\.write\s*\(', 'document.write can cause XSS', '79'),
            ],
            'typescript': [
                (r'\beval\s*\(', 'eval() executes arbitrary code', '95'),
                (r'innerHTML\s*=\s*[^"\'`]', 'innerHTML can cause XSS', '79'),
            ],
        }
        
        for pattern, msg, cwe in dangerous.get(lang, []):
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line):
                    issues.append({
                        "category": "Security",
                        "severity": "Error",
                        "line": i,
                        "explanation": msg,
                        "impact": "Can lead to remote code execution.",
                        "suggested_fix": "Use safer alternatives.",
                        "cwe": cwe
                    })
        
        return issues
    
    def _check_security_best_practices(self, lines: List[str], lang: str) -> List[Dict]:
        """Check security best practices"""
        issues = []
        
        for i, line in enumerate(lines, 1):
            # Check for HTTP instead of HTTPS
            if re.search(r'http://', line, re.IGNORECASE):
                if 'localhost' not in line.lower() and '127.0.0.1' not in line:
                    issues.append({
                        "category": "Security",
                        "severity": "Warning",
                        "line": i,
                        "explanation": "Using HTTP instead of HTTPS.",
                        "impact": "Data transmitted in plain text can be intercepted.",
                        "suggested_fix": "Use HTTPS for all external connections.",
                        "cwe": "319"
                    })
        
        return issues
