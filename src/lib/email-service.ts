import nodemailer from 'nodemailer'
import { env } from './env'
import { EmailTemplates, StreakRiskTemplateData } from './email-templates'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  priority?: 'high' | 'normal' | 'low'
}

export interface StreakRiskData {
  username: string
  currentStreak: number
  daysSinceLastContribution: number
  riskLevel: 'warning' | 'danger' | 'critical'
  hoursUntilBreak: number
}

export interface EmailDeliveryResult {
  success: boolean
  messageId?: string
  error?: string
  retryCount: number
}

class EmailService {
  private transporter: nodemailer.Transporter
  private maxRetries = 3
  private retryDelay = 1000 // 1 second

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10
    })
  }

  async sendEmail(options: EmailOptions): Promise<EmailDeliveryResult> {
    return this.sendEmailWithRetry(options, 0)
  }

  private async sendEmailWithRetry(options: EmailOptions, retryCount: number): Promise<EmailDeliveryResult> {
    try {
      const result = await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        priority: options.priority || 'normal'
      })

      return {
        success: true,
        messageId: result.messageId,
        retryCount
      }
    } catch (error) {
      console.error(`Email delivery attempt ${retryCount + 1} failed:`, error)
      
      if (retryCount < this.maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.sendEmailWithRetry(options, retryCount + 1)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount
      }
    }
  }

  async sendStreakRiskNotification(
    userEmail: string,
    streakData: StreakRiskData
  ): Promise<EmailDeliveryResult> {
    const templateData: StreakRiskTemplateData = {
      username: streakData.username,
      currentStreak: streakData.currentStreak,
      daysSinceLastContribution: streakData.daysSinceLastContribution,
      riskLevel: streakData.riskLevel,
      hoursUntilBreak: streakData.hoursUntilBreak
    }

    const template = EmailTemplates.getStreakRiskTemplate(templateData)

    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: streakData.riskLevel === 'critical' ? 'high' : 'normal'
    })
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('SMTP connection verification failed:', error)
      return false
    }
  }

  async close(): Promise<void> {
    this.transporter.close()
  }
}

export const emailService = new EmailService()