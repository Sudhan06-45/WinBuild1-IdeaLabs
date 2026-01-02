import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calendar,
  TrendingUp,
  X,
  Code2,
  ClipboardCheck,
  TestTube2
} from 'lucide-react'
import { documentsApi, agentsApi } from '@/services/api'
import toast from 'react-hot-toast'

interface Document {
  uuid: string
  title: string
  document_type: string
  summary: string
  overall_score: number
  compliance_score: number
  created_at: string
}

interface AgentExecution {
  id: number
  uuid: string
  agent_type: string
  status: string
  created_at: string
  input_data?: any
  output_data?: any
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [executions, setExecutions] = useState<AgentExecution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [title, setTitle] = useState('SQA Report - Sprint 1')
  const [codeExecutionId, setCodeExecutionId] = useState<number | null>(null)
  const [reqExecutionId, setReqExecutionId] = useState<number | null>(null)
  const [testExecutionId, setTestExecutionId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load documents
      let docsData: Document[] = []
      try {
        const docsResponse = await documentsApi.list(50 as unknown as string)
        docsData = Array.isArray(docsResponse) ? docsResponse : ((docsResponse as any)?.data || [])
      } catch (e) {
        console.log('No documents yet')
      }

      // Load executions
      let execsData: AgentExecution[] = []
      try {
        const execsResponse = await agentsApi.getHistory(50 as unknown as string)
        execsData = Array.isArray(execsResponse) ? execsResponse : ((execsResponse as any)?.data || [])
      } catch (e) {
        console.log('No executions yet')
      }

      setDocuments(docsData)
      setExecutions(execsData)
      
      console.log('Loaded executions:', execsData) // Debug log
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a document title')
      return
    }

    if (!codeExecutionId && !reqExecutionId && !testExecutionId) {
      toast.error('Please select at least one agent output')
      return
    }

    setIsGenerating(true)
    try {
      const payload: any = { title }
      if (codeExecutionId) payload.code_execution_id = codeExecutionId
      if (reqExecutionId) payload.requirement_execution_id = reqExecutionId
      if (testExecutionId) payload.test_execution_id = testExecutionId

      await documentsApi.generate(payload)
      toast.success('Document generated successfully!')
      setShowGenerateModal(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Generate error:', error)
      toast.error(error.response?.data?.detail || 'Failed to generate document')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await documentsApi.delete(uuid)
      toast.success('Document deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }

  const resetForm = () => {
    setTitle('SQA Report - Sprint 1')
    setCodeExecutionId(null)
    setReqExecutionId(null)
    setTestExecutionId(null)
  }

  const codeExecutions = executions.filter(e => e.agent_type === 'code' && e.status === 'completed')
  const reqExecutions = executions.filter(e => e.agent_type === 'requirement' && e.status === 'completed')
  const testExecutions = executions.filter(e => e.agent_type === 'test' && e.status === 'completed')

  const formatExecutionLabel = (exec: AgentExecution) => {
    const date = new Date(exec.created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    let info = ''
    if (exec.agent_type === 'code' && exec.input_data?.filename) {
      info = exec.input_data.filename
    } else if (exec.agent_type === 'requirement' && exec.input_data?.requirement_id) {
      info = exec.input_data.requirement_id
    } else if (exec.agent_type === 'test' && exec.output_data?.functions_detected) {
      info = `${exec.output_data.functions_detected} functions`
    }
    
    return info ? `${info} (${date})` : date
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-danger-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Documents</h1>
          <p className="text-secondary-600 mt-1">Generate and manage SQA reports</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Document
        </button>
      </div>

      {/* Debug info - remove after testing */}
      <div className="text-xs text-gray-500">
        Executions loaded: {executions.length} | Code: {codeExecutions.length} | Req: {reqExecutions.length} | Test: {testExecutions.length}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No documents yet</h3>
          <p className="text-secondary-600 mb-4">
            Generate your first SQA report by combining agent outputs
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Document
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div key={doc.uuid} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link 
                    to={`/documents/${doc.uuid}`}
                    className="text-lg font-semibold text-secondary-900 hover:text-primary-600"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-secondary-600 text-sm mt-1 line-clamp-2">
                    {doc.summary || 'No summary available'}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-secondary-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    {doc.overall_score && (
                      <span className={`flex items-center gap-1 font-medium ${getScoreColor(doc.overall_score)}`}>
                        <TrendingUp className="w-4 h-4" />
                        Score: {doc.overall_score}/100
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/documents/${doc.uuid}`}
                    className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                    title="View"
                  >
                    <FileText className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(doc.uuid)}
                    className="p-2 text-secondary-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">Generate SQA Document</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 hover:bg-secondary-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-secondary-600 text-sm mb-4">
              Select agent outputs to combine into a comprehensive report
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <Code2 className="w-4 h-4 inline mr-1" />
                  Code Analysis ({codeExecutions.length} available)
                </label>
                <select
                  value={codeExecutionId || ''}
                  onChange={(e) => setCodeExecutionId(e.target.value ? Number(e.target.value) : null)}
                  className="input"
                >
                  <option value="">-- Select code analysis --</option>
                  {codeExecutions.map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {formatExecutionLabel(exec)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <ClipboardCheck className="w-4 h-4 inline mr-1" />
                  Requirement Validation ({reqExecutions.length} available)
                </label>
                <select
                  value={reqExecutionId || ''}
                  onChange={(e) => setReqExecutionId(e.target.value ? Number(e.target.value) : null)}
                  className="input"
                >
                  <option value="">-- Select requirement validation --</option>
                  {reqExecutions.map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {formatExecutionLabel(exec)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <TestTube2 className="w-4 h-4 inline mr-1" />
                  Test Results ({testExecutions.length} available)
                </label>
                <select
                  value={testExecutionId || ''}
                  onChange={(e) => setTestExecutionId(e.target.value ? Number(e.target.value) : null)}
                  className="input"
                >
                  <option value="">-- Select test results --</option>
                  {testExecutions.map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {formatExecutionLabel(exec)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
