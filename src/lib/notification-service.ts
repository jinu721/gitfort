import { EmailService } from './email-service';
import { NotificationPreferenceService } from './notification-preference-service';

export interface NotificationEvent {
  type: 'streak_risk' | 'security_alert' | 'cicd_failure' | 'weekly_digest';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface NotificationContent {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export class NotificationService {
  private emailService: EmailService;
  private preferenceService: NotificationPreferenceService;

  constructor() {
    this.emailService = new EmailService();
    this.preferenceService = new NotificationPreferenceService();
  }

  async sendNotification(event: NotificationEvent): Promise<boolean> {
    try {
      // Get user preferences
      const preferences = await this.preferenceService.getPreferences(event.userId);
      if (!preferences) {
        console.log(`No preferences found for user ${event.userId}`);
        return false;
      }

      // Check if user wants this type of notification
      if (!this.shouldSendNotification(event.type, preferences)) {
        console.log(`User ${event.userId} has disabled ${event.type} notifications`);
        return false;
      }

      // Generate notification content
      const content = this.generateNotificationContent(event);
      
      // Send email
      const success = await this.emailService.sendEmail({
        to: preferences.emailAddress,
        subject: content.subject,
        html: content.htmlContent,
        text: content.textContent
      });

      if (success) {
        console.log(`Notification sent successfully to ${preferences.emailAddress}`);
      } else {
        console.error(`Failed to send notification to ${preferences.emailAddress}`);
      }

      return success;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  private shouldSendNotification(type: NotificationEvent['type'], preferences: any): boolean {
    switch (type) {
      case 'streak_risk':
        return preferences.streakRiskNotifications;
      case 'security_alert':
        return preferences.securityAlerts;
      case 'cicd_failure':
        return preferences.cicdFailureNotifications;
      case 'weekly_digest':
        return preferences.weeklyDigest;
      default:
        return false;
    }
  }

  private generateNotificationContent(event: NotificationEvent): NotificationContent {
    switch (event.type) {
      case 'streak_risk':
        return this.generateStreakRiskContent(event);
      case 'security_alert':
        return this.generateSecurityAlertContent(event);
      case 'cicd_failure':
        return this.generateCicdFailureContent(event);
      case 'weekly_digest':
        return this.generateWeeklyDigestContent(event);
      default:
        throw new Error(`Unknown notification type: ${event.type}`);
    }
  }

  private generateStreakRiskContent(event: NotificationEvent): NotificationContent {
    const { currentStreak, daysUntilRisk } = event.data;
    
    return {
      subject: '🔥 GitFort: Your Streak is at Risk!',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Streak Risk Alert</h2>
          <p>Your current GitHub streak of <strong>${currentStreak} days</strong> is at risk!</p>
          <p>You have <strong>${daysUntilRisk} days</strong> remaining to maintain your streak.</p>
          <p>Don't let your hard work go to waste - make a commit today!</p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
        </div>
      `,
      textContent: `
        Streak Risk Alert
        
        Your current GitHub streak of ${currentStreak} days is at risk!
        You have ${daysUntilRisk} days remaining to maintain your streak.
        
        Don't let your hard work go to waste - make a commit today!
        
        View your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
      `
    };
  }

  private generateSecurityAlertContent(event: NotificationEvent): NotificationContent {
    const { repository, vulnerabilities, riskScore } = event.data;
    
    return {
      subject: '🚨 GitFort: Security Vulnerabilities Detected',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Security Alert</h2>
          <p>Security vulnerabilities detected in repository <strong>${repository}</strong></p>
          <p>Risk Score: <strong style="color: ${riskScore > 7 ? '#ef4444' : riskScore > 4 ? '#f59e0b' : '#10b981'}">${riskScore}/10</strong></p>
          <p>Vulnerabilities found: <strong>${vulnerabilities.length}</strong></p>
          <ul>
            ${vulnerabilities.slice(0, 3).map((vuln: any) => `<li>${vuln.type}: ${vuln.description}</li>`).join('')}
            ${vulnerabilities.length > 3 ? `<li>... and ${vulnerabilities.length - 3} more</li>` : ''}
          </ul>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Security Issues</a>
        </div>
      `,
      textContent: `
        Security Alert
        
        Security vulnerabilities detected in repository ${repository}
        Risk Score: ${riskScore}/10
        Vulnerabilities found: ${vulnerabilities.length}
        
        Review security issues: ${process.env.NEXTAUTH_URL}/dashboard
      `
    };
  }

  private generateCicdFailureContent(event: NotificationEvent): NotificationContent {
    const { repository, workflowName, failureReason } = event.data;
    
    return {
      subject: '❌ GitFort: CI/CD Pipeline Failed',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">CI/CD Failure</h2>
          <p>Pipeline failure in repository <strong>${repository}</strong></p>
          <p>Workflow: <strong>${workflowName}</strong></p>
          <p>Failure reason: <strong>${failureReason}</strong></p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View CI/CD Status</a>
        </div>
      `,
      textContent: `
        CI/CD Failure
        
        Pipeline failure in repository ${repository}
        Workflow: ${workflowName}
        Failure reason: ${failureReason}
        
        View CI/CD status: ${process.env.NEXTAUTH_URL}/dashboard
      `
    };
  }

  private generateWeeklyDigestContent(event: NotificationEvent): NotificationContent {
    const { stats } = event.data;
    
    return {
      subject: '📊 GitFort: Your Weekly Development Summary',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Weekly Development Summary</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>This Week's Activity</h3>
            <ul>
              <li>Commits: <strong>${stats.commits}</strong></li>
              <li>Repositories Active: <strong>${stats.activeRepos}</strong></li>
              <li>Current Streak: <strong>${stats.currentStreak} days</strong></li>
              <li>Security Scans: <strong>${stats.securityScans}</strong></li>
              <li>CI/CD Runs: <strong>${stats.cicdRuns}</strong></li>
            </ul>
          </div>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Dashboard</a>
        </div>
      `,
      textContent: `
        Weekly Development Summary
        
        This Week's Activity:
        - Commits: ${stats.commits}
        - Repositories Active: ${stats.activeRepos}
        - Current Streak: ${stats.currentStreak} days
        - Security Scans: ${stats.securityScans}
        - CI/CD Runs: ${stats.cicdRuns}
        
        View full dashboard: ${process.env.NEXTAUTH_URL}/dashboard
      `
    };
  }

  // Batch notification sending for efficiency
  async sendBatchNotifications(events: NotificationEvent[]): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      events.map(event => this.sendNotification(event))
    );

    const success = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    const failed = results.length - success;

    return { success, failed };
  }

  // Helper method to create notification events
  static createStreakRiskEvent(userId: string, currentStreak: number, daysUntilRisk: number): NotificationEvent {
    return {
      type: 'streak_risk',
      userId,
      data: { currentStreak, daysUntilRisk },
      timestamp: new Date()
    };
  }

  static createSecurityAlertEvent(userId: string, repository: string, vulnerabilities: any[], riskScore: number): NotificationEvent {
    return {
      type: 'security_alert',
      userId,
      data: { repository, vulnerabilities, riskScore },
      timestamp: new Date()
    };
  }

  static createCicdFailureEvent(userId: string, repository: string, workflowName: string, failureReason: string): NotificationEvent {
    return {
      type: 'cicd_failure',
      userId,
      data: { repository, workflowName, failureReason },
      timestamp: new Date()
    };
  }

  static createWeeklyDigestEvent(userId: string, stats: any): NotificationEvent {
    return {
      type: 'weekly_digest',
      userId,
      data: { stats },
      timestamp: new Date()
    };
  }
}