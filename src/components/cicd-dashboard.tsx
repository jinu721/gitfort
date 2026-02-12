'use client'

import { useState, useEffect } from 'react'
import { CommitLineChart, RepositoryBarChart } from './charts'

interface WorkflowRun {
  id: number
  workflowName: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
  branch: string
  actor: string
  createdAt: string
  duration: number | null
  htmlUrl: string
}

interface WorkflowMetrics {
  totalRuns: number
  successRate: number
  failureRate: number
  averageDuration: number
  runsPerDay: number
  mostActiveWorkflow: string
  leastReliableWorkflow: string
}

interface BuildFailure {
  runId: number
  workflowName: string
  branch: string
  failureType: string
  failureReason: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  isRecurring: boolean
}

interface CICDDashboardProps {
  repositories: Array<{ owner: string; name: string }>
}

export function CICDDashboard({ repositories }: CICDDashboardProps) {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([])
  const [failures, setFailures] = useState<BuildFailure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null)

  useEffect(() => {
    if (repositories.length > 0 && !selectedRepo) {
      setSelectedRepo(`${repositories[0].owner}/${repositories[0].name}`)
    }
  }, [repositories, selectedRepo])

  useEffect(() => {
    if (selectedRepo) {
      fetchCICDData()
    }
  }, [selectedRepo])

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(fetchCICDData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, selectedRepo])

  const fetchCICDData = async () => {
    if (!selectedRepo) return

    try {
      setLoading(true)
      setError(null)

      const [owner, repo] = selectedRepo.split('/')
      
      const [metricsResponse, runsResponse, failuresResponse] = await Promise.all([
        fetch(`/api/cicd/metrics?owner=${owner}&repo=${repo}`),
        fetch(`/api/cicd/runs?owner=${owner}&repo=${repo}&limit=20`),
        fetch(`/api/cicd/failures?owner=${owner}&repo=${repo}&days=7`)
      ])

      if (!metricsResponse.ok || !runsResponse.ok || !failuresResponse.ok) {
        throw new Error('Failed to fetch CI/CD data')
      }

      const [metricsData, runsData, failuresData] = await Promise.all([
        metricsResponse.json(),
        runsResponse.json(),
        failuresResponse.json()
      ])

      setMetrics(metricsData)
      setRecentRuns(runsData.runs || [])
      setFailures(failuresData.failures || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string, conclusion: string | null) => {
    if (status === 'in_progress') return 'text-blue-600 bg-blue-100'
    if (status === 'queued') return 'text-yellow-600 bg-yellow-100'
    if (conclusion === 'success') return 'text-green-600 bg-green-100'
    if (conclusion === 'failure') return 'text-red-600 bg-red-100'
    if (conclusion === 'cancelled') return 'text-gray-600 bg-gray-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'in_progress') return '🔄'
    if (status === 'queued') return '⏳'
    if (conclusion === 'success') return '✅'
    if (conclusion === 'failure') return '❌'
    if (conclusion === 'cancelled') return '⏹️'
    return '❓'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-200'
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'N/A'
    const minutes = Math.floor(duration / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    return `${minutes}m ${seconds}s`
  }

  if (loading && !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">CI/CD Dashboard</h1>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            {repositories.map(repo => (
              <option key={`${repo.owner}/${repo.name}`} value={`${repo.owner}/${repo.name}`}>
                {repo.owner}/{repo.name}
              </option>
            ))}
          </select>
          
          <select
            value={refreshInterval || ''}
            onChange={(e) => setRefreshInterval(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">No auto-refresh</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
          </select>
          
          <button
            onClick={fetchCICDData}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading CI/CD Data</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
              <p className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Runs</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalRuns}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Avg Duration</h3>
              <p className="text-2xl font-bold text-blue-600">{formatDuration(metrics.averageDuration)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Runs/Day</h3>
              <p className="text-2xl font-bold text-purple-600">{metrics.runsPerDay.toFixed(1)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Recent Workflow Runs</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentRuns.map(run => (
                  <div key={run.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(run.status, run.conclusion)}</span>
                      <div>
                        <p className="font-medium text-sm">{run.workflowName}</p>
                        <p className="text-xs text-gray-500">{run.branch} • {run.actor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(run.status, run.conclusion)}`}>
                        {run.conclusion || run.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDuration(run.duration)}</p>
                    </div>
                  </div>
                ))}
                {recentRuns.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent runs found</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Recent Failures</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {failures.map(failure => (
                  <div key={failure.runId} className="p-3 border rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{failure.workflowName}</p>
                        <p className="text-xs text-gray-500">{failure.branch}</p>
                        <p className="text-xs text-gray-700 mt-1">{failure.failureReason}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(failure.severity)}`}>
                          {failure.severity}
                        </span>
                        {failure.isRecurring && (
                          <span className="px-2 py-1 rounded text-xs font-medium text-orange-600 bg-orange-100">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {failures.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent failures</p>
                )}
              </div>
            </div>
          </div>

          {metrics.mostActiveWorkflow && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Workflow Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Most Active Workflow</h4>
                  <p className="text-lg font-semibold text-blue-600">{metrics.mostActiveWorkflow}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Least Reliable Workflow</h4>
                  <p className="text-lg font-semibold text-red-600">{metrics.leastReliableWorkflow || 'None'}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}