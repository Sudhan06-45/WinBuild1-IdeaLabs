import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  TestTube2,
  Upload,
  FileCode,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Copy,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { agentsApi } from '../services/api'

type TestResult = {
  execution_id: string
  result: {
    filename: string
    functions_detected: number
    functions: Array<{
      id: string
      title: string
      description: string
      parameters: string
      language: string
    }>
    test_cases: Array<{
      id: string
      name: string
      description: string
      steps: Array<{
        action: string
        expected_result: string
        actual_result: string
        status: string
      }>
      test_type: string
      priority: number
      requirement_id: string
    }>
    coverage: {
      total_functions: number
      tested_functions: number
      coverage_percent: number
      function_coverage: Record<string, string>
    }
    summary: {
      total_functions: number
      total_tests: number
      tests_passed: number
      tests_failed: number
    }
  }
  execution_time_ms: number
}

export default function TestGeneration() {
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste')
  const [code, setCode] = useState('')
  const [filename, setFilename] = useState('code.py')
  const [testCount, setTestCount] = useState(3)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<TestResult | null>(null)
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (inputMode === 'upload' && selectedFile) {
        return agentsApi.generateTestsFromFile(selectedFile, testCount)
      }
      return agentsApi.generateTests({ code, filename, test_count: testCount })
    },
    onSuccess: (data) => {
      setResult(data as TestResult)
      toast.success('Test cases generated!')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Generation failed')
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFilename(file.name)
    }
  }

  const toggleTestExpand = (testId: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev)
      if (next.has(testId)) {
        next.delete(testId)
      } else {
        next.add(testId)
      }
      return next
    })
  }

  const copyResults = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.result, null, 2))
      toast.success('Copied to clipboard')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Test Generation</h1>
        <p className="text-secondary-500 mt-1">Auto-generate test cases from your code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Input Code</h2>
          
          {/* Input Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('paste')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                inputMode === 'paste'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
            >
              <FileCode size={18} className="inline mr-2" />
              Paste Code
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                inputMode === 'upload'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
            >
              <Upload size={18} className="inline mr-2" />
              Upload File
            </button>
          </div>

          {inputMode === 'paste' ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Language</label>
                  <select
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="input"
                  >
                    <option value="code.py">Python (.py)</option>
                    <option value="code.js">JavaScript (.js)</option>
                    <option value="code.ts">TypeScript (.ts)</option>
                    <option value="code.java">Java (.java)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tests per function</label>
                  <select
                    value={testCount}
                    onChange={(e) => setTestCount(Number(e.target.value))}
                    className="input"
                  >
                    <option value={1}>1 test</option>
                    <option value={2}>2 tests</option>
                    <option value={3}>3 tests</option>
                    <option value={5}>5 tests</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">Code</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input font-mono text-sm h-64 resize-none"
                  placeholder={`def calculate_sum(a, b):
    """Calculate the sum of two numbers"""
    return a + b

def validate_email(email):
    """Check if email is valid"""
    return "@" in email and "." in email`}
                />
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-secondary-300 rounded-xl p-8 text-center">
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".py,.js,.jsx,.ts,.tsx,.java"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileCode size={32} className="text-primary-500" />
                    <div className="text-left">
                      <p className="font-medium text-secondary-900">{selectedFile.name}</p>
                      <p className="text-sm text-secondary-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className="mx-auto text-secondary-400 mb-3" />
                    <p className="font-medium text-secondary-700">Click to upload</p>
                    <p className="text-sm text-secondary-500 mt-1">
                      .py, .js, .ts, .java files
                    </p>
                  </>
                )}
              </label>
              
              {inputMode === 'upload' && (
                <div className="mt-4">
                  <label className="label">Tests per function</label>
                  <select
                    value={testCount}
                    onChange={(e) => setTestCount(Number(e.target.value))}
                    className="input w-32 mx-auto"
                  >
                    <option value={1}>1 test</option>
                    <option value={2}>2 tests</option>
                    <option value={3}>3 tests</option>
                    <option value={5}>5 tests</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-primary w-full mt-6"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Generating Tests...
              </>
            ) : (
              <>
                <TestTube2 size={20} className="mr-2" />
                Generate Test Cases
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Generated Tests</h2>
            {result && (
              <button onClick={copyResults} className="btn-ghost text-sm">
                <Copy size={16} className="mr-1" />
                Copy JSON
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-primary-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {result.result.functions_detected}
                    </p>
                    <p className="text-xs text-secondary-600">Functions</p>
                  </div>
                  <div className="bg-success-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-success-600">
                      {result.result.summary.total_tests}
                    </p>
                    <p className="text-xs text-secondary-600">Tests</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {result.result.coverage.coverage_percent}%
                    </p>
                    <p className="text-xs text-secondary-600">Coverage</p>
                  </div>
                </div>

                {/* Detected Functions */}
                {result.result.functions.length > 0 && (
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <p className="text-sm font-semibold text-secondary-700 mb-2">
                      Detected Functions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.result.functions.map((func, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white rounded text-sm font-mono text-primary-600 border border-secondary-200"
                        >
                          {func.title}()
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Cases */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.result.test_cases.map((tc) => (
                    <div
                      key={tc.id}
                      className="border border-secondary-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleTestExpand(tc.id)}
                        className="w-full flex items-center justify-between p-3 bg-white hover:bg-secondary-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedTests.has(tc.id) ? (
                            <ChevronDown size={18} className="text-secondary-400" />
                          ) : (
                            <ChevronRight size={18} className="text-secondary-400" />
                          )}
                          <span className="font-medium text-secondary-900">
                            {tc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tc.steps[0]?.status === 'Passed' ? (
                            <CheckCircle size={16} className="text-success-500" />
                          ) : tc.steps[0]?.status === 'Failed' ? (
                            <XCircle size={16} className="text-danger-500" />
                          ) : (
                            <Play size={16} className="text-secondary-400" />
                          )}
                          <span className="text-xs px-2 py-0.5 bg-secondary-100 rounded text-secondary-600">
                            {tc.test_type}
                          </span>
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedTests.has(tc.id) && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 bg-secondary-50 border-t border-secondary-200">
                              <p className="text-sm text-secondary-600 mb-3">
                                {tc.description}
                              </p>
                              {tc.steps.map((step, idx) => (
                                <div key={idx} className="text-sm space-y-1">
                                  <div className="flex items-start gap-2">
                                    <span className="text-secondary-400 font-mono">→</span>
                                    <span className="text-secondary-700">{step.action}</span>
                                  </div>
                                  <div className="flex items-start gap-2 ml-4">
                                    <span className="text-xs text-secondary-500">Expected:</span>
                                    <span className="text-xs text-secondary-600">
                                      {step.expected_result}
                                    </span>
                                  </div>
                                  {step.actual_result && (
                                    <div className="flex items-start gap-2 ml-4">
                                      <span className="text-xs text-secondary-500">Actual:</span>
                                      <span className={`text-xs ${
                                        step.status === 'Passed' ? 'text-success-600' : 
                                        step.status === 'Failed' ? 'text-danger-600' : 
                                        'text-secondary-600'
                                      }`}>
                                        {step.actual_result}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-secondary-200 text-sm text-secondary-500">
                  <p>File: {result.result.filename} • Time: {result.execution_time_ms}ms</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <TestTube2 size={48} className="mx-auto text-secondary-300 mb-4" />
                <p className="text-secondary-500">
                  Paste code or upload a file to generate tests
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
