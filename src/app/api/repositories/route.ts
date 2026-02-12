import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GitHubAPIClient } from '@/lib/github-api-client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const githubClient = new GitHubAPIClient()
    const repositories = await githubClient.getUserRepositories(session.user.username)

    const formattedRepos = repositories.map(repo => ({
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      language: repo.language,
      starCount: repo.stargazers_count,
      forkCount: repo.forks_count,
      updatedAt: repo.updated_at
    }))

    return NextResponse.json({ repositories: formattedRepos })
  } catch (error) {
    console.error('Repositories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}