import { GitHubAPIClient } from './github-api-client'
import { AnalyticsProcessor, CommitFrequencyData, LanguageUsageData, ActivityData, RepositoryStats } from './analytics-processor'
import { Repository } from './models/repository'

export interface AnalyticsData {
  commitFrequency: CommitFrequencyData
  languageUsage: LanguageUsageData
  repositoryActivity: ActivityData
  generatedAt: Date
}

export class AnalyticsService {
  private githubClient: GitHubAPIClient
  private processor: AnalyticsProcessor

  constructor(githubClient: GitHubAPIClient) {
    this.githubClient = githubClient
    this.processor = new AnalyticsProcessor(githubClient)
  }

  async generateAnalytics(username: string, userId: string): Promise<AnalyticsData> {
    const repositories = await this.fetchUserRepositories(username, userId)
    const repositoryStats = await this.enrichRepositoriesWithStats(repositories)

    const [commitFrequency, languageUsage, repositoryActivity] = await Promise.all([
      this.processor.processCommitFrequency(username, repositoryStats),
      this.processor.processLanguageUsage(repositories.map(r => ({ owner: username, name: r.name }))),
      this.processor.processRepositoryActivity(username, repositoryStats)
    ])

    return {
      commitFrequency,
      languageUsage,
      repositoryActivity,
      generatedAt: new Date()
    }
  }

  private async fetchUserRepositories(username: string, userId: string): Promise<Array<{ name: string; fullName: string; language: string; starCount: number; forkCount: number }>> {
    try {
      const dbRepositories = await Repository.find({ userId }).lean()
      
      if (dbRepositories.length > 0) {
        return dbRepositories.map(repo => ({
          name: repo.name,
          fullName: repo.fullName,
          language: repo.language || 'Unknown',
          starCount: repo.starCount,
          forkCount: repo.forkCount
        }))
      }

      const githubRepos = await this.githubClient.getRepositories(username)
      return githubRepos.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        language: repo.language || 'Unknown',
        starCount: repo.stargazers_count || 0,
        forkCount: repo.forks_count || 0
      }))
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      return []
    }
  }

  private async enrichRepositoriesWithStats(repositories: Array<{ name: string; fullName: string; language: string; starCount: number; forkCount: number }>): Promise<RepositoryStats[]> {
    const enrichedRepos: RepositoryStats[] = []

    for (const repo of repositories) {
      try {
        const [owner, name] = repo.fullName.split('/')
        const repoDetails = await this.githubClient.getRepositoryDetails(owner, name)
        
        const commits = await this.getCommitCount(owner, name)
        const lastCommitDate = await this.getLastCommitDate(owner, name)

        enrichedRepos.push({
          name: repo.name,
          fullName: repo.fullName,
          language: repo.language,
          starCount: repo.starCount,
          forkCount: repo.forkCount,
          commits,
          lastCommitDate,
          activityScore: 0
        })
      } catch (error) {
        console.error(`Failed to enrich repository ${repo.fullName}:`, error)
        enrichedRepos.push({
          name: repo.name,
          fullName: repo.fullName,
          language: repo.language,
          starCount: repo.starCount,
          forkCount: repo.forkCount,
          commits: 0,
          lastCommitDate: new Date(0),
          activityScore: 0
        })
      }
    }

    return enrichedRepos
  }

  private async getCommitCount(owner: string, repo: string): Promise<number> {
    try {
      const response = await this.githubClient.get(`/repos/${owner}/${repo}/commits?per_page=1`)
      const linkHeader = response.headers?.get('link')
      
      if (linkHeader) {
        const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/)
        if (lastPageMatch) {
          return parseInt(lastPageMatch[1], 10)
        }
      }
      
      return Array.isArray(response) ? response.length : 1
    } catch (error) {
      console.error(`Failed to get commit count for ${owner}/${repo}:`, error)
      return 0
    }
  }

  private async getLastCommitDate(owner: string, repo: string): Promise<Date> {
    try {
      const commits = await this.githubClient.get(`/repos/${owner}/${repo}/commits?per_page=1`)
      
      if (Array.isArray(commits) && commits.length > 0) {
        const lastCommit = commits[0]
        return new Date(lastCommit.commit.author.date)
      }
      
      return new Date(0)
    } catch (error) {
      console.error(`Failed to get last commit date for ${owner}/${repo}:`, error)
      return new Date(0)
    }
  }
}