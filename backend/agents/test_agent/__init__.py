"""
Test Generation Agent
Auto-detects functions and generates test cases
Adapted from the original test_agent code
"""

import re
import uuid
import inspect
import io
import contextlib
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from pydantic import BaseModel


# ============================================
# Data Models
# ============================================

@dataclass
class TestStep:
    action: str
    expected_result: str
    actual_result: str = ""
    status: str = ""


@dataclass
class TestCase:
    id: str
    name: str
    description: str
    steps: List[TestStep]
    test_type: str  # 'manual' or 'automation'
    priority: int
    requirement_id: str  # Event ID


# ============================================
# Test Generation Agent
# ============================================

class TestGenerationAgent:
    """
    Generates test cases from code by detecting functions.
    """
    
    def __init__(self):
        pass
    
    def generate(self, code: str, filename: str, test_count: int = 3) -> Dict[str, Any]:
        """
        Generate test cases from code
        
        Args:
            code: Source code string
            filename: Filename for context
            test_count: Number of test cases per function
        
        Returns:
            Dictionary with test generation results
        """
        # Detect functions in code
        functions = self._detect_functions(code, filename)
        
        if not functions:
            return {
                "filename": filename,
                "functions_detected": 0,
                "test_cases": [],
                "coverage": {},
                "execution_results": {}
            }
        
        # Generate test cases for each function
        test_cases = self._generate_test_cases(functions, test_count)
        
        # Execute tests if Python code
        execution_results = {}
        if filename.endswith('.py'):
            execution_results = self._execute_tests(code, functions, test_cases)
        
        # Calculate coverage
        coverage = self._calculate_coverage(functions, test_cases)
        
        return {
            "filename": filename,
            "functions_detected": len(functions),
            "functions": functions,
            "test_cases": [self._test_case_to_dict(tc) for tc in test_cases],
            "coverage": coverage,
            "execution_results": execution_results,
            "summary": {
                "total_functions": len(functions),
                "total_tests": len(test_cases),
                "tests_passed": sum(1 for r in execution_results.values() if "Error" not in r),
                "tests_failed": sum(1 for r in execution_results.values() if "Error" in r)
            }
        }
    
    def _detect_functions(self, code: str, filename: str) -> List[Dict[str, Any]]:
        """Detect functions in code"""
        functions = []
        
        # Detect based on file extension
        ext = filename.lower().split('.')[-1]
        
        if ext == 'py':
            # Python function detection
            pattern = r'def\s+(\w+)\s*\(([^)]*)\)'
            for i, match in enumerate(re.finditer(pattern, code)):
                func_name = match.group(1)
                params = match.group(2)
                
                # Skip test functions and private functions
                if func_name.startswith('test_') or func_name == 'run_tests':
                    continue
                
                functions.append({
                    "id": f"E{str(i+1).zfill(3)}",
                    "title": func_name,
                    "description": f"Function '{func_name}' that validates {func_name.replace('_', ' ')}",
                    "parameters": params,
                    "language": "python"
                })
        
        elif ext in ('js', 'jsx', 'ts', 'tsx'):
            # JavaScript/TypeScript function detection
            patterns = [
                r'function\s+(\w+)\s*\(([^)]*)\)',
                r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function\s*)?\(([^)]*)\)\s*=>',
                r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(([^)]*)\)',
            ]
            
            for pattern in patterns:
                for i, match in enumerate(re.finditer(pattern, code)):
                    func_name = match.group(1)
                    params = match.group(2) if match.lastindex >= 2 else ''
                    
                    functions.append({
                        "id": f"E{str(len(functions)+1).zfill(3)}",
                        "title": func_name,
                        "description": f"Function '{func_name}' that handles {func_name.replace('_', ' ')}",
                        "parameters": params,
                        "language": "javascript"
                    })
        
        elif ext == 'java':
            # Java method detection
            pattern = r'(?:public|private|protected)\s+(?:static\s+)?(\w+)\s+(\w+)\s*\(([^)]*)\)'
            for i, match in enumerate(re.finditer(pattern, code)):
                return_type = match.group(1)
                method_name = match.group(2)
                params = match.group(3)
                
                if method_name in ('main',):
                    continue
                
                functions.append({
                    "id": f"E{str(i+1).zfill(3)}",
                    "title": method_name,
                    "description": f"Method '{method_name}' returning {return_type}",
                    "parameters": params,
                    "return_type": return_type,
                    "language": "java"
                })
        
        return functions
    
    def _generate_test_cases(self, functions: List[Dict], test_count: int) -> List[TestCase]:
        """Generate test cases for detected functions"""
        test_cases = []
        
        for func in functions:
            for i in range(1, test_count + 1):
                step = TestStep(
                    action=f"Execute function '{func['title']}' with default/test inputs",
                    expected_result=f"Function '{func['title']}' should execute successfully and return expected output"
                )
                
                tc = TestCase(
                    id=str(uuid.uuid4()),
                    name=f"Test {i} for {func['title']}",
                    description=f"This test validates that the function '{func['title']}' behaves correctly",
                    steps=[step],
                    test_type="automation",
                    priority=1,
                    requirement_id=func['id']
                )
                
                test_cases.append(tc)
        
        return test_cases
    
    def _execute_tests(self, code: str, functions: List[Dict], 
                      test_cases: List[TestCase]) -> Dict[str, str]:
        """Execute test cases against Python code"""
        execution_results = {}
        
        # Safe execution environment
        safe_globals = {
            "List": list,
            "Dict": dict,
            "Tuple": tuple,
            "Set": set,
            "int": int,
            "str": str,
            "float": float,
            "bool": bool,
            "print": print,
            "range": range,
            "len": len,
            "enumerate": enumerate,
        }
        
        local_vars = {}
        
        try:
            exec(code, safe_globals, local_vars)
        except Exception as e:
            return {"__code_execution_error__": f"Error executing code: {str(e)}"}
        
        # Execute each test
        for tc in test_cases:
            func_name = tc.name.split("for")[-1].strip()
            func = local_vars.get(func_name)
            
            if func and callable(func):
                try:
                    args = self._get_dummy_args(func)
                    result = self._run_function(func, args)
                    execution_results[tc.name] = result
                    
                    # Update test step
                    if tc.steps:
                        tc.steps[0].actual_result = result
                        tc.steps[0].status = "Passed" if "Error" not in result else "Failed"
                        
                except Exception as e:
                    execution_results[tc.name] = f"Error: {str(e)}"
                    if tc.steps:
                        tc.steps[0].actual_result = f"Error: {str(e)}"
                        tc.steps[0].status = "Failed"
            else:
                execution_results[tc.name] = f"Function '{func_name}' not found in code"
                if tc.steps:
                    tc.steps[0].actual_result = "Function not found"
                    tc.steps[0].status = "Skipped"
        
        return execution_results
    
    def _get_dummy_args(self, func) -> List[Any]:
        """Generate dummy arguments for function"""
        try:
            sig = inspect.signature(func)
            args = []
            
            for param_name, param in sig.parameters.items():
                if param.default is not inspect.Parameter.empty:
                    args.append(param.default)
                elif param.annotation == int:
                    args.append(1)
                elif param.annotation == str:
                    args.append("test")
                elif param.annotation == list:
                    args.append([1, 2, 3])
                elif param.annotation == dict:
                    args.append({"key": "value"})
                elif param.annotation == bool:
                    args.append(True)
                elif param.annotation == float:
                    args.append(1.0)
                else:
                    args.append(None)
            
            return args
        except:
            return []
    
    def _run_function(self, func, args: List[Any]) -> str:
        """Execute function and capture output"""
        buffer = io.StringIO()
        try:
            with contextlib.redirect_stdout(buffer):
                result = func(*args)
            
            output = buffer.getvalue().strip()
            if result is not None:
                output += ("\n" if output else "") + str(result)
            
            return output or "Executed successfully (no output)"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _calculate_coverage(self, functions: List[Dict], 
                           test_cases: List[TestCase]) -> Dict[str, Any]:
        """Calculate test coverage"""
        total_functions = len(functions)
        tested_functions = len(set(tc.requirement_id for tc in test_cases))
        
        coverage_percent = (tested_functions / total_functions * 100) if total_functions > 0 else 0
        
        return {
            "total_functions": total_functions,
            "tested_functions": tested_functions,
            "coverage_percent": round(coverage_percent, 2),
            "function_coverage": {
                func['title']: "Covered" for func in functions
            }
        }
    
    def _test_case_to_dict(self, tc: TestCase) -> Dict[str, Any]:
        """Convert TestCase to dictionary"""
        return {
            "id": tc.id,
            "name": tc.name,
            "description": tc.description,
            "steps": [
                {
                    "action": step.action,
                    "expected_result": step.expected_result,
                    "actual_result": step.actual_result,
                    "status": step.status
                }
                for step in tc.steps
            ],
            "test_type": tc.test_type,
            "priority": tc.priority,
            "requirement_id": tc.requirement_id
        }
