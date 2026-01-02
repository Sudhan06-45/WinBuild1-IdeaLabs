import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Code2,
  FileCheck,
  TestTube2,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Activity
} from 'lucide-react'
import { agentsApi, documentsApi } from '../services/api'
import { format } from 'date-fns'

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
  trend?: number
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-success-50 text-success-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-warning-50 text-warning-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <p className="text-3xl font-bold text-secondary-900 mt-1">{value}</p>
          <p className="text-sm text-secondary-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          <TrendingUp size={16} className={trend >= 0 ? 'text-success-500' : 'text-danger-500'} />
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-sm text-secondary-400 ml-1">vs last week</span>
        </div>
      )}
    </motion.div>
  )
}

function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  to, 
  color 
}: { 
  title: string
  description: string
  icon: React.ElementType
  to: string
  color: string
}) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="card-hover cursor-pointer group"
      >
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
          <Icon size={24} className="text-white" />
        </div>
        <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-secondary-500 mt-1">{description}</p>
        <div className="flex items-center gap-1 mt-4 text-primary-600 text-sm font-medium">
          Get Started <ArrowRight size={16} />
        </div>
      </motion.div>
    </Link>
  )
}

export default function Dashboard() {
  const { data: history } = useQuery({
    queryKey: ['execution-history'],
    queryFn: () => agentsApi.getHistory(undefined, 10),
  })

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(undefined, 5),
  })

  // Calculate stats from history
  const stats = {
    requirements: history?.filter((h: { agent_type: string }) => h.agent_type === 'requirement').length || 0,
    codeAnalyses: history?.filter((h: { agent_type: string }) => h.agent_type === 'code').length || 0,
    tests: history?.filter((h: { agent_type: string }) => h.agent_type === 'test').length || 0,
    documents: documents?.length || 0,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-500 mt-1">Overview of your quality assurance activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard
          title="Requirements"
          value={stats.requirements}
          subtitle="Validated this month"
          icon={FileCheck}
          color="green"
          trend={8}
        />
        <StatCard
          title="Code Analyses"
          value={stats.codeAnalyses}
          subtitle="Total analyses run"
          icon={Code2}
          color="blue"
          trend={12}
        />
       
        <StatCard
          title="Test Cases"
          value={stats.tests}
          subtitle="Generated tests"
          icon={TestTube2}
          color="purple"
          trend={24}
        />
        {/* <StatCard
          title="Documents"
          value={stats.documents}
          subtitle="SQA reports"
          icon={FileText}
          color="orange"
        /> */}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Validate Requirements"
            description="Check requirement quality"
            icon={FileCheck}
            to="/requirements"
            color="bg-success-500"
          />
          <QuickActionCard
            title="Analyze Code"
            description="Run static analysis on your code"
            icon={Code2}
            to="/code-analysis"
            color="bg-primary-500"
          />
          <QuickActionCard
            title="Generate Tests"
            description="Auto-generate test cases"
            icon={TestTube2}
            to="/test-generation"
            color="bg-purple-500"
          />
          {/* <QuickActionCard
            title="Create Document"
            description="Generate SQA report"
            icon={FileText}
            to="/documents"
            color="bg-warning-500"
          /> */}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Executions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Recent Activity</h3>
            <Activity size={20} className="text-secondary-400" />
          </div>
          
          {history && history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 5).map((item: { 
                uuid: string
                agent_type: string
                status: string
                created_at: string
                execution_time_ms?: number
              }) => (
                <div
                  key={item.uuid}
                  className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.agent_type === 'code' ? 'bg-primary-50 text-primary-600' :
                      item.agent_type === 'requirement' ? 'bg-success-50 text-success-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {item.agent_type === 'code' ? <Code2 size={16} /> :
                       item.agent_type === 'requirement' ? <FileCheck size={16} /> :
                       <TestTube2 size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-900 capitalize">
                        {item.agent_type} Analysis
                      </p>
                      <p className="text-xs text-secondary-500">
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' ? (
                      <CheckCircle2 size={16} className="text-success-500" />
                    ) : (
                      <XCircle size={16} className="text-danger-500" />
                    )}
                    <span className="text-xs text-secondary-500">
                      {item.execution_time_ms ? `${item.execution_time_ms}ms` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start by analyzing some code!</p>
            </div>
          )}
        </div>

        {/* Recent Documents
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Recent Documents</h3>
            <Link to="/documents" className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div> */}
          
          {/* {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.slice(0, 5).map((doc: {
                uuid: string
                title: string
                overall_score?: number
                created_at: string
              }) => (
                <Link
                  key={doc.uuid}
                  to={`/documents/${doc.uuid}`}
                  className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0 hover:bg-secondary-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning-50 text-warning-600">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        {doc.title}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {doc.overall_score !== undefined && (
                    <div className={`text-sm font-medium ${
                      doc.overall_score >= 75 ? 'text-success-600' : 
                      doc.overall_score >= 50 ? 'text-warning-600' : 
                      'text-danger-600'
                    }`}>
                      {doc.overall_score}%
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p>No documents yet</p>
              <p className="text-sm">Generate your first SQA report</p>
            </div>
          )} */}
        {/* </div> */}
      </div>
    </div>
  )
}
