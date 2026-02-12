import { WorkflowDataFetcher, WorkflowRun, WorkflowJob } from './workflow-fetcher'

export interface FailurePattern {
  type: 'build' | 'test' | 'deployment' | 'dependency' | 'timeout' | 'infrastructure' | 'unknown'
  pattern: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
}

export interface BuildFailure {
  runId: number
  workflowName: string
  repository: string
  branch: string
  failureType: FailurePattern['type']
  failureReason: string
  failedStep: string | null
  failedJob: string | null
  timestamp: Date
  duration: number | null
  actor: string
  commitSha: string
  commitMessage: string
  isRecurring: boolean
  similarFailures: number
  severity: FailurePattern['severity']
  category: string
  suggestedFix: string | null
}

export interface FailureAnalysis {
  totalFailures: number
  failuresByType: Record<string, number>
  failuresByWorkflow: Record<string, number>
  failuresByBranch: Record<string, number>
  recurringFailures: number
  criticalFailures: number
  averageTimeToFailure: number
  mostProblematicWorkflow: string
  mostProblematicBranch: string
  failureTrends: Array<{ date: string; count: number; type: string }>
}

export class BuildFailureDetector {
  private workflowFetcher: WorkflowDataFetcher
  private failurePatterns: FailurePattern[]

  constructor(workflowFetcher: WorkflowDataFetcher) {
    this.workflowFetcher = workflowFetcher
    this.failurePatterns = this.initializeFailurePatterns()
  }

  async detectBuildFailures(
    owner: string, 
    repo: string, 
    days: number = 7
  ): Promise<BuildFailure[]> {
    const failedRuns = await this.workflowFetcher.fetchFailedWorkflowRuns(owner, repo, days)
    const failures: BuildFailure[] = []

    for (const run of failedRuns) {
      try {
        const failure = await this.analyzeFailedRun(run, owner, repo)
        if (failure) {
          failures.push(failure)
        }
      } catch (error) {
        console.error(`Failed to analyze run ${run.id}:`, error)
      }
    }

    return this.enrichFailuresWithRecurrenceData(failures)
  }

  async analyzeFailurePatterns(
    owner: string, 
    repo: string, 
    days: number = 30
  ): Promise<FailureAnalysis> {
    const failures = await this.detectBuildFailures(owner, repo, days)
    
    const failuresByType: Record<string, number> = {}
    const failuresByWorkflow: Record<string, number> = {}
    const failuresByBranch: Record<string, number> = {}
    const failureTrends: Array<{ date: string; count: number; type: string }> = []

    let totalDuration = 0
    let durationsCount = 0
    let recurringFailures = 0
    let criticalFailures = 0

    failures.forEach(failure => {
      failuresByType[failure.failureType] = (failuresByType[failure.failureType] || 0) + 1
      failuresByWorkflow[failure.workflowName] = (failuresByWorkflow[failure.workflowName] || 0) + 1
      failuresByBranch[failure.branch] = (failuresByBranch[failure.branch] || 0) + 1

      if (failure.isRecurring) recurringFailures++
      if (failure.severity === 'critical') criticalFailures++

      if (failure.duration) {
        totalDuration += failure.duration
        durationsCount++
      }

      const date = failure.timestamp.toISOString().split('T')[0]
      const existingTrend = failureTrends.find(t => t.date === date && t.type === failure.failureType)
      if (existingTrend) {
        existingTrend.count++
      } else {
        failureTrends.push({ date, count: 1, type: failure.failureType })
      }
    })

    const averageTimeToFailure = durationsCount > 0 ? totalDuration / durationsCount : 0

    const mostProblematicWorkflow = Object.entries(failuresByWorkflow)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    const mostProblematicBranch = Object.entries(failuresByBranch)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    return {
      totalFailures: failures.length,
      failuresByType,
      failuresByWorkflow,
      failuresByBranch,
      recurringFailures,
      criticalFailures,
      averageTimeToFailure,
      mostProblematicWorkflow,
      mostProblematicBranch,
      failureTrends: failureTrends.sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  async detectDeploymentIssues(
    owner: string, 
    repo: string, 
    days: number = 7
  ): Promise<BuildFailure[]> {
    const failures = await this.detectBuildFailures(owner, repo, days)
    return failures.filter(failure => 
      failure.failureType === 'deployment' || 
      failure.category === 'deployment'
    )
  }

  async identifyRecurringFailures(
    owner: string, 
    repo: string, 
    days: number = 14
  ): Promise<Array<{
    pattern: string
    count: number
    workflows: string[]
    branches: string[]
    firstSeen: Date
    lastSeen: Date
    severity: FailurePattern['severity']
  }>> {
    const failures = await this.detectBuildFailures(owner, repo, days)
    const patternMap = new Map<string, {
      count: number
      workflows: Set<string>
      branches: Set<string>
      timestamps: Date[]
      severity: FailurePattern['severity']
    }>()

    failures.forEach(failure => {
      const pattern = this.normalizeFailureReason(failure.failureReason)
      
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, {
          count: 0,
          workflows: new Set(),
          branches: new Set(),
          timestamps: [],
          severity: failure.severity
        })
      }

      const data = patternMap.get(pattern)!
      data.count++
      data.workflows.add(failure.workflowName)
      data.branches.add(failure.branch)
      data.timestamps.push(failure.timestamp)
    })

    return Array.from(patternMap.entries())
      .filter(([_, data]) => data.count >= 2)
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        workflows: Array.from(data.workflows),
        branches: Array.from(data.branches),
        firstSeen: new Date(Math.min(...data.timestamps.map(t => t.getTime()))),
        lastSeen: new Date(Math.max(...data.timestamps.map(t => t.getTime()))),
        severity: data.severity
      }))
      .sort((a, b) => b.count - a.count)
  }

  private async analyzeFailedRun(
    run: WorkflowRun, 
    owner: string, 
    repo: string
  ): Promise<BuildFailure | null> {
    try {
      const jobs = await this.workflowFetcher.fetchWorkflowRunJobs(owner, repo, run.id)
      const failedJob = jobs.jobs.find(job => job.conclusion === 'failure')
      
      if (!failedJob) return null

      const failedStep = failedJob.steps.find(step => step.conclusion === 'failure')
      const failureReason = this.extractFailureReason(failedJob, failedStep)
      const pattern = this.matchFailurePattern(failureReason)

      const duration = this.calculateRunDuration(run)

      return {
        runId: run.id,
        workflowName: run.workflow_name,
        repository: `${owner}/${repo}`,
        branch: run.head_branch,
        failureType: pattern.type,
        failureReason,
        failedStep: failedStep?.name || null,
        failedJob: failedJob.name,
        timestamp: new Date(run.created_at),
        duration,
        actor: run.actor.login,
        commitSha: run.head_sha,
        commitMessage: run.head_commit.message,
        isRecurring: false,
        similarFailures: 0,
        severity: pattern.severity,
        category: pattern.category,
        suggestedFix: this.generateSuggestedFix(pattern, failureReason)
      }
    } catch (error) {
      console.error(`Failed to analyze failed run ${run.id}:`, error)
      return null
    }
  }

  private extractFailureReason(job: WorkflowJob, failedStep?: WorkflowJob['steps'][0]): string {
    if (failedStep) {
      return `Step "${failedStep.name}" failed in job "${job.name}"`
    }
    return `Job "${job.name}" failed`
  }

  private matchFailurePattern(reason: string): FailurePattern {
    const lowerReason = reason.toLowerCase()
    
    for (const pattern of this.failurePatterns) {
      if (lowerReason.includes(pattern.pattern.toLowerCase())) {
        return pattern
      }
    }

    return {
      type: 'unknown',
      pattern: 'unknown',
      description: 'Unknown failure type',
      severity: 'medium',
      category: 'general'
    }
  }

  private enrichFailuresWithRecurrenceData(failures: BuildFailure[]): BuildFailure[] {
    const reasonCounts = new Map<string, number>()
    
    failures.forEach(failure => {
      const normalizedReason = this.normalizeFailureReason(failure.failureReason)
      reasonCounts.set(normalizedReason, (reasonCounts.get(normalizedReason) || 0) + 1)
    })

    return failures.map(failure => {
      const normalizedReason = this.normalizeFailureReason(failure.failureReason)
      const similarFailures = reasonCounts.get(normalizedReason) || 1
      
      return {
        ...failure,
        isRecurring: similarFailures > 1,
        similarFailures: similarFailures - 1
      }
    })
  }

  private normalizeFailureReason(reason: string): string {
    return reason
      .toLowerCase()
      .replace(/\d+/g, 'X')
      .replace(/['"]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private calculateRunDuration(run: WorkflowRun): number | null {
    if (!run.run_started_at || !run.updated_at) return null
    
    const start = new Date(run.run_started_at).getTime()
    const end = new Date(run.updated_at).getTime()
    return end - start
  }

  private generateSuggestedFix(pattern: FailurePattern, reason: string): string | null {
    const fixes: Record<string, string> = {
      'build': 'Check compilation errors and fix syntax issues',
      'test': 'Review failing tests and update test cases or fix implementation',
      'deployment': 'Verify deployment configuration and target environment',
      'dependency': 'Update dependencies or fix version conflicts',
      'timeout': 'Optimize performance or increase timeout limits',
      'infrastructure': 'Check runner availability and resource limits'
    }

    return fixes[pattern.type] || 'Review logs and error messages for specific guidance'
  }

  private initializeFailurePatterns(): FailurePattern[] {
    return [
      {
        type: 'build',
        pattern: 'compilation failed',
        description: 'Code compilation errors',
        severity: 'high',
        category: 'build'
      },
      {
        type: 'build',
        pattern: 'syntax error',
        description: 'Syntax errors in code',
        severity: 'high',
        category: 'build'
      },
      {
        type: 'test',
        pattern: 'test failed',
        description: 'Unit or integration test failures',
        severity: 'medium',
        category: 'testing'
      },
      {
        type: 'test',
        pattern: 'assertion error',
        description: 'Test assertion failures',
        severity: 'medium',
        category: 'testing'
      },
      {
        type: 'deployment',
        pattern: 'deployment failed',
        description: 'Deployment process failures',
        severity: 'critical',
        category: 'deployment'
      },
      {
        type: 'dependency',
        pattern: 'module not found',
        description: 'Missing or incorrect dependencies',
        severity: 'high',
        category: 'dependencies'
      },
      {
        type: 'dependency',
        pattern: 'package not found',
        description: 'Package installation failures',
        severity: 'high',
        category: 'dependencies'
      },
      {
        type: 'timeout',
        pattern: 'timeout',
        description: 'Process or step timeouts',
        severity: 'medium',
        category: 'performance'
      },
      {
        type: 'infrastructure',
        pattern: 'runner',
        description: 'CI/CD runner issues',
        severity: 'low',
        category: 'infrastructure'
      },
      {
        type: 'infrastructure',
        pattern: 'network',
        description: 'Network connectivity issues',
        severity: 'low',
        category: 'infrastructure'
      }
    ]
  }
}