import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardService from '@/lib/services/dashboard-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username } = await request.json();

    if (username !== session.user.username) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get GitHub token from session
    const githubToken = session.accessToken;

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not available. Please sign in again.' },
        { status: 401 }
      );
    }

    // Initialize dashboard service with token
    const dashboardService = new DashboardService(githubToken);

    console.log(`Fetching comprehensive dashboard data for ${username}...`);

    try {
      // Fetch all dashboard data with timeout
      const [stats, repositoryActivity] = await Promise.all([
        dashboardService.getDashboardStats(username),
        dashboardService.getRepositoryActivity(username)
      ]);

      console.log(`Successfully fetched data: ${stats.totalRepositories} repos, ${stats.totalContributions} contributions`);

      return NextResponse.json({
        success: true,
        stats,
        repositories: repositoryActivity.map(repo => ({
          owner: repo.repository.split('/')[0],
          name: repo.repository.split('/')[1]
        })),
        repositoryActivity
      });

    } catch (serviceError) {
      console.error('Dashboard service error:', serviceError);

      // Handle specific GitHub API errors
      if (serviceError.message?.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'GitHub API rate limit exceeded',
            details: 'Please try again in a few minutes. The GitHub API has usage limits to prevent abuse.',
            retryAfter: 300 // 5 minutes
          },
          { status: 429 }
        );
      }

      if (serviceError.message?.includes('Unauthorized') || serviceError.message?.includes('401')) {
        return NextResponse.json(
          {
            error: 'GitHub authentication failed',
            details: 'Your GitHub token may have expired. Please sign out and sign in again.'
          },
          { status: 401 }
        );
      }

      throw serviceError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error('Dashboard stats API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}