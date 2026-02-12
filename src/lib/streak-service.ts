import { StreakCalculator, StreakStats, StreakRiskConfig } from './streak-calculator'
import { ContributionFetcher } from './contribution-fetcher'
import { Streak, IStreak, IContributionDay } from './models/streak'
import { GitHubAPIClient } from './github-api-client'

export interface StreakUpdateResult {
  success: boolean
  streak: IStreak | null
  error?: string
  updated: boolean
}

export interface StreakServiceConfig {
  cacheExpiryMinutes: number
  riskConfig: StreakRiskConfig
  autoUpdate: boolean
}

export class StreakService {
  private calculator: StreakCalculator
  private contributionFetcher: ContributionFetcher
  private config: StreakServiceConfig

  private readonly defaultConfig: StreakServiceConfig = {
    cacheExpiryMinutes: 60,
    riskConfig: {
      riskThresholdHours: 20,
      gracePeriodHours: 4,
      timezone: 'UTC'
    },
    autoUpdate: true
  }

  constructor(
    githubClient: GitHubAPIClient,
    config: Partial<StreakServiceConfig> = {}
  ) {
    this.calculator = new StreakCalculator()
    this.contributionFetcher = new ContributionFetcher(githubClient)
    this.config = { ...this.defaultConfig, ...config }
  }

  public async updateStreakData(userId: string, username: string): Promise<StreakUpdateResult> {
    try {
      const existingStreak = await this.getExistingStreak(userId)
      
      if (existingStreak && !this.shouldUpdateStreak(existingStreak)) {
        return {
          success: true,
          streak: existingStreak,
          updated: false
        }
      }

      const contributionData = await this.contributionFetcher.fetchContributionData(username)
      const streakStats = this.calculator.getStreakStatistics(contributionData)
      
      const streakData = await this.saveStreakData(userId, contributionData, streakStats)

      return {
        success: true,
        streak: streakData,
        updated: true
      }
    } catch (error) {
      return {
        success: false,
        streak: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        updated: false
      }
    }
  }

  public async getStreakData(userId: string): Promise<IStreak | null> {
    try {
      return await Streak.findOne({ userId }).exec()
    } catch (error) {
      throw new Error(`Failed to retrieve streak data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  public async calculateStreakFromData(contributionData: IContributionDay[]): Promise<StreakStats> {
    return this.calculator.getStreakStatistics(contributionData)
  }

  public async isStreakAtRisk(userId: string): Promise<boolean> {
    try {
      const streakData = await this.getStreakData(userId)
      
      if (!streakData) {
        return true
      }

      return this.calculator.isStreakAtRisk(streakData.lastContributionDate, this.config.riskConfig)
    } catch (error) {
      return true
    }
  }

  public async getStreakRiskStatus(userId: string): Promise<{
    isAtRisk: boolean
    hoursUntilRisk: number
    lastContribution: Date | null
    currentStreak: number
  }> {
    try {
      const streakData = await this.getStreakData(userId)
      
      if (!streakData) {
        return {
          isAtRisk: true,
          hoursUntilRisk: 0,
          lastContribution: null,
          currentStreak: 0
        }
      }

      const isAtRisk = this.calculator.isStreakAtRisk(streakData.lastContributionDate, this.config.riskConfig)
      const hoursUntilRisk = this.calculateHoursUntilRisk(streakData.lastContributionDate)

      return {
        isAtRisk,
        hoursUntilRisk,
        lastContribution: streakData.lastContributionDate,
        currentStreak: streakData.currentStreak
      }
    } catch (error) {
      return {
        isAtRisk: true,
        hoursUntilRisk: 0,
        lastContribution: null,
        currentStreak: 0
      }
    }
  }

  public async refreshStreakData(userId: string, username: string): Promise<StreakUpdateResult> {
    try {
      await Streak.deleteOne({ userId })
      return await this.updateStreakData(userId, username)
    } catch (error) {
      return {
        success: false,
        streak: null,
        error: error instanceof Error ? error.message : 'Failed to refresh streak data',
        updated: false
      }
    }
  }

  public async getStreakHistory(userId: string, days: number = 30): Promise<IContributionDay[]> {
    try {
      const streakData = await this.getStreakData(userId)
      
      if (!streakData || !streakData.contributionData) {
        return []
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      const cutoffString = cutoffDate.toISOString().split('T')[0]

      return streakData.contributionData
        .filter(contribution => contribution.date >= cutoffString)
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      return []
    }
  }

  private async getExistingStreak(userId: string): Promise<IStreak | null> {
    try {
      return await Streak.findOne({ userId }).exec()
    } catch (error) {
      return null
    }
  }

  private shouldUpdateStreak(streak: IStreak): boolean {
    if (!this.config.autoUpdate) {
      return false
    }

    const now = new Date()
    const lastUpdate = new Date(streak.calculatedAt)
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

    return minutesSinceUpdate >= this.config.cacheExpiryMinutes
  }

  private async saveStreakData(
    userId: string,
    contributionData: IContributionDay[],
    streakStats: StreakStats
  ): Promise<IStreak> {
    const streakDocument = {
      userId,
      currentStreak: streakStats.currentStreak,
      longestStreak: streakStats.longestStreak,
      lastContributionDate: streakStats.lastContributionDate || new Date(),
      contributionData,
      calculatedAt: new Date()
    }

    try {
      const result = await Streak.findOneAndUpdate(
        { userId },
        streakDocument,
        { 
          upsert: true, 
          new: true,
          runValidators: true
        }
      ).exec()

      if (!result) {
        throw new Error('Failed to save streak data')
      }

      return result
    } catch (error) {
      throw new Error(`Failed to save streak data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private calculateHoursUntilRisk(lastContribution: Date | null): number {
    if (!lastContribution) {
      return 0
    }

    const now = new Date()
    const hoursSinceLastContribution = (now.getTime() - lastContribution.getTime()) / (1000 * 60 * 60)
    const hoursUntilRisk = this.config.riskConfig.riskThresholdHours - hoursSinceLastContribution

    return Math.max(0, Math.round(hoursUntilRisk))
  }

  public validateContributionData(contributions: IContributionDay[]): boolean {
    return this.contributionFetcher.validateContributionData(contributions)
  }

  public async getStreakSummary(userId: string): Promise<{
    currentStreak: number
    longestStreak: number
    isAtRisk: boolean
    lastUpdate: Date | null
    totalContributions: number
  }> {
    try {
      const streakData = await this.getStreakData(userId)
      
      if (!streakData) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          isAtRisk: true,
          lastUpdate: null,
          totalContributions: 0
        }
      }

      const totalContributions = streakData.contributionData.reduce(
        (sum, day) => sum + day.contributionCount,
        0
      )

      const isAtRisk = this.calculator.isStreakAtRisk(
        streakData.lastContributionDate,
        this.config.riskConfig
      )

      return {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        isAtRisk,
        lastUpdate: streakData.calculatedAt,
        totalContributions
      }
    } catch (error) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        isAtRisk: true,
        lastUpdate: null,
        totalContributions: 0
      }
    }
  }
}