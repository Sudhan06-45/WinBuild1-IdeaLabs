import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Code2,
  Upload,
  FileCode,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Download
} from 'lucide-react'
import { agentsApi } from '../services/api'

type AnalysisResult = {
  execution_id: string
  result: {
    file: string
    language: string
    lines_of_code: number
    quality_issues: Array<{
      category: string
      severity: string
      line: number
      explanation: string
      impact: string
      suggested_fix: string
    }>
    security_issues: Array<{
      category: string
      severity: string
      line: number
      explanation: string
      impact: string
      suggested_fix: string
      cwe?: string
    }>
    summary: {
      total_issues: number
      errors: number
      warnings: number
      info: number
      quality_score: number
      security_score: number
    }
  }
  execution_time_ms: number
}

export default function CodeAnalysis() {
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste')
  const [code, setCode] = useState('')
  const [filename, setFilename] = useState('code.py')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (inputMode === 'upload' && selectedFile) {
        return agentsApi.analyzeCodeFile(selectedFile)
      }
      return agentsApi.analyzeCode({ code, filename })
    },
    onSuccess: (data) => {
      setResult(data as AnalysisResult)
      toast.success('Analysis completed!')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Analysis failed')
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFilename(file.name)
    }
  }

  const handleAnalyze = () => {
    if (inputMode === 'paste' && !code.trim()) {
      toast.error('Please enter some code to analyze')
      return
    }
    if (inputMode === 'upload' && !selectedFile) {
      toast.error('Please select a file to analyze')
      return
    }
    analyzeMutation.mutate()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Code Analysis</h1>
          <p className="text-secondary-500 mt-1">Analyze code for quality and security issues</p>
        </div>
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
              <Code2 size={18} className="inline mr-2" />
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
              <div className="mb-4">
                <label className="label">Filename (for language detection)</label>
                <select
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="input"
                >
                  <option value="code.py">Python (.py)</option>
                  <option value="code.js">JavaScript (.js)</option>
                  <option value="code.ts">TypeScript (.ts)</option>
                  <option value="code.java">Java (.java)</option>
                  <option value="code.go">Go (.go)</option>
                  <option value="code.cs">C# (.cs)</option>
                </select>
              </div>
              
              <div>
                <label className="label">Code</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input font-mono text-sm h-64 resize-none"
                  placeholder="Paste your code here..."
                />
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-secondary-300 rounded-xl p-8 text-center">
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".py,.js,.jsx,.ts,.tsx,.java,.go,.cs"
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
                      .py, .js, .ts, .java, .go, .cs files
                    </p>
                  </>
                )}
              </label>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="btn-primary w-full mt-6"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Code2 size={20} className="mr-2" />
                Analyze Code
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Results</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${
                    result.result.summary.quality_score >= 75 ? 'bg-success-50' : 
                    result.result.summary.quality_score >= 50 ? 'bg-warning-50' : 'bg-danger-50'
                  }`}>
                    <p className="text-sm font-medium text-secondary-600">Quality Score</p>
                    <p className={`text-3xl font-bold ${
                      result.result.summary.quality_score >= 75 ? 'text-success-600' : 
                      result.result.summary.quality_score >= 50 ? 'text-warning-600' : 'text-danger-600'
                    }`}>
                      {result.result.summary.quality_score}%
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${
                    result.result.summary.security_score >= 75 ? 'bg-success-50' : 
                    result.result.summary.security_score >= 50 ? 'bg-warning-50' : 'bg-danger-50'
                  }`}>
                    <p className="text-sm font-medium text-secondary-600">Security Score</p>
                    <p className={`text-3xl font-bold ${
                      result.result.summary.security_score >= 75 ? 'text-success-600' : 
                      result.result.summary.security_score >= 50 ? 'text-warning-600' : 'text-danger-600'
                    }`}>
                      {result.result.summary.security_score}%
                    </p>
                  </div>
                </div>

                {/* Issue Counts */}
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-danger-600">
                    <XCircle size={16} /> {result.result.summary.errors} Errors
                  </span>
                  <span className="flex items-center gap-1 text-warning-600">
                    <AlertTriangle size={16} /> {result.result.summary.warnings} Warnings
                  </span>
                  <span className="flex items-center gap-1 text-primary-600">
                    <CheckCircle size={16} /> {result.result.summary.info} Info
                  </span>
                </div>

                {/* Issues List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.result.security_issues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                        <Shield size={16} className="text-danger-500" />
                        Security Issues
                      </h3>
                      {result.result.security_issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg mb-2 border-l-4 ${
                            issue.severity === 'Error' ? 'bg-danger-50 border-danger-500' :
                            issue.severity === 'Warning' ? 'bg-warning-50 border-warning-500' :
                            'bg-primary-50 border-primary-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-semibold uppercase text-secondary-500">
                                Line {issue.line}
                              </span>
                              <p className="text-sm font-medium text-secondary-900 mt-1">
                                {issue.explanation}
                              </p>
                              <p className="text-xs text-secondary-600 mt-1">
                                💡 {issue.suggested_fix}
                              </p>
                            </div>
                            {issue.cwe && (
                              <span className="text-xs bg-danger-100 text-danger-700 px-2 py-1 rounded">
                                CWE-{issue.cwe}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.result.quality_issues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                        <Code2 size={16} className="text-warning-500" />
                        Quality Issues
                      </h3>
                      {result.result.quality_issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg mb-2 border-l-4 ${
                            issue.severity === 'Error' ? 'bg-danger-50 border-danger-500' :
                            issue.severity === 'Warning' ? 'bg-warning-50 border-warning-500' :
                            'bg-primary-50 border-primary-500'
                          }`}
                        >
                          <span className="text-xs font-semibold uppercase text-secondary-500">
                            Line {issue.line}
                          </span>
                          <p className="text-sm font-medium text-secondary-900 mt-1">
                            {issue.explanation}
                          </p>
                          <p className="text-xs text-secondary-600 mt-1">
                            💡 {issue.suggested_fix}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.result.quality_issues.length === 0 && 
                   result.result.security_issues.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle size={48} className="mx-auto text-success-500 mb-3" />
                      <p className="text-lg font-medium text-secondary-900">
                        No issues found!
                      </p>
                      <p className="text-sm text-secondary-500">
                        Your code looks clean
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-secondary-200 text-sm text-secondary-500">
                  <p>File: {result.result.file} • Language: {result.result.language}</p>
                  <p>Lines: {result.result.lines_of_code} • Time: {result.execution_time_ms}ms</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Code2 size={48} className="mx-auto text-secondary-300 mb-4" />
                <p className="text-secondary-500">
                  Paste code or upload a file to analyze
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
