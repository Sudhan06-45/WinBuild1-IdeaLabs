import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../context/authStore'

// Create axios instance
const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// ============================================
// Auth API
// ============================================

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  full_name?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: {
    id: number
    uuid: string
    email: string
    full_name: string | null
  }
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response.data
  },
  
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data)
    return response.data
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// ============================================
// Agents API
// ============================================

export interface CodeAnalysisRequest {
  code: string
  filename: string
  language?: string
}

export interface RequirementRequest {
  id?: string
  title: string
  description: string
  acceptance_criteria?: string[]
  nfrs?: string[]
}

export interface TestGenerationRequest {
  code: string
  filename: string
  test_count?: number
}

export interface AgentResponse {
  execution_id: string
  agent_type: string
  status: string
  result: Record<string, unknown>
  execution_time_ms: number
}

export const agentsApi = {
  // Code Agent
  analyzeCode: async (data: CodeAnalysisRequest): Promise<AgentResponse> => {
    const response = await api.post<AgentResponse>('/agents/code/analyze', data)
    return response.data
  },
  
  analyzeCodeFile: async (file: File): Promise<AgentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<AgentResponse>('/agents/code/analyze-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  
  // Requirement Agent
  validateRequirement: async (data: RequirementRequest): Promise<AgentResponse> => {
    const response = await api.post<AgentResponse>('/agents/requirement/validate', data)
    return response.data
  },
  
  extractRequirements: async (file: File): Promise<AgentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<AgentResponse>('/agents/requirement/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  
  // Test Agent
  generateTests: async (data: TestGenerationRequest): Promise<AgentResponse> => {
    const response = await api.post<AgentResponse>('/agents/test/generate', data)
    return response.data
  },
  
  generateTestsFromFile: async (file: File, testCount: number = 3): Promise<AgentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('test_count', testCount.toString())
    
    const response = await api.post<AgentResponse>('/agents/test/generate-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  
  // History
  getHistory: async (agentType?: string, limit: number = 50) => {
    const params = new URLSearchParams()
    if (agentType) params.append('agent_type', agentType)
    params.append('limit', limit.toString())
    
    const response = await api.get(`/agents/history?${params}`)
    return response.data
  },
  
  getExecution: async (executionUuid: string) => {
    const response = await api.get(`/agents/execution/${executionUuid}`)
    return response.data
  },
}

// ============================================
// Documents API
// ============================================

export interface DocumentGenerateRequest {
  title: string
  code_execution_id?: string
  requirement_execution_id?: string
  test_execution_id?: string
  code_analysis?: Record<string, unknown>
  requirement_validation?: Record<string, unknown>
  test_results?: Record<string, unknown>
}

export interface DocumentResponse {
  id: number
  uuid: string
  title: string
  document_type: string
  summary: string | null
  overall_score: number | null
  compliance_score: number | null
  created_at: string
}

export const documentsApi = {
  generate: async (data: DocumentGenerateRequest): Promise<DocumentResponse> => {
    const response = await api.post<DocumentResponse>('/documents/generate', data)
    return response.data
  },
  
  list: async (documentType?: string, limit: number = 50): Promise<DocumentResponse[]> => {
    const params = new URLSearchParams()
    if (documentType) params.append('document_type', documentType)
    params.append('limit', limit.toString())
    
    const response = await api.get<DocumentResponse[]>(`/documents?${params}`)
    return response.data
  },
  
  get: async (uuid: string) => {
    const response = await api.get(`/documents/${uuid}`)
    return response.data
  },
  
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/documents/${uuid}`)
  },
  
  exportJson: async (uuid: string): Promise<Blob> => {
    const response = await api.get(`/documents/${uuid}/export/json`, {
      responseType: 'blob',
    })
    return response.data
  },
  
  exportMarkdown: async (uuid: string): Promise<Blob> => {
    const response = await api.get(`/documents/${uuid}/export/markdown`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export default api
