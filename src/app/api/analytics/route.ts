import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GitHubAPIClient } from '@/lib/github-api-client'
import { AnalyticsService } from '@/lib/analytics-service'
import { connectToDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const githubClient = new GitHubAPIClient()
    const analyticsService = new AnalyticsService(githubClient)

    const analytics = await analyticsService.generateAnalytics(
      session.user.username,
      session.user.id
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