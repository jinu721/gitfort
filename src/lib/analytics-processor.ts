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

    export interface HeatmapData {
      contributions: Array<{
        date: string
        count: number
        level: number
        dayOfWeek: number
        weekOfYear: number
      }>
      totalContributions: number
      maxContributions: number
      averageContributions: number
      streakData: {
        currentStreak: number
        longestStreak: number
        streakStart: string | null
        streakEnd: string | null
      }
      dateRange: {
        startDate: string
        endDate: string
        totalDays: number
      }
    }

    export interface DateRange {
      startDate: Date
      endDate: Date
    }

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
  async generateContributionHeatmap(username: string, dateRange?: DateRange): Promise<HeatmapData> {
    const endDate = dateRange?.endDate || new Date()
    const startDate = dateRange?.startDate || new Date(endDate.getTime() - (365 * 24 * 60 * 60 * 1000))

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const contributions = await this.githubClient.getContributionsForStreak(username, daysDiff)

    const filteredContributions = contributions.filter(day => {
      const dayDate = new Date(day.date)
      return dayDate >= startDate && dayDate <= endDate
    })

    const heatmapContributions = filteredContributions.map(day => {
      const date = new Date(day.date)
      const level = this.calculateContributionLevel(day.contributionCount)
      const dayOfWeek = date.getDay()
      const weekOfYear = this.getWeekOfYear(date)

      return {
        date: day.date,
        count: day.contributionCount,
        level,
        dayOfWeek,
        weekOfYear
      }
    })

    const totalContributions = heatmapContributions.reduce((sum, day) => sum + day.count, 0)
    const maxContributions = Math.max(...heatmapContributions.map(day => day.count), 0)
    const averageContributions = heatmapContributions.length > 0 ? totalContributions / heatmapContributions.length : 0

    const streakData = this.calculateStreakFromHeatmap(heatmapContributions)

    return {
      contributions: heatmapContributions,
      totalContributions,
      maxContributions,
      averageContributions,
      streakData,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalDays: heatmapContributions.length
      }
    }
  }

  async generateCustomRangeHeatmap(username: string, startDate: string, endDate: string): Promise<HeatmapData> {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      throw new Error('Start date must be before end date')
    }

    return this.generateContributionHeatmap(username, { startDate: start, endDate: end })
  }

  async generateYearlyHeatmap(username: string, year: number): Promise<HeatmapData> {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    return this.generateContributionHeatmap(username, { startDate, endDate })
  }

  async generateLastNDaysHeatmap(username: string, days: number): Promise<HeatmapData> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    return this.generateContributionHeatmap(username, { startDate, endDate })
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
  private calculateContributionLevel(count: number): number {
    if (count === 0) return 0
    if (count <= 3) return 1
    if (count <= 6) return 2
    if (count <= 9) return 3
    return 4
  }

  private getWeekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  private calculateStreakFromHeatmap(contributions: Array<{ date: string; count: number }>): {
    currentStreak: number
    longestStreak: number
    streakStart: string | null
    streakEnd: string | null
  } {
    const sortedContributions = contributions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let currentStreakStart: string | null = null
    let currentStreakEnd: string | null = null
    let longestStreakStart: string | null = null
    let longestStreakEnd: string | null = null
    let tempStreakStart: string | null = null

    for (let i = sortedContributions.length - 1; i >= 0; i--) {
      const contribution = sortedContributions[i]

      if (contribution.count > 0) {
        if (currentStreak === 0) {
          currentStreakEnd = contribution.date
          tempStreakStart = contribution.date
        }
        currentStreak++
        currentStreakStart = contribution.date
      } else {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
          longestStreakStart = currentStreakStart
          longestStreakEnd = currentStreakEnd
        }
        currentStreak = 0
        currentStreakStart = null
        currentStreakEnd = null
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak
      longestStreakStart = currentStreakStart
      longestStreakEnd = currentStreakEnd
    }

    return {
      currentStreak,
      longestStreak,
      streakStart: longestStreakStart,
      streakEnd: longestStreakEnd
    }
  }
}