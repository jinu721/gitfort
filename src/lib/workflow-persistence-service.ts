import { WorkflowRunModel } from './models/workflow-run'
import { WorkflowRun } from './workflow-fetcher'
import { BuildFailure } from './build-failure-detector'
import { database } from './database'

export interface WorkflowHistoryQuery {
  repository?: string
  workflowName?: string
  branch?: string
  status?: string
  conclusion?: string
  actor?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface WorkflowTrendData {
  date: string
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageDuration: number
}

export interface RetentionPolicy {
  maxAge: number
  maxRecords: number
  compressOlderThan: number
}

export class WorkflowPersistenceService {
  private defaultRetentionPolicy: RetentionPolicy = {
    maxAge: 90 * 24 * 60 * 60 * 1000,
    maxRecords: 10000,
    compressOlderThan: 30 * 24 * 60 * 60 * 1000
  }

  async storeWorkflowRun(run: WorkflowRun, repository: string): Promise<void> {
    await database.connect()

    try {
      const existingRun = await WorkflowRunModel.findOne({ 
        runId: run.id,
        repository 
      })

      const workflowData = {
        runId: run.id,
        repository,
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
        commitMessage: run.head_commit.message,
        runNumber: run.run_number,
        runAttempt: run.run_attempt,
        htmlUrl: run.html_url
      }

      if (existingRun) {
        await WorkflowRunModel.updateOne(
          { runId: run.id, repository },
          workflowData
        )
      } else {
        await WorkflowRunModel.create(workflowData)
      }
    } catch (error) {
      console.error(`Failed to store workflow run ${run.id}:`, error)
      throw error
    }
  }

  async storeWorkflowRuns(runs: WorkflowRun[], repository: string): Promise<void> {
    await database.connect()

    const operations = runs.map(run => ({
      updateOne: {
        filter: { runId: run.id, repository },
        update: {
          runId: run.id,
          repository,
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
          commitMessage: run.head_commit.message,
          runNumber: run.run_number,
          runAttempt: run.run_attempt,
          htmlUrl: run.html_url
        },
        upsert: true
      }
    }))

    try {
      await WorkflowRunModel.bulkWrite(operations)
    } catch (error) {
      console.error('Failed to bulk store workflow runs:', error)
      throw error
    }
  }

  async getWorkflowHistory(query: WorkflowHistoryQuery = {}): Promise<any[]> {
    await database.connect()

    const filter: any = {}
    
    if (query.repository) filter.repository = query.repository
    if (query.workflowName) filter.workflowName = query.workflowName
    if (query.branch) filter.branch = query.branch
    if (query.status) filter.status = query.status
    if (query.conclusion) filter.conclusion = query.conclusion
    if (query.actor) filter.actor = query.actor
    
    if (query.startDate || query.endDate) {
      filter.createdAt = {}
      if (query.startDate) filter.createdAt.$gte = query.startDate
      if (query.endDate) filter.createdAt.$lte = query.endDate
    }

    try {
      return await WorkflowRunModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(query.limit || 100)
        .skip(query.offset || 0)
        .lean()
    } catch (error) {
      console.error('Failed to get workflow history:', error)
      throw error
    }
  }

  async generateTrendAnalysis(
    repository: string, 
    days: number = 30
  ): Promise<WorkflowTrendData[]> {
    await database.connect()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const pipeline = [
        {
          $match: {
            repository,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            totalRuns: { $sum: 1 },
            successfulRuns: {
              $sum: {
                $cond: [{ $eq: ['$conclusion', 'success'] }, 1, 0]
              }
            },
            failedRuns: {
              $sum: {
                $cond: [{ $eq: ['$conclusion', 'failure'] }, 1, 0]
              }
            },
            averageDuration: {
              $avg: {
                $cond: [
                  { $ne: ['$duration', null] },
                  '$duration',
                  0
                ]
              }
            }
          }
        },
        {
          $sort: { _id: 1 as 1 }
        }
      ]

      const results = await WorkflowRunModel.aggregate(pipeline)
      
      return results.map(result => ({
        date: result._id,
        totalRuns: result.totalRuns,
        successfulRuns: result.successfulRuns,
        failedRuns: result.failedRuns,
        averageDuration: result.averageDuration || 0
      }))
    } catch (error) {
      console.error('Failed to generate trend analysis:', error)
      throw error
    }
  }

  async getWorkflowStatistics(
    repository: string, 
    workflowName?: string, 
    days: number = 30
  ): Promise<{
    totalRuns: number
    successRate: number
    averageDuration: number
    medianDuration: number
    failureRate: number
    mostFrequentBranch: string
    mostActiveActor: string
  }> {
    await database.connect()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const filter: any = {
      repository,
      createdAt: { $gte: startDate }
    }

    if (workflowName) {
      filter.workflowName = workflowName
    }

    try {
      const runs = await WorkflowRunModel.find(filter).lean()
      
      if (runs.length === 0) {
        return {
          totalRuns: 0,
          successRate: 0,
          averageDuration: 0,
          medianDuration: 0,
          failureRate: 0,
          mostFrequentBranch: '',
          mostActiveActor: ''
        }
      }

      const completedRuns = runs.filter(run => run.status === 'completed')
      const successfulRuns = completedRuns.filter(run => run.conclusion === 'success')
      const failedRuns = completedRuns.filter(run => run.conclusion === 'failure')

      const successRate = completedRuns.length > 0 
        ? (successfulRuns.length / completedRuns.length) * 100 
        : 0

      const failureRate = completedRuns.length > 0 
        ? (failedRuns.length / completedRuns.length) * 100 
        : 0

      const durations = runs
        .filter(run => run.duration !== null)
        .map(run => run.duration!)
        .sort((a, b) => a - b)

      const averageDuration = durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
        : 0

      const medianDuration = durations.length > 0 
        ? durations[Math.floor(durations.length / 2)] 
        : 0

      const branchCounts = new Map<string, number>()
      const actorCounts = new Map<string, number>()

      runs.forEach(run => {
        branchCounts.set(run.branch, (branchCounts.get(run.branch) || 0) + 1)
        actorCounts.set(run.actor, (actorCounts.get(run.actor) || 0) + 1)
      })

      const mostFrequentBranch = Array.from(branchCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

      const mostActiveActor = Array.from(actorCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

      return {
        totalRuns: runs.length,
        successRate,
        averageDuration,
        medianDuration,
        failureRate,
        mostFrequentBranch,
        mostActiveActor
      }
    } catch (error) {
      console.error('Failed to get workflow statistics:', error)
      throw error
    }
  }

  async cleanupOldData(retentionPolicy?: Partial<RetentionPolicy>): Promise<{
    deletedRecords: number
    compressedRecords: number
  }> {
    await database.connect()

    const policy = { ...this.defaultRetentionPolicy, ...retentionPolicy }
    const maxAgeDate = new Date(Date.now() - policy.maxAge)
    const compressDate = new Date(Date.now() - policy.compressOlderThan)

    try {
      const deleteResult = await WorkflowRunModel.deleteMany({
        createdAt: { $lt: maxAgeDate }
      })

      const compressResult = await WorkflowRunModel.updateMany(
        {
          createdAt: { $lt: compressDate },
          compressed: { $ne: true }
        },
        {
          $unset: {
            commitMessage: 1,
            htmlUrl: 1
          },
          $set: {
            compressed: true
          }
        }
      )

      const totalRecords = await WorkflowRunModel.countDocuments()
      if (totalRecords > policy.maxRecords) {
        const excessRecords = totalRecords - policy.maxRecords
        const oldestRuns = await WorkflowRunModel
          .find()
          .sort({ createdAt: 1 })
          .limit(excessRecords)
          .select('_id')

        const idsToDelete = oldestRuns.map(run => run._id)
        await WorkflowRunModel.deleteMany({ _id: { $in: idsToDelete } })
      }

      return {
        deletedRecords: deleteResult.deletedCount || 0,
        compressedRecords: compressResult.modifiedCount || 0
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error)
      throw error
    }
  }

  async getFailureAnalysis(
    repository: string, 
    days: number = 7
  ): Promise<{
    totalFailures: number
    failuresByWorkflow: Record<string, number>
    failuresByBranch: Record<string, number>
    recentFailures: any[]
  }> {
    await database.connect()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const failedRuns = await WorkflowRunModel.find({
        repository,
        conclusion: 'failure',
        createdAt: { $gte: startDate }
      }).lean()

      const failuresByWorkflow: Record<string, number> = {}
      const failuresByBranch: Record<string, number> = {}

      failedRuns.forEach(run => {
        failuresByWorkflow[run.workflowName] = (failuresByWorkflow[run.workflowName] || 0) + 1
        failuresByBranch[run.branch] = (failuresByBranch[run.branch] || 0) + 1
      })

      const recentFailures = failedRuns
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)

      return {
        totalFailures: failedRuns.length,
        failuresByWorkflow,
        failuresByBranch,
        recentFailures
      }
    } catch (error) {
      console.error('Failed to get failure analysis:', error)
      throw error
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
}
