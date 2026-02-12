import { GitHubAPIClient } from './github-api-client'
import { Repository } from './models/repository'

export interface CommitFrequencyData {
  daily: Array<{ date: string; count: number }>
  weekly: Array<{ week: string; count: number }>
  monthly: Array<{ month: string; count: number }>
  totalCommits: number
  averagePerDay: number
  averagePerWeek: number
  averagePerMonth: number
}

export interface LanguageUsageData {
  languages: Array<{ name: string; percentage: number; bytes: number; color: string }>
  totalBytes: number
  primaryLanguage: string
  languageCount: number
}

export interface ActivityData {
  repositoryActivity: Array<{ 
    repository: string
    commits: number
    lastActivity: Date
    activityScore: number
  }>
  totalRepositories: number
  activeRepositories: number
  averageActivityScore: number
  mostActiveRepository: string
  leastActiveRepository: string
}

export interface RepositoryStats {
  name: string
  fullName: string
  language: string
  starCount: number
  forkCount: number
  commits: number
  lastCommitDate: Date
  activityScore: number
}

export class AnalyticsProcessor {
  private githubClient: GitHubAPIClient

  constructor(githubClient: GitHubAPIClient) {
    this.githubClient = githubClient
  }

  async processCommitFrequency(username: string, repositories: RepositoryStats[]): Promise<CommitFrequencyData> {
    const contributions = await this.githubClient.getContributionsForStreak(username, 365)
    
    const dailyData = contributions.map(day => ({
      date: day.date,
      count: day.contributionCount
    }))

    const weeklyData = this.aggregateByWeek(contributions)
    const monthlyData = this.aggregateByMonth(contributions)

    const totalCommits = contributions.reduce((sum, day) => sum + day.contributionCount, 0)
    const daysWithData = contributions.length
    const weeksWithData = weeklyData.length
    const monthsWithData = monthlyData.length

    return {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
      totalCommits,
      averagePerDay: daysWithData > 0 ? totalCommits / daysWithData : 0,
      averagePerWeek: weeksWithData > 0 ? totalCommits / weeksWithData : 0,
      averagePerMonth: monthsWithData > 0 ? totalCommits / monthsWithData : 0
    }
  }

  async processLanguageUsage(repositories: Array<{ owner: string; name: string }>): Promise<LanguageUsageData> {
    const languageMap = new Map<string, number>()
    let totalBytes = 0

    for (const repo of repositories) {
      try {
        const languageData = await this.githubClient.getRepositoryLanguages(repo.owner, repo.name)
        
        if (languageData.repository?.languages?.edges) {
          for (const edge of languageData.repository.languages.edges) {
            const language = edge.node.name
            const bytes = edge.size
            
            languageMap.set(language, (languageMap.get(language) || 0) + bytes)
            totalBytes += bytes
          }
        }
      } catch (error) {
        console.error(`Failed to fetch languages for ${repo.owner}/${repo.name}:`, error)
      }
    }

    const languages = Array.from(languageMap.entries())
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
        color: this.getLanguageColor(name)
      }))
      .sort((a, b) => b.bytes - a.bytes)

    const primaryLanguage = languages.length > 0 ? languages[0].name : 'Unknown'

    return {
      languages,
      totalBytes,
      primaryLanguage,
      languageCount: languages.length
    }
  }

  async processRepositoryActivity(username: string, repositories: RepositoryStats[]): Promise<ActivityData> {
    const repositoryActivity = []
    let totalActivityScore = 0

    for (const repo of repositories) {
      const activityScore = this.calculateActivityScore(repo)
      totalActivityScore += activityScore

      repositoryActivity.push({
        repository: repo.fullName,
        commits: repo.commits,
        lastActivity: repo.lastCommitDate,
        activityScore
      })
    }

    repositoryActivity.sort((a, b) => b.activityScore - a.activityScore)

    const activeRepositories = repositoryActivity.filter(repo => repo.activityScore > 0).length
    const averageActivityScore = repositories.length > 0 ? totalActivityScore / repositories.length : 0

    return {
      repositoryActivity,
      totalRepositories: repositories.length,
      activeRepositories,
      averageActivityScore,
      mostActiveRepository: repositoryActivity.length > 0 ? repositoryActivity[0].repository : '',
      leastActiveRepository: repositoryActivity.length > 0 ? repositoryActivity[repositoryActivity.length - 1].repository : ''
    }
  }

  private aggregateByWeek(contributions: Array<{ date: string; contributionCount: number }>): Array<{ week: string; count: number }> {
    const weekMap = new Map<string, number>()

    for (const contribution of contributions) {
      const date = new Date(contribution.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + contribution.contributionCount)
    }

    return Array.from(weekMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
  }

  private aggregateByMonth(contributions: Array<{ date: string; contributionCount: number }>): Array<{ month: string; count: number }> {
    const monthMap = new Map<string, number>()

    for (const contribution of contributions) {
      const date = new Date(contribution.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + contribution.contributionCount)
    }

    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private calculateActivityScore(repo: RepositoryStats): number {
    const now = new Date()
    const daysSinceLastCommit = repo.lastCommitDate 
      ? Math.floor((now.getTime() - repo.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24))
      : 365

    const recencyScore = Math.max(0, 100 - daysSinceLastCommit)
    const commitScore = Math.min(100, repo.commits * 2)
    const popularityScore = Math.min(100, (repo.starCount + repo.forkCount) * 5)

    return Math.round((recencyScore * 0.4 + commitScore * 0.4 + popularityScore * 0.2))
  }

  private getLanguageColor(language: string): string {
    const colors: Record<string, string> = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C': '#555555',
      'C#': '#239120',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'Scala': '#c22d40',
      'R': '#198CE7',
      'MATLAB': '#e16737',
      'Shell': '#89e051',
      'PowerShell': '#012456',
      'HTML': '#e34c26',
      'CSS': '#1572B6',
      'SCSS': '#c6538c',
      'Vue': '#2c3e50',
      'React': '#61dafb',
      'Angular': '#dd0031',
      'Dart': '#00B4AB',
      'Lua': '#000080',
      'Perl': '#0298c3',
      'Haskell': '#5e5086',
      'Clojure': '#db5855',
      'Elixir': '#6e4a7e',
      'Erlang': '#B83998',
      'F#': '#b845fc',
      'OCaml': '#3be133',
      'Vim script': '#199f4b',
      'Dockerfile': '#384d54',
      'Makefile': '#427819',
      'CMake': '#DA3434',
      'Assembly': '#6E4C13',
      'Objective-C': '#438eff',
      'Objective-C++': '#6866fb'
    }

    return colors[language] || '#8b949e'
  }
}