import { IContributionDay } from './models/streak'

export interface StreakStats {
  currentStreak: number
  longestStreak: number
  isAtRisk: boolean
  lastContributionDate: Date | null
  streakStartDate: Date | null
  longestStreakStartDate: Date | null
  longestStreakEndDate: Date | null
}

export interface StreakRiskConfig {
  riskThresholdHours: number
  gracePeriodHours: number
  timezone?: string
}

export class StreakCalculator {
  private readonly defaultRiskConfig: StreakRiskConfig = {
    riskThresholdHours: 20,
    gracePeriodHours: 4,
    timezone: 'UTC'
  }

  public calculateCurrentStreak(contributions: IContributionDay[]): number {
    if (!contributions || contributions.length === 0) {
      return 0
    }

    const sortedContributions = this.sortContributionsByDate(contributions, 'desc')
    const today = this.getTodayDateString()
    const yesterday = this.getYesterdayDateString()

    let currentStreak = 0
    let checkDate = today

    const hasContributionToday = sortedContributions.some(
      c => c.date === today && c.contributionCount > 0
    )

    if (!hasContributionToday) {
      checkDate = yesterday
    }

    for (const contribution of sortedContributions) {
      if (contribution.date === checkDate && contribution.contributionCount > 0) {
        currentStreak++
        checkDate = this.getPreviousDateString(checkDate)
      } else if (contribution.date < checkDate) {
        break
      }
    }

    return currentStreak
  }

  public calculateLongestStreak(contributions: IContributionDay[]): number {
    if (!contributions || contributions.length === 0) {
      return 0
    }

    const sortedContributions = this.sortContributionsByDate(contributions, 'asc')
    let longestStreak = 0
    let currentStreak = 0
    let previousDate: string | null = null

    for (const contribution of sortedContributions) {
      if (contribution.contributionCount > 0) {
        if (previousDate === null || this.isConsecutiveDay(previousDate, contribution.date)) {
          currentStreak++
        } else {
          longestStreak = Math.max(longestStreak, currentStreak)
          currentStreak = 1
        }
        previousDate = contribution.date
      } else {
        longestStreak = Math.max(longestStreak, currentStreak)
        currentStreak = 0
        previousDate = null
      }
    }

    return Math.max(longestStreak, currentStreak)
  }

  public isStreakAtRisk(
    lastContribution: Date | null,
    config: Partial<StreakRiskConfig> = {}
  ): boolean {
    if (!lastContribution) {
      return true
    }

    const riskConfig = { ...this.defaultRiskConfig, ...config }
    const now = new Date()
    const hoursSinceLastContribution = (now.getTime() - lastContribution.getTime()) / (1000 * 60 * 60)

    return hoursSinceLastContribution > riskConfig.riskThresholdHours
  }

  public getStreakStatistics(contributions: IContributionDay[]): StreakStats {
    const currentStreak = this.calculateCurrentStreak(contributions)
    const longestStreak = this.calculateLongestStreak(contributions)
    const lastContributionDate = this.getLastContributionDate(contributions)
    const isAtRisk = this.isStreakAtRisk(lastContributionDate)

    const streakStartDate = this.getStreakStartDate(contributions, currentStreak)
    const longestStreakDates = this.getLongestStreakDates(contributions)

    return {
      currentStreak,
      longestStreak,
      isAtRisk,
      lastContributionDate,
      streakStartDate,
      longestStreakStartDate: longestStreakDates.startDate,
      longestStreakEndDate: longestStreakDates.endDate
    }
  }

  private sortContributionsByDate(
    contributions: IContributionDay[],
    order: 'asc' | 'desc' = 'asc'
  ): IContributionDay[] {
    return contributions.slice().sort((a, b) => {
      const comparison = a.date.localeCompare(b.date)
      return order === 'asc' ? comparison : -comparison
    })
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0]
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }

  private getPreviousDateString(dateString: string): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() - 1)
    return date.toISOString().split('T')[0]
  }

  private isConsecutiveDay(previousDate: string, currentDate: string): boolean {
    const prev = new Date(previousDate)
    const curr = new Date(currentDate)
    const diffTime = curr.getTime() - prev.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays === 1
  }

  private getLastContributionDate(contributions: IContributionDay[]): Date | null {
    const contributionsWithActivity = contributions.filter(c => c.contributionCount > 0)
    
    if (contributionsWithActivity.length === 0) {
      return null
    }

    const sortedContributions = this.sortContributionsByDate(contributionsWithActivity, 'desc')
    return new Date(sortedContributions[0].date)
  }

  private getStreakStartDate(contributions: IContributionDay[], streakLength: number): Date | null {
    if (streakLength === 0) {
      return null
    }

    const sortedContributions = this.sortContributionsByDate(contributions, 'desc')
    const today = this.getTodayDateString()
    const yesterday = this.getYesterdayDateString()

    let checkDate = today
    let daysFound = 0

    const hasContributionToday = sortedContributions.some(
      c => c.date === today && c.contributionCount > 0
    )

    if (!hasContributionToday) {
      checkDate = yesterday
    }

    for (const contribution of sortedContributions) {
      if (contribution.date === checkDate && contribution.contributionCount > 0) {
        daysFound++
        if (daysFound === streakLength) {
          return new Date(contribution.date)
        }
        checkDate = this.getPreviousDateString(checkDate)
      } else if (contribution.date < checkDate) {
        break
      }
    }

    return null
  }

  private getLongestStreakDates(contributions: IContributionDay[]): {
    startDate: Date | null
    endDate: Date | null
  } {
    if (!contributions || contributions.length === 0) {
      return { startDate: null, endDate: null }
    }

    const sortedContributions = this.sortContributionsByDate(contributions, 'asc')
    let longestStreak = 0
    let currentStreak = 0
    let longestStartDate: string | null = null
    let longestEndDate: string | null = null
    let currentStartDate: string | null = null
    let previousDate: string | null = null

    for (const contribution of sortedContributions) {
      if (contribution.contributionCount > 0) {
        if (previousDate === null || this.isConsecutiveDay(previousDate, contribution.date)) {
          if (currentStreak === 0) {
            currentStartDate = contribution.date
          }
          currentStreak++
        } else {
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak
            longestStartDate = currentStartDate
            longestEndDate = previousDate
          }
          currentStreak = 1
          currentStartDate = contribution.date
        }
        previousDate = contribution.date
      } else {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
          longestStartDate = currentStartDate
          longestEndDate = previousDate
        }
        currentStreak = 0
        currentStartDate = null
        previousDate = null
      }
    }

    if (currentStreak > longestStreak) {
      longestStartDate = currentStartDate
      longestEndDate = previousDate
    }

    return {
      startDate: longestStartDate ? new Date(longestStartDate) : null,
      endDate: longestEndDate ? new Date(longestEndDate) : null
    }
  }
}