import { GitHubAPIClient } from './github-api-client'

export interface WorkflowRun {
  id: number
  name: string
  head_branch: string
  head_sha: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
  workflow_id: number
  workflow_name: string
  created_at: string
  updated_at: string
  run_started_at: string
  jobs_url: string
  logs_url: string
  check_suite_url: string
  artifacts_url: string
  cancel_url: string
  rerun_url: string
  workflow_url: string
  html_url: string
  pull_requests: Array<{
    id: number
    number: number
    url: string
    head: {
      ref: string
      sha: string
    }
    base: {
      ref: string
      sha: string
    }
  }>
  repository: {
    id: number
    name: string
    full_name: string
  }
  head_commit: {
    id: string
    tree_id: string
    message: string
    timestamp: string
    author: {
      name: string
      email: string
    }
    committer: {
      name: string
      email: string
    }
  }
  actor: {
    login: string
    id: number
    avatar_url: string
  }
  triggering_actor: {
    login: string
    id: number
    avatar_url: string
  }
  event: string
  run_number: number
  run_attempt: number
  referenced_workflows: Array<{
    path: string
    sha: string
    ref: string
  }>
}

export interface WorkflowJob {
  id: number
  run_id: number
  workflow_name: string
  head_branch: string
  run_url: string
  run_attempt: number
  node_id: string
  head_sha: string
  url: string
  html_url: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
  started_at: string
  completed_at: string | null
  name: string
  steps: Array<{
    name: string
    status: 'queued' | 'in_progress' | 'completed'
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
    number: number
    started_at: string | null
    completed_at: string | null
  }>
  check_run_url: string
  labels: string[]
  runner_id: number | null
  runner_name: string | null
  runner_group_id: number | null
  runner_group_name: string | null
}

export interface WorkflowFetchOptions {
  status?: 'completed' | 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'skipped' | 'stale' | 'success' | 'timed_out' | 'in_progress' | 'queued'
  actor?: string
  branch?: string
  event?: string
  created?: string
  exclude_pull_requests?: boolean
  check_suite_id?: number
  head_sha?: string
  per_page?: number
  page?: number
}

export class WorkflowDataFetcher {
  private githubClient: GitHubAPIClient

  constructor(githubClient: GitHubAPIClient) {
    this.githubClient = githubClient
  }

  async fetchWorkflowRuns(
    owner: string, 
    repo: string, 
    options: WorkflowFetchOptions = {}
  ): Promise<{ workflow_runs: WorkflowRun[]; total_count: number }> {
    const params = new URLSearchParams()
    
    if (options.status) params.append('status', options.status)
    if (options.actor) params.append('actor', options.actor)
    if (options.branch) params.append('branch', options.branch)
    if (options.event) params.append('event', options.event)
    if (options.created) params.append('created', options.created)
    if (options.exclude_pull_requests) params.append('exclude_pull_requests', 'true')
    if (options.check_suite_id) params.append('check_suite_id', options.check_suite_id.toString())
    if (options.head_sha) params.append('head_sha', options.head_sha)
    
    params.append('per_page', (options.per_page || 30).toString())
    params.append('page', (options.page || 1).toString())

    const url = `/repos/${owner}/${repo}/actions/runs?${params.toString()}`
    
    try {
      const response = await this.githubClient.get(url)
      return response
    } catch (error) {
      console.error(`Failed to fetch workflow runs for ${owner}/${repo}:`, error)
      throw error
    }
  }

  async fetchWorkflowRunJobs(
    owner: string, 
    repo: string, 
    runId: number
  ): Promise<{ jobs: WorkflowJob[]; total_count: number }> {
    const url = `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`
    
    try {
      const response = await this.githubClient.get(url)
      return response
    } catch (error) {
      console.error(`Failed to fetch jobs for workflow run ${runId}:`, error)
      throw error
    }
  }

  async fetchAllWorkflowRuns(
    owner: string, 
    repo: string, 
    options: WorkflowFetchOptions = {}
  ): Promise<WorkflowRun[]> {
    const allRuns: WorkflowRun[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await this.fetchWorkflowRuns(owner, repo, {
        ...options,
        per_page: perPage,
        page
      })

      allRuns.push(...response.workflow_runs)

      if (response.workflow_runs.length < perPage) {
        break
      }

      page++
    }

    return allRuns
  }

  async fetchRecentWorkflowRuns(
    owner: string, 
    repo: string, 
    days: number = 30
  ): Promise<WorkflowRun[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceIso = since.toISOString()

    return this.fetchAllWorkflowRuns(owner, repo, {
      created: `>=${sinceIso}`
    })
  }

  async fetchFailedWorkflowRuns(
    owner: string, 
    repo: string, 
    days: number = 7
  ): Promise<WorkflowRun[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceIso = since.toISOString()

    const runs = await this.fetchAllWorkflowRuns(owner, repo, {
      status: 'completed',
      created: `>=${sinceIso}`
    })

    return runs.filter(run => run.conclusion === 'failure')
  }

  async fetchWorkflowRunsByBranch(
    owner: string, 
    repo: string, 
    branch: string, 
    limit: number = 50
  ): Promise<WorkflowRun[]> {
    const response = await this.fetchWorkflowRuns(owner, repo, {
      branch,
      per_page: limit
    })

    return response.workflow_runs
  }

  async fetchWorkflowRunsForUser(
    repositories: Array<{ owner: string; name: string }>, 
    options: WorkflowFetchOptions = {}
  ): Promise<Array<{ repository: string; runs: WorkflowRun[] }>> {
    const results = []

    for (const repo of repositories) {
      try {
        const runs = await this.fetchAllWorkflowRuns(repo.owner, repo.name, options)
        results.push({
          repository: `${repo.owner}/${repo.name}`,
          runs
        })
      } catch (error) {
        console.error(`Failed to fetch workflows for ${repo.owner}/${repo.name}:`, error)
        results.push({
          repository: `${repo.owner}/${repo.name}`,
          runs: []
        })
      }
    }

    return results
  }

  async fetchWorkflowStatistics(
    owner: string, 
    repo: string, 
    days: number = 30
  ): Promise<{
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    cancelledRuns: number
    successRate: number
    averageDuration: number
    mostFrequentFailures: Array<{ workflow: string; count: number }>
  }> {
    const runs = await this.fetchRecentWorkflowRuns(owner, repo, days)
    
    const completedRuns = runs.filter(run => run.status === 'completed')
    const successfulRuns = completedRuns.filter(run => run.conclusion === 'success')
    const failedRuns = completedRuns.filter(run => run.conclusion === 'failure')
    const cancelledRuns = completedRuns.filter(run => run.conclusion === 'cancelled')

    const successRate = completedRuns.length > 0 
      ? (successfulRuns.length / completedRuns.length) * 100 
      : 0

    const durations = completedRuns
      .filter(run => run.run_started_at && run.updated_at)
      .map(run => {
        const start = new Date(run.run_started_at).getTime()
        const end = new Date(run.updated_at).getTime()
        return end - start
      })

    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0

    const failuresByWorkflow = new Map<string, number>()
    failedRuns.forEach(run => {
      const count = failuresByWorkflow.get(run.workflow_name) || 0
      failuresByWorkflow.set(run.workflow_name, count + 1)
    })

    const mostFrequentFailures = Array.from(failuresByWorkflow.entries())
      .map(([workflow, count]) => ({ workflow, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRuns: runs.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      cancelledRuns: cancelledRuns.length,
      successRate,
      averageDuration,
      mostFrequentFailures
    }
  }
}