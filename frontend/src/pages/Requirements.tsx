import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FileCheck,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Sparkles
} from 'lucide-react'
import { agentsApi } from '../services/api'

type ValidationResult = {
  execution_id: string
  result: {
    requirement_id: string
    title: string
    scores: {
      clarity: number
      completeness: number
      testability: number
      nfr: number
    }
    total_score: number
    decision: 'PASS' | 'FAIL'
    threshold: number
    feedback: {
      clarity_issues: string[]
      missing_items: string[]
      non_testable: string[]
      missing_nfrs: string[]
      covered_nfrs: string[]
    }
    generated_acceptance_criteria?: string[]
  }
  execution_time_ms: number
}

export default function Requirements() {
  const [requirement, setRequirement] = useState({
    id: 'FR-01',
    title: '',
    description: '',
    acceptance_criteria: [''],
    nfrs: [''],
  })
  const [result, setResult] = useState<ValidationResult | null>(null)

  const validateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: requirement.id,
        title: requirement.title,
        description: requirement.description,
        acceptance_criteria: requirement.acceptance_criteria.filter(ac => ac.trim()),
        nfrs: requirement.nfrs.filter(nfr => nfr.trim()),
      }
      return agentsApi.validateRequirement(payload)
    },
    onSuccess: (data) => {
      setResult(data as unknown as ValidationResult)
      toast.success('Validation completed!')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Validation failed')
    },
  })

  const addAcceptanceCriteria = () => {
    setRequirement(prev => ({
      ...prev,
      acceptance_criteria: [...prev.acceptance_criteria, '']
    }))
  }

  const removeAcceptanceCriteria = (index: number) => {
    setRequirement(prev => ({
      ...prev,
      acceptance_criteria: prev.acceptance_criteria.filter((_, i) => i !== index)
    }))
  }

  const updateAcceptanceCriteria = (index: number, value: string) => {
    setRequirement(prev => ({
      ...prev,
      acceptance_criteria: prev.acceptance_criteria.map((ac, i) => i === index ? value : ac)
    }))
  }

  const addNfr = () => {
    setRequirement(prev => ({
      ...prev,
      nfrs: [...prev.nfrs, '']
    }))
  }

  const removeNfr = (index: number) => {
    setRequirement(prev => ({
      ...prev,
      nfrs: prev.nfrs.filter((_, i) => i !== index)
    }))
  }

  const updateNfr = (index: number, value: string) => {
    setRequirement(prev => ({
      ...prev,
      nfrs: prev.nfrs.map((nfr, i) => i === index ? value : nfr)
    }))
  }

  const copyResults = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.result, null, 2))
      toast.success('Copied to clipboard')
    }
  }

  const loadSampleRequirement = () => {
    setRequirement({
      id: 'FR-LOGIN-01',
      title: 'Secure User Login',
      description: 'As a registered user, I want to log in using my email address and password so that I can securely access my account within 2 seconds.',
      acceptance_criteria: [
        'Given the user is registered, when the user enters valid credentials, then the system authenticates and redirects to dashboard.',
        'Given invalid credentials, when login is submitted, then the system displays an error message.',
        'Given successful login, when completed, then it finishes within 2 seconds.',
      ],
      nfrs: [
        'Security: Passwords shall be transmitted over HTTPS and stored using bcrypt.',
        'Performance: Authentication shall complete within 2 seconds for 95% of requests.',
        'Availability: Login service shall be available 99.9% of the time.',
      ],
    })
    toast.success('Sample requirement loaded')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Requirements Validation</h1>
          <p className="text-secondary-500 mt-1">Validate requirement quality using AI analysis</p>
        </div>
        <button onClick={loadSampleRequirement} className="btn-secondary">
          <Sparkles size={18} className="mr-2" />
          Load Sample
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Requirement Details</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Requirement ID</label>
                <input
                  type="text"
                  value={requirement.id}
                  onChange={(e) => setRequirement(prev => ({ ...prev, id: e.target.value }))}
                  className="input"
                  placeholder="FR-01"
                />
              </div>
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={requirement.title}
                  onChange={(e) => setRequirement(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Feature title"
                />
              </div>
            </div>

            <div>
              <label className="label">Description / User Story</label>
              <textarea
                value={requirement.description}
                onChange={(e) => setRequirement(prev => ({ ...prev, description: e.target.value }))}
                className="input h-24 resize-none"
                placeholder="As a [user], I want to [action] so that [benefit]..."
              />
            </div>

            {/* Acceptance Criteria */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Acceptance Criteria</label>
                <button
                  onClick={addAcceptanceCriteria}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {requirement.acceptance_criteria.map((ac, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ac}
                      onChange={(e) => updateAcceptanceCriteria(index, e.target.value)}
                      className="input flex-1"
                      placeholder="Given... when... then..."
                    />
                    {requirement.acceptance_criteria.length > 1 && (
                      <button
                        onClick={() => removeAcceptanceCriteria(index)}
                        className="text-danger-500 hover:text-danger-600 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-secondary-500 mt-1">
                Leave empty to auto-generate using AI
              </p>
            </div>

            {/* NFRs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Non-Functional Requirements</label>
                <button
                  onClick={addNfr}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {requirement.nfrs.map((nfr, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={nfr}
                      onChange={(e) => updateNfr(index, e.target.value)}
                      className="input flex-1"
                      placeholder="Performance: Response time < 2s"
                    />
                    {requirement.nfrs.length > 1 && (
                      <button
                        onClick={() => removeNfr(index)}
                        className="text-danger-500 hover:text-danger-600 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending || !requirement.description.trim()}
            className="btn-primary w-full mt-6"
          >
            {validateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Validating...
              </>
            ) : (
              <>
                <FileCheck size={20} className="mr-2" />
                Validate Requirement
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Validation Results</h2>
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
                {/* Decision Badge */}
                <div className={`p-6 rounded-xl text-center ${
                  result.result.decision === 'PASS' 
                    ? 'bg-gradient-to-br from-success-50 to-success-100' 
                    : 'bg-gradient-to-br from-danger-50 to-danger-100'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {result.result.decision === 'PASS' ? (
                      <CheckCircle size={32} className="text-success-600" />
                    ) : (
                      <XCircle size={32} className="text-danger-600" />
                    )}
                    <span className={`text-3xl font-bold ${
                      result.result.decision === 'PASS' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {result.result.decision}
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-secondary-900">
                    {result.result.total_score}/100
                  </p>
                  <p className="text-sm text-secondary-500 mt-1">
                    Threshold: {result.result.threshold}%
                  </p>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.result.scores).map(([key, value]) => (
                    <div key={key} className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-xs uppercase text-secondary-500 font-medium">
                        {key}
                      </p>
                      <p className={`text-xl font-bold ${
                        value >= 20 ? 'text-success-600' : 
                        value >= 10 ? 'text-warning-600' : 'text-danger-600'
                      }`}>
                        {value}/25
                      </p>
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {result.result.feedback.clarity_issues.length > 0 && (
                    <div className="p-3 bg-warning-50 rounded-lg">
                      <p className="text-sm font-semibold text-warning-700 mb-1">
                        <AlertCircle size={14} className="inline mr-1" />
                        Clarity Issues
                      </p>
                      <ul className="text-sm text-warning-600 space-y-1">
                        {result.result.feedback.clarity_issues.map((issue, i) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.result.feedback.missing_items.length > 0 && (
                    <div className="p-3 bg-danger-50 rounded-lg">
                      <p className="text-sm font-semibold text-danger-700 mb-1">
                        <XCircle size={14} className="inline mr-1" />
                        Missing Items
                      </p>
                      <ul className="text-sm text-danger-600 space-y-1">
                        {result.result.feedback.missing_items.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.result.feedback.missing_nfrs.length > 0 && (
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <p className="text-sm font-semibold text-primary-700 mb-1">
                        Missing NFRs
                      </p>
                      <ul className="text-sm text-primary-600 space-y-1">
                        {result.result.feedback.missing_nfrs.map((nfr, i) => (
                          <li key={i}>• {nfr}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.result.feedback.covered_nfrs.length > 0 && (
                    <div className="p-3 bg-success-50 rounded-lg">
                      <p className="text-sm font-semibold text-success-700 mb-1">
                        <CheckCircle size={14} className="inline mr-1" />
                        Covered NFRs
                      </p>
                      <ul className="text-sm text-success-600 space-y-1">
                        {result.result.feedback.covered_nfrs.map((nfr, i) => (
                          <li key={i}>• {nfr}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Generated Acceptance Criteria */}
                {result.result.generated_acceptance_criteria && 
                 result.result.generated_acceptance_criteria.length > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-semibold text-purple-700 mb-2">
                      <Sparkles size={14} className="inline mr-1" />
                      AI Generated Acceptance Criteria
                    </p>
                    <ul className="text-sm text-purple-600 space-y-2">
                      {result.result.generated_acceptance_criteria.map((ac, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono bg-purple-100 px-1 rounded text-xs">
                            AC{i + 1}
                          </span>
                          {ac}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-secondary-200 text-sm text-secondary-500">
                  <p>Requirement: {result.result.requirement_id} • Time: {result.execution_time_ms}ms</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <FileCheck size={48} className="mx-auto text-secondary-300 mb-4" />
                <p className="text-secondary-500">
                  Enter a requirement to validate
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
