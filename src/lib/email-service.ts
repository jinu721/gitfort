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
  failureType?: 'network' | 'authentication' | 'rate_limit' | 'invalid_recipient' | 'unknown'
  timestamp: Date
}

export interface EmailFailureLog {
  id: string
  recipient: string
  subject: string
  failureType: string
  error: string
  retryCount: number
  timestamp: Date
  resolved: boolean
}

class EmailService {
  private transporter: nodemailer.Transporter
  private maxRetries = 3
  private retryDelay = 1000 // 1 second
  private failureLog: EmailFailureLog[] = []

  constructor() {
    this.transporter = nodemailer.createTransporter({
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
      rateLimit: 10,
      // Enhanced error handling
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000      // 60 seconds
    })

    // Set up event listeners for better monitoring
    this.transporter.on('error', (error) => {
      console.error('SMTP Transport Error:', error)
    })

    this.transporter.on('idle', () => {
      console.log('SMTP Transport is idle')
    })
  }

  async sendEmail(options: EmailOptions): Promise<EmailDeliveryResult> {
    return this.sendEmailWithRetry(options, 0)
  }

  private async sendEmailWithRetry(options: EmailOptions, retryCount: number): Promise<EmailDeliveryResult> {
    const timestamp = new Date()
    
    try {
      const result = await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        priority: options.priority || 'normal'
      })

      // If we had previous failures for this email, mark them as resolved
      this.markFailuresAsResolved(options.to, options.subject)

      return {
        success: true,
        messageId: result.messageId,
        retryCount,
        timestamp
      }
    } catch (error) {
      const failureType = this.categorizeError(error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`Email delivery attempt ${retryCount + 1} failed:`, {
        recipient: options.to,
        subject: options.subject,
        error: errorMessage,
        failureType,
        retryCount
      })
      
      // Log the failure
      this.logFailure(options.to, options.subject, failureType, errorMessage, retryCount)
      
      // Determine if we should retry based on error type
      const shouldRetry = this.shouldRetryError(failureType, retryCount)
      
      if (shouldRetry && retryCount < this.maxRetries) {
        // Calculate exponential backoff delay
        const delay = this.calculateRetryDelay(retryCount, failureType)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.sendEmailWithRetry(options, retryCount + 1)
      }

      // Try fallback methods if available
      if (retryCount >= this.maxRetries) {
        await this.tryFallbackMethods(options, failureType, errorMessage)
      }

      return {
        success: false,
        error: errorMessage,
        retryCount,
        failureType,
        timestamp
      }
    }
  }

  private categorizeError(error: any): EmailDeliveryResult['failureType'] {
    const errorMessage = error?.message?.toLowerCase() || ''
    const errorCode = error?.code || ''

    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
      return 'network'
    }
    
    if (errorMessage.includes('authentication') || errorMessage.includes('auth') || errorCode === 'EAUTH') {
      return 'authentication'
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorCode === 'ERATELIMIT') {
      return 'rate_limit'
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('recipient') || errorCode === 'EENVELOPE') {
      return 'invalid_recipient'
    }
    
    return 'unknown'
  }

  private shouldRetryError(failureType: EmailDeliveryResult['failureType'], retryCount: number): boolean {
    switch (failureType) {
      case 'network':
        return retryCount < this.maxRetries // Always retry network errors
      case 'rate_limit':
        return retryCount < 2 // Retry rate limits but with longer delays
      case 'authentication':
        return retryCount < 1 // Only retry auth errors once
      case 'invalid_recipient':
        return false // Don't retry invalid recipients
      case 'unknown':
        return retryCount < this.maxRetries // Retry unknown errors
      default:
        return false
    }
  }

  private calculateRetryDelay(retryCount: number, failureType: EmailDeliveryResult['failureType']): number {
    let baseDelay = this.retryDelay

    // Adjust delay based on failure type
    switch (failureType) {
      case 'rate_limit':
        baseDelay = 30000 // 30 seconds for rate limits
        break
      case 'network':
        baseDelay = 5000 // 5 seconds for network issues
        break
      default:
        baseDelay = this.retryDelay
    }

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, retryCount)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    
    return exponentialDelay + jitter
  }

  private logFailure(recipient: string, subject: string, failureType: string, error: string, retryCount: number): void {
    const failureId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const failure: EmailFailureLog = {
      id: failureId,
      recipient,
      subject,
      failureType,
      error,
      retryCount,
      timestamp: new Date(),
      resolved: false
    }

    this.failureLog.push(failure)
    
    // Keep only last 1000 failure logs to prevent memory issues
    if (this.failureLog.length > 1000) {
      this.failureLog = this.failureLog.slice(-1000)
    }
  }

  private markFailuresAsResolved(recipient: string, subject: string): void {
    this.failureLog
      .filter(log => log.recipient === recipient && log.subject === subject && !log.resolved)
      .forEach(log => log.resolved = true)
  }

  private async tryFallbackMethods(options: EmailOptions, failureType: string, error: string): Promise<void> {
    // Log to console as fallback
    console.warn('Email delivery failed after all retries. Fallback logging:', {
      recipient: options.to,
      subject: options.subject,
      failureType,
      error,
      timestamp: new Date().toISOString()
    })

    // In a production environment, you might want to:
    // 1. Store failed emails in a database for manual review
    // 2. Send to a different email service provider
    // 3. Queue for later retry with a different strategy
    // 4. Send SMS or push notification as alternative
    
    // For now, we'll just ensure the failure is properly logged
    try {
      // You could implement database logging here
      // await this.logFailureToDatabase(options, failureType, error)
    } catch (dbError) {
      console.error('Failed to log email failure to database:', dbError)
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

  // Get failure statistics for monitoring
  getFailureStats(): {
    totalFailures: number
    unresolvedFailures: number
    failuresByType: Record<string, number>
    recentFailures: EmailFailureLog[]
  } {
    const unresolvedFailures = this.failureLog.filter(log => !log.resolved)
    const failuresByType = this.failureLog.reduce((acc, log) => {
      acc[log.failureType] = (acc[log.failureType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const recentFailures = this.failureLog
      .filter(log => Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return {
      totalFailures: this.failureLog.length,
      unresolvedFailures: unresolvedFailures.length,
      failuresByType,
      recentFailures
    }
  }

  // Clear resolved failures older than specified days
  clearOldFailures(daysOld: number = 7): number {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    const initialCount = this.failureLog.length
    
    this.failureLog = this.failureLog.filter(log => 
      !log.resolved || log.timestamp > cutoffDate
    )
    
    return initialCount - this.failureLog.length
  }

  async close(): Promise<void> {
    this.transporter.close()
  }
}

export const emailService = new EmailService()