import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GitHubAPIClient } from '@/lib/github-api-client'
import { AnalyticsService } from '@/lib/analytics-service'
import { AnalyticsProcessor } from '@/lib/analytics-processor'
import { database } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await database.connect()

    const githubClient = new GitHubAPIClient()
    const analyticsService = new AnalyticsService(githubClient)

    const analytics = await analyticsService.generateAnalytics(
      session.user.username || '',
      session.user.id || ''
    )

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { username, dateRange, startDate, endDate } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    await database.connect()

    const githubClient = new GitHubAPIClient()
    const analyticsProcessor = new AnalyticsProcessor(githubClient)

    const repositories = await githubClient.getRepositories(username)
    const repositoryStats = repositories.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      language: repo.language || 'Unknown',
      starCount: repo.stargazers_count,
      forkCount: repo.forks_count,
      commits: 0,
      lastCommitDate: new Date(repo.updated_at),
      activityScore: 0
    }))

    const [commitFrequency, languageUsage, repositoryActivity, heatmap] = await Promise.all([
      analyticsProcessor.processCommitFrequency(username, repositoryStats),
      analyticsProcessor.processLanguageUsage(repositories.map(repo => ({
        owner: repo.owner.login,
        name: repo.name
      }))),
      analyticsProcessor.processRepositoryActivity(username, repositoryStats),
      getHeatmapData(analyticsProcessor, username, dateRange, startDate, endDate)
    ])

    return NextResponse.json({
      commitFrequency,
      languageUsage,
      repositoryActivity,
      heatmap
    })
  } catch (error) {
    console.error('Analytics POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics data' },
      { status: 500 }
    )
  }
}

async function getHeatmapData(
  processor: AnalyticsProcessor, 
  username: string, 
  dateRange?: string, 
  startDate?: string, 
  endDate?: string
) {
  switch (dateRange) {
    case 'week':
      return processor.generateLastNDaysHeatmap(username, 7)
    case 'month':
      return processor.generateLastNDaysHeatmap(username, 30)
    case 'quarter':
      return processor.generateLastNDaysHeatmap(username, 90)
    case 'year':
      return processor.generateLastNDaysHeatmap(username, 365)
    case 'custom':
      if (startDate && endDate) {
        return processor.generateCustomRangeHeatmap(username, startDate, endDate)
      }
      return processor.generateLastNDaysHeatmap(username, 365)
    default:
      return processor.generateLastNDaysHeatmap(username, 365)
  }
}
