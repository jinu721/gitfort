import { emailService, StreakRiskData } from './email-service'
import { StreakRiskDetector } from './streak-risk-detector'
import { User } from './models/user'

export interface NotificationContext {
  user: User
  currentStreak: number
  lastContributionDate: Date | null
  lastNotificationSent: Date | null
}

export class NotificationService {
  private riskDetector: StreakRiskDetector

  constructor() {
    this.riskDetector = new StreakRiskDetector()
  }

  async processStreakRiskNotification(context: NotificationContext): Promise<boolean> {
    const { user, currentStreak, lastContributionDate, lastNotificationSent } = context

    const shouldNotify = this.riskDetector.shouldSendRiskNotification(
      lastContributionDate,
      currentStreak,
      lastNotificationSent
    )

    if (!shouldNotify) {
      return false
    }

    const riskAnalysis = this.riskDetector.analyzeStreakRisk(lastContributionDate, currentStreak)
    
    if (riskAnalysis.riskLevel.level === 'safe') {
      return false
    }

    const streakRiskData: StreakRiskData = {
      username: user.username,
      currentStreak,
      daysSinceLastContribution: riskAnalysis.daysSinceLastContribution,
      riskLevel: riskAnalysis.riskLevel.level as 'warning' | 'danger' | 'critical',
      hoursUntilBreak: riskAnalysis.hoursUntilBreak
    }

    try {
      await emailService.sendStreakRiskNotification(user.email, streakRiskData)
      return true
    } catch (error) {
      console.error('Failed to send streak risk notification:', error)
      throw error
    }
  }

  async sendTestNotification(userEmail: string, username: string): Promise<void> {
    const testData: StreakRiskData = {
      username,
      currentStreak: 15,
      daysSinceLastContribution: 1,
      riskLevel: 'warning',
      hoursUntilBreak: 18
    }

    await emailService.sendStreakRiskNotification(userEmail, testData)
  }

  async verifyEmailConfiguration(): Promise<boolean> {
    return await emailService.verifyConnection()
  }
}

export const notificationService = new NotificationService()