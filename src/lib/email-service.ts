import nodemailer from 'nodemailer'
import { env } from './env'
import { EmailTemplates, StreakRiskTemplateData } from './email-templates'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface StreakRiskData {
  username: string
  currentStreak: number
  daysSinceLastContribution: number
  riskLevel: 'warning' | 'danger' | 'critical'
  hoursUntilBreak: number
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      })
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Email delivery failed')
    }
  }

  async sendStreakRiskNotification(
    userEmail: string,
    streakData: StreakRiskData
  ): Promise<void> {
    const templateData: StreakRiskTemplateData = {
      username: streakData.username,
      currentStreak: streakData.currentStreak,
      daysSinceLastContribution: streakData.daysSinceLastContribution,
      riskLevel: streakData.riskLevel,
      hoursUntilBreak: streakData.hoursUntilBreak
    }

    const template = EmailTemplates.getStreakRiskTemplate(templateData)

    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
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
}

export const emailService = new EmailService()