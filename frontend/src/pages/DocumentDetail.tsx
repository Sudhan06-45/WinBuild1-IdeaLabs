import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code2,
  FileCheck,
  TestTube2
} from 'lucide-react'
import { documentsApi } from '../services/api'

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.get(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.delete(id!),
    onSuccess: () => {
      toast.success('Document deleted')
      navigate('/documents')
    },
    onError: () => {
      toast.error('Failed to delete document')
    },
  })

  const exportMutation = useMutation({
    mutationFn: async (format: 'json' | 'markdown') => {
      const blob = format === 'json' 
        ? await documentsApi.exportJson(id!)
        : await documentsApi.exportMarkdown(id!)
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${document?.title || 'document'}.${format === 'json' ? 'json' : 'md'}`
      a.click()
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast.success('Document exported')
    },
    onError: () => {
      toast.error('Export failed')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="card text-center py-12">
        <XCircle size={48} className="mx-auto text-danger-500 mb-4" />
        <h3 className="font-semibold text-secondary-700">Document not found</h3>
        <button onClick={() => navigate('/documents')} className="btn-primary mt-4">
          Back to Documents
        </button>
      </div>
    )
  }

  const content = document.content || {}
  const sections = content.sections || {}
  const conclusions = content.conclusions || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="btn-ghost p-2"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{document.title}</h1>
            <p className="text-secondary-500 mt-1">
              Generated {format(new Date(document.created_at), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMutation.mutate('markdown')}
            className="btn-secondary"
            disabled={exportMutation.isPending}
          >
            <Download size={18} className="mr-2" />
            Export MD
          </button>
          <button
            onClick={() => exportMutation.mutate('json')}
            className="btn-secondary"
            disabled={exportMutation.isPending}
          >
            <Download size={18} className="mr-2" />
            Export JSON
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this document?')) {
                deleteMutation.mutate()
              }
            }}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={18} className="mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card text-center ${
            document.overall_score >= 75 ? 'bg-success-50 border-success-200' :
            document.overall_score >= 50 ? 'bg-warning-50 border-warning-200' :
            'bg-danger-50 border-danger-200'
          }`}
        >
          <p className="text-sm font-medium text-secondary-600">Overall Score</p>
          <p className={`text-5xl font-bold mt-2 ${
            document.overall_score >= 75 ? 'text-success-600' :
            document.overall_score >= 50 ? 'text-warning-600' :
            'text-danger-600'
          }`}>
            {document.overall_score || 0}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`card text-center ${
            document.compliance_score >= 75 ? 'bg-success-50 border-success-200' :
            document.compliance_score >= 50 ? 'bg-warning-50 border-warning-200' :
            'bg-danger-50 border-danger-200'
          }`}
        >
          <p className="text-sm font-medium text-secondary-600">Compliance Score</p>
          <p className={`text-5xl font-bold mt-2 ${
            document.compliance_score >= 75 ? 'text-success-600' :
            document.compliance_score >= 50 ? 'text-warning-600' :
            'text-danger-600'
          }`}>
            {document.compliance_score || 0}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`card text-center ${
            conclusions.status === 'APPROVED' ? 'bg-success-50 border-success-200' :
            conclusions.status === 'CONDITIONAL' ? 'bg-warning-50 border-warning-200' :
            'bg-danger-50 border-danger-200'
          }`}
        >
          <p className="text-sm font-medium text-secondary-600">Decision</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {conclusions.status === 'APPROVED' ? (
              <CheckCircle size={32} className="text-success-600" />
            ) : conclusions.status === 'CONDITIONAL' ? (
              <AlertTriangle size={32} className="text-warning-600" />
            ) : (
              <XCircle size={32} className="text-danger-600" />
            )}
            <span className={`text-2xl font-bold ${
              conclusions.status === 'APPROVED' ? 'text-success-600' :
              conclusions.status === 'CONDITIONAL' ? 'text-warning-600' :
              'text-danger-600'
            }`}>
              {conclusions.status || 'N/A'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Executive Summary */}
      {content.executive_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-secondary-900 mb-3">Executive Summary</h2>
          <p className="text-secondary-700 whitespace-pre-wrap">
            {content.executive_summary}
          </p>
        </motion.div>
      )}

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Analysis */}
        {sections.code_analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="text-primary-500" />
              <h3 className="font-semibold text-secondary-900">Code Analysis</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500">File</span>
                <span className="text-secondary-900">{sections.code_analysis.file_analyzed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Language</span>
                <span className="text-secondary-900">{sections.code_analysis.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Lines of Code</span>
                <span className="text-secondary-900">{sections.code_analysis.lines_of_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Quality Issues</span>
                <span className="text-secondary-900">{sections.code_analysis.issue_count?.quality || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Security Issues</span>
                <span className="text-secondary-900">{sections.code_analysis.issue_count?.security || 0}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Requirement Validation */}
        {sections.requirement_validation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="text-success-500" />
              <h3 className="font-semibold text-secondary-900">Requirement Validation</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500">Requirement</span>
                <span className="text-secondary-900">{sections.requirement_validation.requirement_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Title</span>
                <span className="text-secondary-900">{sections.requirement_validation.requirement_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Decision</span>
                <span className={`font-medium ${
                  sections.requirement_validation.decision === 'PASS' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {sections.requirement_validation.decision}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Score</span>
                <span className="text-secondary-900">{sections.requirement_validation.total_score}/100</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Test Results */}
        {sections.test_results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-4">
              <TestTube2 className="text-purple-500" />
              <h3 className="font-semibold text-secondary-900">Test Results</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500">File Tested</span>
                <span className="text-secondary-900">{sections.test_results.file_tested}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Functions Detected</span>
                <span className="text-secondary-900">{sections.test_results.functions_detected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Coverage</span>
                <span className="text-secondary-900">{sections.test_results.coverage?.coverage_percent || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">Tests Passed</span>
                <span className="text-success-600">
                  {sections.test_results.execution_summary?.passed || 0}/
                  {sections.test_results.execution_summary?.total_tests || 0}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recommendations */}
      {content.recommendations && content.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {content.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-warning-500 mt-0.5 flex-shrink-0" />
                <span className="text-secondary-700">{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Conclusion */}
      {conclusions.message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`card ${
            conclusions.quality_gate === 'PASS' ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'
          }`}
        >
          <h2 className="text-lg font-semibold text-secondary-900 mb-2">Conclusion</h2>
          <p className="text-secondary-700">{conclusions.message}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-secondary-500">Quality Gate:</span>
            <span className={`font-bold ${
              conclusions.quality_gate === 'PASS' ? 'text-success-600' : 'text-danger-600'
            }`}>
              {conclusions.quality_gate}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
