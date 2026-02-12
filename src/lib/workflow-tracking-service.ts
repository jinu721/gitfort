import { WorkflowDataFetcher, WorkflowRun } from './workflow-fetcher'
import { WorkflowRunModel } from './models/workflow-run'
import { database } from './database'

export interface WorkflowMetrics {
  totalRuns: number
  successRate: number
  failureRate: number
  averageDuration: number
  medianDuration: number
  totalDuration: number
  runsPerDay: number
  mostActiveWorkflow: string
  leastReliableWorkflow: string
}

export interface WorkflowTrend {
  date: string
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  successRate: number
  averageDuration: number
}

export interface WorkflowPerformance {
  workflowName: string
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  successRate: number
  averageDuration: number
  lastRun: Date | null
  trend: 'improving' | 'declining' | 'stable'
}

export class WorkflowTrackingService {
  private workflowFetcher: WorkflowDataFetcher

  constructor(workflowFetcher: WorkflowDataFetcher) {
    this.workflowFetcher = workflowFetcher
  }

  async trackWorkflowHistory(
    owner: string, 
    repo: string, 
    days: number = 30
  ): Promise<void> {
    await database.connect()

    const runs = await this.workflowFetcher.fetchRecentWorkflowRuns(owner, repo, days)
    
    for (const run of runs) {
      await this.storeWorkflowRun(run, owner, repo)
    }
  }

  async calculateWorkflowMetrics(
    owner: string, 
    repo: string, 
    days: number = 30
  ): Promise<WorkflowMetrics> {
    const runs = await this.workflowFetcher.fetchRecentWorkflowRuns(owner, repo, days)
    const completedRuns = runs.filter(run => run.status === 'completed')
    
    if (completedRuns.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        failureRate: 0,
        averageDuration: 0,
        medianDuration: 0,
        totalDuration: 0,
        runsPerDay: 0,
        mostActiveWorkflow: '',
        leastReliableWorkflow: ''
      }
    }

    const successfulRuns = completedRuns.filter(run => run.conclusion === 'success')
    const failedRuns = completedRuns.filter(run => run.conclusion === 'failure')
    
    const successRate = (successfulRuns.length / completedRuns.length) * 100
    const failureRate = (failedRuns.length / completedRuns.length) * 100

    const durations = completedRuns
      .filter(run => run.run_started_at && run.updated_at)
      .map(run => {
        const start = new Date(run.run_started_at).getTime()
        const end = new Date(run.updated_at).getTime()
        return end - start
      })
      .sort((a, b) => a - b)

    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0

    const medianDuration = durations.length > 0 
      ? durations[Math.floor(durations.length / 2)] 
      : 0

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0)
    const runsPerDay = runs.length / days

    const workflowCounts = new Map<string, number>()
    const workflowFailures = new Map<string, number>()

    runs.forEach(run => {
      workflowCounts.set(run.workflow_name, (workflowCounts.get(run.workflow_name) || 0) + 1)
      if (run.conclusion === 'failure') {
        workflowFailures.set(run.workflow_name, (workflowFailures.get(run.workflow_name) || 0) + 1)
      }
    })

    const mostActiveWorkflow = Array.from(workflowCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    const workflowFailureRates = Array.from(workflowCounts.entries())
      .map(([workflow, total]) => ({
        workflow,
        failureRate: ((workflowFailures.get(workflow) || 0) / total) * 100
      }))
      .sort((a, b) => b.failureRate - a.failureRate)

    const leastReliableWorkflow = workflowFailureRates[0]?.workflow || ''

    return {
      totalRuns: runs.length,
      successRate,
      failureRate,
      averageDuration,
      medianDuration,
      totalDuration,
      runsPerDay,
      mostActiveWorkflow,
      leastReliableWorkflow
    }
  }

  async generateWorkflowTrends(
    owner: string, 
    repo: string, 
    days: number = 30
  ): Promise<WorkflowTrend[]> {
    const runs = await this.workflowFetcher.fetchRecentWorkflowRuns(owner, repo, days)
    
    const dailyData = new Map<string, {
      totalRuns: number
      successfulRuns: number
      failedRuns: number
      durations: number[]
    }>()

    runs.forEach(run => {
      const date = new Date(run.created_at).toISOString().split('T')[0]
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          durations: []
        })
      }

      const dayData = dailyData.get(date)!
      dayData.totalRuns++

      if (run.status === 'completed') {
        if (run.conclusion === 'success') {
          dayData.successfulRuns++
        } else if (run.conclusion === 'failure') {
          dayData.failedRuns++
        }

        if (run.run_started_at && run.updated_at) {
          const start = new Date(run.run_started_at).getTime()
          const end = new Date(run.updated_at).getTime()
          dayData.durations.push(end - start)
        }
      }
    })

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        totalRuns: data.totalRuns,
        successfulRuns: data.successfulRuns,
        failedRuns: data.failedRuns,
        successRate: data.totalRuns > 0 ? (data.successfulRuns / data.totalRuns) * 100 : 0,
        averageDuration: data.durations.length > 0 
          ? data.durations.reduce((sum, duration) => sum + duration, 0) / data.durations.length 
          : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async analyzeWorkflowPerformance(
    owner: string, 
    repo: string, 
    days: number = 30
  ): Promise<WorkflowPerformance[]> {
    const runs = await this.workflowFetcher.fetchRecentWorkflowRuns(owner, repo, days)
    const workflowData = new Map<string, {
      runs: WorkflowRun[]
      successfulRuns: number
      failedRuns: number
      durations: number[]
      lastRun: Date | null
    }>()

    runs.forEach(run => {
      if (!workflowData.has(run.workflow_name)) {
        workflowData.set(run.workflow_name, {
          runs: [],
          successfulRuns: 0,
          failedRuns: 0,
          durations: [],
          lastRun: null
        })
      }

      const data = workflowData.get(run.workflow_name)!
      data.runs.push(run)

      const runDate = new Date(run.created_at)
      if (!data.lastRun || runDate > data.lastRun) {
        data.lastRun = runDate
      }

      if (run.status === 'completed') {
        if (run.conclusion === 'success') {
          data.successfulRuns++
        } else if (run.conclusion === 'failure') {
          data.failedRuns++
        }

        if (run.run_started_at && run.updated_at) {
          const start = new Date(run.run_started_at).getTime()
          const end = new Date(run.updated_at).getTime()
          data.durations.push(end - start)
        }
      }
    })

    return Array.from(workflowData.entries()).map(([workflowName, data]) => {
      const totalRuns = data.runs.length
      const successRate = totalRuns > 0 ? (data.successfulRuns / totalRuns) * 100 : 0
      const averageDuration = data.durations.length > 0 
        ? data.durations.reduce((sum, duration) => sum + duration, 0) / data.durations.length 
        : 0

      const trend = this.calculateTrend(data.runs)

      return {
        workflowName,
        totalRuns,
        successfulRuns: data.successfulRuns,
        failedRuns: data.failedRuns,
        successRate,
        averageDuration,
        lastRun: data.lastRun,
        trend
      }
    }).sort((a, b) => b.totalRuns - a.totalRuns)
  }

  async getWorkflowSuccessRates(
    repositories: Array<{ owner: string; name: string }>, 
    days: number = 7
  ): Promise<Array<{ repository: string; successRate: number; totalRuns: number }>> {
    const results = []

    for (const repo of repositories) {
      try {
        const metrics = await this.calculateWorkflowMetrics(repo.owner, repo.name, days)
        results.push({
          repository: `${repo.owner}/${repo.name}`,
          successRate: metrics.successRate,
          totalRuns: metrics.totalRuns
        })
      } catch (error) {
        console.error(`Failed to get success rate for ${repo.owner}/${repo.name}:`, error)
        results.push({
          repository: `${repo.owner}/${repo.name}`,
          successRate: 0,
          totalRuns: 0
        })
      }
    }

    return results
  }

  private async storeWorkflowRun(run: WorkflowRun, owner: string, repo: string): Promise<void> {
    try {
      const existingRun = await WorkflowRunModel.findOne({ 
        runId: run.id,
        repository: `${owner}/${repo}`
      })

      if (existingRun) {
        await WorkflowRunModel.updateOne(
          { runId: run.id, repository: `${owner}/${repo}` },
          {
            status: run.status,
            conclusion: run.conclusion,
            updatedAt: new Date(run.updated_at),
            duration: this.calculateDuration(run)
          }
        )
      } else {
        await WorkflowRunModel.create({
          runId: run.id,
          repository: `${owner}/${repo}`,
          workflowName: run.workflow_name,
          branch: run.head_branch,
          status: run.status,
          conclusion: run.conclusion,
          createdAt: new Date(run.created_at),
          updatedAt: new Date(run.updated_at),
          startedAt: run.run_started_at ? new Date(run.run_started_at) : null,
          duration: this.calculateDuration(run),
          actor: run.actor.login,
          event: run.event,
          commitSha: run.head_sha,
          commitMessage: run.head_commit.message
        })
      }
    } catch (error) {
      console.error(`Failed to store workflow run ${run.id}:`, error)
    }
  }

  private calculateDuration(run: WorkflowRun): number | null {
    if (!run.run_started_at || !run.updated_at || run.status !== 'completed') {
      return null
    }

    const start = new Date(run.run_started_at).getTime()
    const end = new Date(run.updated_at).getTime()
    return end - start
  }

  private calculateTrend(runs: WorkflowRun[]): 'improving' | 'declining' | 'stable' {
    if (runs.length < 10) return 'stable'

    const sortedRuns = runs
      .filter(run => run.status === 'completed')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const halfPoint = Math.floor(sortedRuns.length / 2)
    const firstHalf = sortedRuns.slice(0, halfPoint)
    const secondHalf = sortedRuns.slice(halfPoint)

    const firstHalfSuccessRate = firstHalf.length > 0 
      ? (firstHalf.filter(run => run.conclusion === 'success').length / firstHalf.length) * 100 
      : 0

    const secondHalfSuccessRate = secondHalf.length > 0 
      ? (secondHalf.filter(run => run.conclusion === 'success').length / secondHalf.length) * 100 
      : 0

    const difference = secondHalfSuccessRate - firstHalfSuccessRate

    if (difference > 10) return 'improving'
    if (difference < -10) return 'declining'
    return 'stable'
  }
}