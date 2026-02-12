import { IContributionDay } from './models/streak'

export interface RiskLevel {
  level: 'safe' | 'warning' | 'danger' | 'critical'
  severity: number
  message: string
  hoursRemaining: number
}

export interface RiskDetectionConfig {
  safeThresholdHours: number
  warningThresholdHours: number
  dangerThresholdHours: number
  criticalThresholdHours: number
  timezone: string
  considerWeekends: boolean
  gracePeriodHours: number
}

export interface StreakRiskAnalysis {
  riskLevel: RiskLevel
  recommendations: string[]
  nextContributionDeadline: Date
  streakEndDate: Date | null
  daysWithoutContribution: number
  isWeekend: boolean
  timeZoneOffset: number
}

export class StreakRiskDetector {
  private readonly defaultConfig: RiskDetectionConfig = {
    safeThresholdHours: 8,
    warningThresholdHours: 16,
    dangerThresholdHours: 20,
    criticalThresholdHours: 24,
    timezone: 'UTC',
    considerWeekends: true,
    gracePeriodHours: 2
  }

  private config: RiskDetectionConfig

  constructor(config: Partial<RiskDetectionConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config }
  }

  public analyzeStreakRisk(
    lastContributionDate: Date | null,
    currentStreak: number,
    contributionData: IContributionDay[] = []
  ): StreakRiskAnalysis {
    const now = new Date()
    
    if (!lastContributionDate) {
      return this.createCriticalRiskAnalysis(now, currentStreak, 0)
    }

    const hoursSinceLastContribution = this.calculateHoursSince(lastContributionDate, now)
    const daysWithoutContribution = Math.floor(hoursSinceLastContribution / 24)
    const isWeekend = this.isWeekend(now)
    const timeZoneOffset = this.getTimezoneOffset(now)

    const riskLevel = this.calculateRiskLevel(
      hoursSinceLastContribution,
      isWeekend,
      currentStreak
    )

    const nextDeadline = this.calculateNextContributionDeadline(lastContributionDate)
    const streakEndDate = this.calculateStreakEndDate(lastContributionDate, riskLevel)
    const recommendations = this.generateRecommendations(riskLevel, isWeekend, currentStreak)

    return {
      riskLevel,
      recommendations,
      nextContributionDeadline: nextDeadline,
      streakEndDate,
      daysWithoutContribution,
      isWeekend,
      timeZoneOffset
    }
  }

  public getStreakEndPrediction(
    lastContributionDate: Date | null,
    currentStreak: number
  ): Date | null {
    if (!lastContributionDate || currentStreak === 0) {
      return null
    }

    const endDate = new Date(lastContributionDate)
    endDate.setHours(23, 59, 59, 999)
    endDate.setDate(endDate.getDate() + 1)

    return endDate
  }

  public isStreakInDanger(
    lastContributionDate: Date | null,
    currentStreak: number
  ): boolean {
    if (!lastContributionDate || currentStreak === 0) {
      return true
    }

    const analysis = this.analyzeStreakRisk(lastContributionDate, currentStreak)
    return analysis.riskLevel.level === 'danger' || analysis.riskLevel.level === 'critical'
  }

  public getTimeUntilStreakEnd(lastContributionDate: Date | null): number {
    if (!lastContributionDate) {
      return 0
    }

    const now = new Date()
    const endOfDay = new Date(lastContributionDate)
    endOfDay.setDate(endOfDay.getDate() + 1)
    endOfDay.setHours(23, 59, 59, 999)

    const hoursRemaining = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)
    return Math.max(0, hoursRemaining)
  }

  public shouldSendRiskNotification(
    lastContributionDate: Date | null,
    currentStreak: number,
    lastNotificationSent: Date | null
  ): boolean {
    const analysis = this.analyzeStreakRisk(lastContributionDate, currentStreak)
    
    if (analysis.riskLevel.level === 'safe') {
      return false
    }

    if (!lastNotificationSent) {
      return true
    }

    const hoursSinceLastNotification = this.calculateHoursSince(lastNotificationSent, new Date())
    const notificationCooldown = this.getNotificationCooldown(analysis.riskLevel.level)

    return hoursSinceLastNotification >= notificationCooldown
  }

  private calculateRiskLevel(
    hoursSinceLastContribution: number,
    isWeekend: boolean,
    currentStreak: number
  ): RiskLevel {
    const adjustedHours = this.adjustHoursForWeekend(hoursSinceLastContribution, isWeekend)
    
    if (adjustedHours <= this.config.safeThresholdHours) {
      return {
        level: 'safe',
        severity: 1,
        message: 'Your streak is safe',
        hoursRemaining: this.config.criticalThresholdHours - adjustedHours
      }
    }

    if (adjustedHours <= this.config.warningThresholdHours) {
      return {
        level: 'warning',
        severity: 2,
        message: 'Consider making a contribution soon',
        hoursRemaining: this.config.criticalThresholdHours - adjustedHours
      }
    }

    if (adjustedHours <= this.config.dangerThresholdHours) {
      return {
        level: 'danger',
        severity: 3,
        message: 'Your streak is at risk',
        hoursRemaining: this.config.criticalThresholdHours - adjustedHours
      }
    }

    return {
      level: 'critical',
      severity: 4,
      message: 'Your streak will end soon',
      hoursRemaining: Math.max(0, this.config.criticalThresholdHours - adjustedHours)
    }
  }

  private adjustHoursForWeekend(hours: number, isWeekend: boolean): number {
    if (!this.config.considerWeekends || !isWeekend) {
      return hours
    }

    return Math.max(0, hours - this.config.gracePeriodHours)
  }

  private calculateHoursSince(fromDate: Date, toDate: Date): number {
    return (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60)
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  private getTimezoneOffset(date: Date): number {
    return date.getTimezoneOffset()
  }

  private calculateNextContributionDeadline(lastContributionDate: Date): Date {
    const deadline = new Date(lastContributionDate)
    deadline.setDate(deadline.getDate() + 1)
    deadline.setHours(23, 59, 59, 999)
    return deadline
  }

  private calculateStreakEndDate(lastContributionDate: Date, riskLevel: RiskLevel): Date | null {
    if (riskLevel.level === 'safe' || riskLevel.level === 'warning') {
      return null
    }

    const endDate = new Date(lastContributionDate)
    endDate.setDate(endDate.getDate() + 1)
    endDate.setHours(23, 59, 59, 999)
    
    return endDate
  }

  private generateRecommendations(
    riskLevel: RiskLevel,
    isWeekend: boolean,
    currentStreak: number
  ): string[] {
    const recommendations: string[] = []

    switch (riskLevel.level) {
      case 'safe':
        recommendations.push('Keep up the great work!')
        if (currentStreak > 0) {
          recommendations.push(`You're on a ${currentStreak}-day streak`)
        }
        break

      case 'warning':
        recommendations.push('Plan your next contribution')
        recommendations.push('Set a reminder to contribute today')
        if (isWeekend) {
          recommendations.push('Weekend contributions count too')
        }
        break

      case 'danger':
        recommendations.push('Make a contribution as soon as possible')
        recommendations.push('Even a small commit counts')
        recommendations.push('Consider working on documentation or README updates')
        break

      case 'critical':
        recommendations.push('URGENT: Your streak will end very soon')
        recommendations.push('Make any contribution immediately')
        recommendations.push('Quick fixes: update comments, fix typos, or add documentation')
        if (riskLevel.hoursRemaining > 0) {
          recommendations.push(`You have approximately ${Math.round(riskLevel.hoursRemaining)} hours left`)
        }
        break
    }

    return recommendations
  }

  private createCriticalRiskAnalysis(
    now: Date,
    currentStreak: number,
    daysWithoutContribution: number
  ): StreakRiskAnalysis {
    return {
      riskLevel: {
        level: 'critical',
        severity: 4,
        message: 'No contribution history found',
        hoursRemaining: 0
      },
      recommendations: [
        'Start your contribution streak today',
        'Make your first commit to begin tracking'
      ],
      nextContributionDeadline: now,
      streakEndDate: null,
      daysWithoutContribution,
      isWeekend: this.isWeekend(now),
      timeZoneOffset: this.getTimezoneOffset(now)
    }
  }

  private getNotificationCooldown(riskLevel: string): number {
    switch (riskLevel) {
      case 'warning':
        return 8
      case 'danger':
        return 4
      case 'critical':
        return 1
      default:
        return 24
    }
  }

  public updateConfig(newConfig: Partial<RiskDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public getConfig(): RiskDetectionConfig {
    return { ...this.config }
  }
}