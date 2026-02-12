import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GitHubAPIClient } from '@/lib/github-api-client'
import { WorkflowDataFetcher } from '@/lib/workflow-fetcher'
import { BuildFailureDetector } from '@/lib/build-failure-detector'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const days = parseInt(searchParams.get('days') || '7')

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
    }

    const githubClient = new GitHubAPIClient()
    const workflowFetcher = new WorkflowDataFetcher(githubClient)
    const failureDetector = new BuildFailureDetector(workflowFetcher)

    const failures = await failureDetector.detectBuildFailures(owner, repo, days)

    return NextResponse.json({ failures })
  } catch (error) {
    console.error('CI/CD failures API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch build failures' },
      { status: 500 }
    )
  }
}