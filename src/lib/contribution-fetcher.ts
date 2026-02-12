import { GitHubAPIClient, ContributionDay } from './github-api-client'
import { IContributionDay } from './models/streak'

export interface ContributionFetchOptions {
  timezone?: string
  includeWeekends?: boolean
  minContributions?: number
  maxDays?: number
}

export interface ContributionStats {
  totalContributions: number
  averagePerDay: number
  maxContributionsInDay: number
  activeDays: number
  streakDays: number
}

export class ContributionFetcher {
  private githubClient: GitHubAPIClient

  constructor(githubClient: GitHubAPIClient) {
    this.githubClient = githubClient
  }

  public async fetchContributionData(
    username: string, 
    days: number = 365,
    options: ContributionFetchOptions = {}
  ): Promise<IContributionDay[]> {
    const contributionDays = await this.githubClient.getContributionsForStreak(username, days)
    
    return this.transformContributionData(contributionDays, options)
  }

  public async fetchContributionDataForDateRange(
    username: string,
    fromDate: Date,
    toDate: Date,
    options: ContributionFetchOptions = {}
  ): Promise<IContributionDay[]> {
    const adjustedDates = this.adjustDatesForTimezone(fromDate, toDate, options.timezone)
    
    const response = await this.githubClient.getContributions(
      username, 
      adjustedDates.from, 
      adjustedDates.to
    )
    
    if (!response.user?.contributionsCollection?.contributionCalendar) {
      throw new Error('No contribution data found for user')
    }
    
    const contributionDays = this.githubClient.transformContributionData(
      response.user.contributionsCollection.contributionCalendar
    )
    
    return this.transformContributionData(contributionDays, options)
  }

  public async fetchContributionStats(
    username: string,
    days: number = 365,
    options: ContributionFetchOptions = {}
  ): Promise<ContributionStats> {
    const contributions = await this.fetchContributionData(username, days, options)
    
    return this.calculateContributionStats(contributions)
  }

  private transformContributionData(
    contributionDays: ContributionDay[],
    options: ContributionFetchOptions
  ): IContributionDay[] {
    let transformedData = contributionDays.map(day => ({
      date: day.date,
      contributionCount: day.contributionCount
    }))

    if (options.minContributions !== undefined) {
      transformedData = transformedData.filter(
        day => day.contributionCount >= options.minContributions!
      )
    }

    if (!options.includeWeekends) {
      transformedData = transformedData.filter(day => {
        const date = new Date(day.date)
        const dayOfWeek = date.getDay()
        return dayOfWeek !== 0 && dayOfWeek !== 6
      })
    }

    if (options.maxDays) {
      transformedData = transformedData.slice(-options.maxDays)
    }

    return transformedData.sort((a, b) => a.date.localeCompare(b.date))
  }

  private adjustDatesForTimezone(
    fromDate: Date,
    toDate: Date,
    timezone?: string
  ): { from: Date; to: Date } {
    if (!timezone) {
      return { from: fromDate, to: toDate }
    }

    const adjustedFrom = new Date(fromDate.toLocaleString('en-US', { timeZone: timezone }))
    const adjustedTo = new Date(toDate.toLocaleString('en-US', { timeZone: timezone }))

    adjustedFrom.setHours(0, 0, 0, 0)
    adjustedTo.setHours(23, 59, 59, 999)

    return { from: adjustedFrom, to: adjustedTo }
  }

  private calculateContributionStats(contributions: IContributionDay[]): ContributionStats {
    if (contributions.length === 0) {
      return {
        totalContributions: 0,
        averagePerDay: 0,
        maxContributionsInDay: 0,
        activeDays: 0,
        streakDays: 0
      }
    }

    const totalContributions = contributions.reduce(
      (sum, day) => sum + day.contributionCount, 
      0
    )
    
    const activeDays = contributions.filter(day => day.contributionCount > 0).length
    const maxContributionsInDay = Math.max(
      ...contributions.map(day => day.contributionCount)
    )
    
    const averagePerDay = totalContributions / contributions.length
    const streakDays = this.calculateCurrentStreakDays(contributions)

    return {
      totalContributions,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      maxContributionsInDay,
      activeDays,
      streakDays
    }
  }

  private calculateCurrentStreakDays(contributions: IContributionDay[]): number {
    if (contributions.length === 0) return 0

    const sortedContributions = contributions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))

    let streakDays = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const contribution of sortedContributions) {
      const contributionDate = new Date(contribution.date)
      contributionDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor(
        (today.getTime() - contributionDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === streakDays && contribution.contributionCount > 0) {
        streakDays++
      } else if (daysDiff > streakDays) {
        break
      }
    }

    return streakDays
  }

  public async fetchContributionYears(username: string): Promise<number[]> {
    const response = await this.githubClient.getContributionYears(username)
    
    if (!response.user?.contributionsCollection?.contributionYears) {
      throw new Error('No contribution years found for user')
    }
    
    return response.user.contributionsCollection.contributionYears
  }

  public async fetchOptimizedContributions(
    username: string,
    years: number[] = []
  ): Promise<Record<string, IContributionDay[]>> {
    const response = await this.githubClient.getOptimizedContributions(username, years)
    
    const result: Record<string, IContributionDay[]> = {}
    
    for (const [year, data] of Object.entries(response)) {
      if (data.contributionsCollection?.contributionCalendar) {
        const contributionDays = this.githubClient.transformContributionData(
          data.contributionsCollection.contributionCalendar
        )
        
        result[year] = contributionDays.map(day => ({
          date: day.date,
          contributionCount: day.contributionCount
        }))
      }
    }
    
    return result
  }

  public validateContributionData(contributions: IContributionDay[]): boolean {
    if (!Array.isArray(contributions)) return false
    
    return contributions.every(contribution => {
      return (
        typeof contribution.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(contribution.date) &&
        typeof contribution.contributionCount === 'number' &&
        contribution.contributionCount >= 0
      )
    })
  }

  public filterContributionsByDateRange(
    contributions: IContributionDay[],
    fromDate: Date,
    toDate: Date
  ): IContributionDay[] {
    const fromStr = fromDate.toISOString().split('T')[0]
    const toStr = toDate.toISOString().split('T')[0]
    
    return contributions.filter(contribution => {
      return contribution.date >= fromStr && contribution.date <= toStr
    })
  }

  public groupContributionsByMonth(
    contributions: IContributionDay[]
  ): Record<string, IContributionDay[]> {
    const grouped: Record<string, IContributionDay[]> = {}
    
    contributions.forEach(contribution => {
      const monthKey = contribution.date.substring(0, 7)
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      
      grouped[monthKey].push(contribution)
    })
    
    return grouped
  }

  public groupContributionsByWeek(
    contributions: IContributionDay[]
  ): Record<string, IContributionDay[]> {
    const grouped: Record<string, IContributionDay[]> = {}
    
    contributions.forEach(contribution => {
      const date = new Date(contribution.date)
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - date.getDay())
      const weekKey = startOfWeek.toISOString().split('T')[0]
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = []
      }
      
      grouped[weekKey].push(contribution)
    })
    
    return grouped
  }
}