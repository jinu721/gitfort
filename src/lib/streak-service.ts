import { StreakCalculator, StreakStats, StreakRiskConfig } from './streak-calculator'
import { ContributionFetcher } from './contribution-fetcher'
import { IStreak, IContributionDay } from './models/streak'
import { GitHubAPIClient } from './github-api-client'
import { StreakPersistenceService } from './streak-persistence-service'
import { notificationService, NotificationContent } from './notification-service'
import { User, IUser } from './models/user'

export interface StreakUpdateResult {
  success: boolean
  streak: IStreak | null
  error?: string
  updated: boolean
  notificationSent?: boolean
}

export interface StreakServiceConfig {
  cacheExpiryMinutes: number
  riskConfig: StreakRiskConfig
  autoUpdate: boolean
  enableNotifications: boolean
}

export class StreakService {
  private calculator: StreakCalculator
  private contributionFetcher: ContributionFetcher
  private persistenceService: StreakPersistenceService
  private config: StreakServiceConfig

  private readonly defaultConfig: StreakServiceConfig = {
    cacheExpiryMinutes: 60,
    riskConfig: {
      riskThresholdHours: 20,
      gracePeriodHours: 4,
      timezone: 'UTC'
    },
    autoUpdate: true,
    enableNotifications: true
  }

  constructor(
    githubClient: GitHubAPIClient,
    config: Partial<StreakServiceConfig> = {}
  ) {
    this.calculator = new StreakCalculator()
    this.contributionFetcher = new ContributionFetcher(githubClient)
    this.persistenceService = new StreakPersistenceService()
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

  public async updateStreakDataWithNotifications(
    userId: string, 
    username: string, 
    user: IUser,
    lastNotificationSent: Date | null = null
  ): Promise<StreakUpdateResult> {
    try {
      const updateResult = await this.updateStreakData(userId, username)
      
      if (!updateResult.success || !updateResult.streak || !this.config.enableNotifications) {
        return updateResult
      }

      // Create streak risk notification event
      const notificationEvent = {
        type: 'streak_risk' as const,
        userId: userId,
        data: {
          currentStreak: updateResult.streak.currentStreak,
          daysUntilRisk: 1 // Calculate based on last contribution
        },
        timestamp: new Date()
      };

      let notificationSent = false
      try {
        notificationSent = await notificationService.sendNotification(notificationEvent)
      } catch (notificationError) {
        console.error('Notification failed but streak update succeeded:', notificationError)
      }

      return {
        ...updateResult,
        notificationSent
      }
    } catch (error) {
      return {
        success: false,
        streak: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        updated: false,
        notificationSent: false
      }
    }
  }

  public async getStreakData(userId: string): Promise<IStreak | null> {
    const result = await this.persistenceService.getStreak(userId, { includeContributions: true })
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to retrieve streak data')
    }
    
    return result.data || null
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
    const deleteResult = await this.persistenceService.deleteStreak(userId)
    
    if (!deleteResult.success) {
      return {
        success: false,
        streak: null,
        error: deleteResult.error || 'Failed to delete existing streak data',
        updated: false
      }
    }
    
    return await this.updateStreakData(userId, username)
  }

  public async getStreakHistory(userId: string, days: number = 30): Promise<IContributionDay[]> {
    const result = await this.persistenceService.getStreakHistory(userId, days)
    
    if (!result.success) {
      return []
    }
    
    return result.data || []
  }

  private async getExistingStreak(userId: string): Promise<IStreak | null> {
    const result = await this.persistenceService.getStreak(userId, { includeContributions: true })
    return result.success ? (result.data || null) : null
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
    const result = await this.persistenceService.saveStreak(
      userId,
      streakStats.currentStreak,
      streakStats.longestStreak,
      streakStats.lastContributionDate || new Date(),
      contributionData
    )

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to save streak data')
    }

    return result.data
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
    const result = await this.persistenceService.getStreakSummary(userId)
    
    if (!result.success || !result.data) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        isAtRisk: true,
        lastUpdate: null,
        totalContributions: 0
      }
    }

    const { data } = result
    
    if (!data.hasData) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        isAtRisk: true,
        lastUpdate: null,
        totalContributions: 0
      }
    }

    const streakData = await this.getStreakData(userId)
    const isAtRisk = streakData 
      ? this.calculator.isStreakAtRisk(streakData.lastContributionDate, this.config.riskConfig)
      : true

    return {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      isAtRisk,
      lastUpdate: data.lastUpdate,
      totalContributions: data.totalContributions
    }
  }

  public async sendTestNotification(userEmail: string, username: string): Promise<void> {
    // Create a test notification event
    const testEvent = {
      type: 'weekly_digest' as const,
      userId: 'test-user-id',
      data: {
        stats: {
          commits: 42,
          activeRepos: 5,
          currentStreak: 7,
          securityScans: 3,
          cicdRuns: 15
        }
      },
      timestamp: new Date()
    };

    await notificationService.sendNotification(testEvent);
  }

  public async verifyEmailConfiguration(): Promise<boolean> {
    // Check if email service is configured by trying to verify connection
    const emailService = (notificationService as any).emailService;
    return emailService ? await emailService.verifyConnection() : false;
  }
}