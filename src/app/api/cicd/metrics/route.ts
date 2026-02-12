import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GitHubAPIClient } from '@/lib/github-api-client'
import { WorkflowDataFetcher } from '@/lib/workflow-fetcher'
import { WorkflowTrackingService } from '@/lib/workflow-tracking-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const days = parseInt(searchParams.get('days') || '30')

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
    }

    const githubClient = new GitHubAPIClient()
    const workflowFetcher = new WorkflowDataFetcher(githubClient)
    const trackingService = new WorkflowTrackingService(workflowFetcher)

    const metrics = await trackingService.calculateWorkflowMetrics(owner, repo, days)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('CI/CD metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CI/CD metrics' },
      { status: 500 }
    )
  }
}