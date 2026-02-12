import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GitHubAPIClient } from '@/lib/github-api-client'
import { WorkflowDataFetcher } from '@/lib/workflow-fetcher'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const branch = searchParams.get('branch')

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
    }

    const githubClient = new GitHubAPIClient()
    const workflowFetcher = new WorkflowDataFetcher(githubClient)

    const options: any = { per_page: limit }
    if (status) options.status = status
    if (branch) options.branch = branch

    const response = await workflowFetcher.fetchWorkflowRuns(owner, repo, options)

    return NextResponse.json({
      runs: response.workflow_runs,
      total_count: response.total_count
    })
  } catch (error) {
    console.error('CI/CD runs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs' },
      { status: 500 }
    )
  }
}