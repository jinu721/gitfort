export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface StreakRiskTemplateData {
  username: string
  currentStreak: number
  daysSinceLastContribution: number
  riskLevel: 'warning' | 'danger' | 'critical'
  hoursUntilBreak: number
}

export class EmailTemplates {
  static getStreakRiskTemplate(data: StreakRiskTemplateData): EmailTemplate {
    const { username, currentStreak, daysSinceLastContribution, riskLevel, hoursUntilBreak } = data
    
    const riskColor = this.getRiskColor(riskLevel)
    const urgencyMessage = this.getUrgencyMessage(riskLevel, hoursUntilBreak)
    const subject = this.getStreakRiskSubject(data)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>GitHub Streak Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">GitHub Streak Alert</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your contribution streak needs attention</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0;">Hello ${username}!</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">Your GitHub contribution streak is currently at risk.</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid ${riskColor};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-weight: bold; font-size: 18px;">Current Streak</span>
                <span style="font-size: 24px; font-weight: bold; color: ${riskColor};">${currentStreak} days</span>
              </div>
              
              <div style="margin-bottom: 10px;">
                <strong>Days since last contribution:</strong> ${daysSinceLastContribution}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>Risk Level:</strong> 
                <span style="color: ${riskColor}; font-weight: bold; text-transform: uppercase;">${riskLevel}</span>
              </div>
              
              <div style="background: ${riskColor}15; padding: 15px; border-radius: 4px; border: 1px solid ${riskColor}30;">
                <strong>${urgencyMessage}</strong>
              </div>
            </div>
          </div>
          
          <div style="background: #e6fffa; padding: 20px; border-radius: 8px; border: 1px solid #38b2ac; margin-bottom: 25px;">
            <h3 style="color: #2d3748; margin-top: 0;">Quick Actions</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Make a commit to any repository</li>
              <li style="margin-bottom: 8px;">Create or update a GitHub issue</li>
              <li style="margin-bottom: 8px;">Submit a pull request</li>
              <li style="margin-bottom: 8px;">Review and comment on code</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://github.com" style="background: #2d3748; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to GitHub</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 14px;">
            <p>This notification was sent by your GitHub Control Center.</p>
            <p>Keep coding and maintain your streak!</p>
          </div>
        </body>
      </html>
    `

    const text = `
GitHub Streak Alert

Hello ${username}!

Your GitHub contribution streak is currently at risk.

Current Streak: ${currentStreak} days
Days since last contribution: ${daysSinceLastContribution}
Risk Level: ${riskLevel.toUpperCase()}

${urgencyMessage}

Quick Actions to maintain your streak:
- Make a commit to any repository
- Create or update a GitHub issue
- Submit a pull request
- Review and comment on code

Visit GitHub: https://github.com

This notification was sent by your GitHub Control Center.
Keep coding and maintain your streak!
    `.trim()

    return { subject, html, text }
  }

  private static getStreakRiskSubject(data: StreakRiskTemplateData): string {
    const { riskLevel, currentStreak } = data
    
    switch (riskLevel) {
      case 'warning':
        return `GitHub Streak Alert: ${currentStreak}-day streak needs attention`
      case 'danger':
        return `GitHub Streak Warning: ${currentStreak}-day streak at risk`
      case 'critical':
        return `GitHub Streak URGENT: ${currentStreak}-day streak ending soon`
      default:
        return `GitHub Streak Notification: ${currentStreak}-day streak update`
    }
  }

  private static getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'warning':
        return '#f59e0b'
      case 'danger':
        return '#ef4444'
      case 'critical':
        return '#dc2626'
      default:
        return '#6b7280'
    }
  }

  private static getUrgencyMessage(riskLevel: string, hoursUntilBreak: number): string {
    switch (riskLevel) {
      case 'warning':
        return `You have approximately ${hoursUntilBreak} hours to make a contribution and maintain your streak.`
      case 'danger':
        return `Your streak is at risk! You have about ${hoursUntilBreak} hours remaining to contribute.`
      case 'critical':
        return `URGENT: Your streak will break in approximately ${hoursUntilBreak} hours without a contribution!`
      default:
        return `Please make a contribution soon to maintain your streak.`
    }
  }
}