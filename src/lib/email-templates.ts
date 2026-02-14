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

export interface SecurityAlertTemplateData {
  username: string
  repository: string
  vulnerabilities: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    file: string
  }>
  riskScore: number
  scanDate: Date
}

export interface CicdFailureTemplateData {
  username: string
  repository: string
  workflowName: string
  failureReason: string
  failureTime: Date
  buildUrl: string
}

export interface WeeklyDigestTemplateData {
  username: string
  weekStart: Date
  weekEnd: Date
  stats: {
    commits: number
    activeRepos: number
    currentStreak: number
    securityScans: number
    cicdRuns: number
    successRate: number
  }
  topRepositories: Array<{
    name: string
    commits: number
    language: string
  }>
}

export class EmailTemplates {
  // Base email styling
  private static getBaseStyles(): string {
    return `
      <style>
        .email-container { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
        .content-card { background: #f9fafb; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e5e7eb; }
        .alert-card { padding: 20px; border-radius: 8px; margin: 15px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .danger { background: #fee2e2; border-left: 4px solid #ef4444; }
        .critical { background: #fecaca; border-left: 4px solid #dc2626; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; }
        .info { background: #dbeafe; border-left: 4px solid #3b82f6; }
        .btn { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; }
        .btn-danger { background: #ef4444; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-item { background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    `;
  }

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

  static getSecurityAlertTemplate(data: SecurityAlertTemplateData): EmailTemplate {
    const { username, repository, vulnerabilities, riskScore, scanDate } = data;
    const riskColor = riskScore > 7 ? '#ef4444' : riskScore > 4 ? '#f59e0b' : '#10b981';
    const riskLevel = riskScore > 7 ? 'High' : riskScore > 4 ? 'Medium' : 'Low';
    
    const subject = `🚨 GitFort Security Alert: ${vulnerabilities.length} vulnerabilities in ${repository}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert</title>
          ${this.getBaseStyles()}
        </head>
        <body class="email-container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🚨 Security Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Vulnerabilities detected in your repository</p>
          </div>
          
          <div class="content-card">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${username}!</h2>
            <p>Our security scanner has detected vulnerabilities in your repository <strong>${repository}</strong>.</p>
            
            <div class="alert-card ${riskScore > 7 ? 'critical' : riskScore > 4 ? 'danger' : 'warning'}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-weight: bold;">Risk Score</span>
                <span style="font-size: 24px; font-weight: bold; color: ${riskColor};">${riskScore}/10</span>
              </div>
              <p><strong>Risk Level:</strong> ${riskLevel}</p>
              <p><strong>Vulnerabilities Found:</strong> ${vulnerabilities.length}</p>
              <p><strong>Scan Date:</strong> ${scanDate.toLocaleDateString()}</p>
            </div>
            
            <h3>Detected Vulnerabilities:</h3>
            ${vulnerabilities.slice(0, 5).map(vuln => `
              <div class="alert-card info" style="margin: 10px 0;">
                <strong>${vuln.type}</strong> (${vuln.severity.toUpperCase()})
                <br><em>${vuln.file}</em>
                <br>${vuln.description}
              </div>
            `).join('')}
            ${vulnerabilities.length > 5 ? `<p><em>... and ${vulnerabilities.length - 5} more vulnerabilities</em></p>` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn btn-danger">Review Security Issues</a>
          </div>
          
          <div class="footer">
            <p>This alert was generated by GitFort Security Scanner.</p>
            <p>Please address these vulnerabilities promptly to secure your code.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Security Alert - GitFort

Hello ${username}!

Our security scanner has detected vulnerabilities in your repository ${repository}.

Risk Score: ${riskScore}/10 (${riskLevel})
Vulnerabilities Found: ${vulnerabilities.length}
Scan Date: ${scanDate.toLocaleDateString()}

Detected Vulnerabilities:
${vulnerabilities.slice(0, 5).map(vuln => `- ${vuln.type} (${vuln.severity.toUpperCase()}) in ${vuln.file}: ${vuln.description}`).join('\n')}
${vulnerabilities.length > 5 ? `... and ${vulnerabilities.length - 5} more vulnerabilities` : ''}

Review security issues: ${process.env.NEXTAUTH_URL}/dashboard

This alert was generated by GitFort Security Scanner.
Please address these vulnerabilities promptly to secure your code.
    `.trim();

    return { subject, html, text };
  }

  static getCicdFailureTemplate(data: CicdFailureTemplateData): EmailTemplate {
    const { username, repository, workflowName, failureReason, failureTime, buildUrl } = data;
    
    const subject = `❌ GitFort CI/CD Alert: ${workflowName} failed in ${repository}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CI/CD Failure Alert</title>
          ${this.getBaseStyles()}
        </head>
        <body class="email-container">
          <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <h1 style="margin: 0; font-size: 28px;">❌ CI/CD Failure</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Pipeline failure detected</p>
          </div>
          
          <div class="content-card">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${username}!</h2>
            <p>A CI/CD pipeline has failed in your repository.</p>
            
            <div class="alert-card danger">
              <h3 style="margin-top: 0; color: #ef4444;">Failure Details</h3>
              <p><strong>Repository:</strong> ${repository}</p>
              <p><strong>Workflow:</strong> ${workflowName}</p>
              <p><strong>Failure Time:</strong> ${failureTime.toLocaleString()}</p>
              <p><strong>Reason:</strong> ${failureReason}</p>
            </div>
            
            <div class="alert-card info">
              <h4>Common Solutions:</h4>
              <ul>
                <li>Check the build logs for specific error messages</li>
                <li>Verify all dependencies are properly installed</li>
                <li>Ensure environment variables are correctly configured</li>
                <li>Review recent code changes that might have caused the failure</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${buildUrl}" class="btn btn-danger" style="margin-right: 10px;">View Build Logs</a>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn">Dashboard</a>
          </div>
          
          <div class="footer">
            <p>This alert was generated by GitFort CI/CD Monitor.</p>
            <p>Fix the issue to get your pipeline back on track!</p>
          </div>
        </body>
      </html>
    `;

    const text = `
CI/CD Failure Alert - GitFort

Hello ${username}!

A CI/CD pipeline has failed in your repository.

Failure Details:
- Repository: ${repository}
- Workflow: ${workflowName}
- Failure Time: ${failureTime.toLocaleString()}
- Reason: ${failureReason}

Common Solutions:
- Check the build logs for specific error messages
- Verify all dependencies are properly installed
- Ensure environment variables are correctly configured
- Review recent code changes that might have caused the failure

View build logs: ${buildUrl}
Dashboard: ${process.env.NEXTAUTH_URL}/dashboard

This alert was generated by GitFort CI/CD Monitor.
Fix the issue to get your pipeline back on track!
    `.trim();

    return { subject, html, text };
  }

  static getWeeklyDigestTemplate(data: WeeklyDigestTemplateData): EmailTemplate {
    const { username, weekStart, weekEnd, stats, topRepositories } = data;
    
    const subject = `📊 GitFort Weekly Digest: Your development summary for ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Development Digest</title>
          ${this.getBaseStyles()}
        </head>
        <body class="email-container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📊 Weekly Digest</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}</p>
          </div>
          
          <div class="content-card">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${username}!</h2>
            <p>Here's your development activity summary for this week.</p>
            
            <div class="stats-grid">
              <div class="stat-item">
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.commits}</div>
                <div style="color: #6b7280;">Commits</div>
              </div>
              <div class="stat-item">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${stats.activeRepos}</div>
                <div style="color: #6b7280;">Active Repos</div>
              </div>
              <div class="stat-item">
                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.currentStreak}</div>
                <div style="color: #6b7280;">Day Streak</div>
              </div>
              <div class="stat-item">
                <div style="font-size: 24px; font-weight: bold; color: ${stats.successRate > 80 ? '#10b981' : stats.successRate > 60 ? '#f59e0b' : '#ef4444'};">${stats.successRate}%</div>
                <div style="color: #6b7280;">Success Rate</div>
              </div>
            </div>
            
            <div class="alert-card success">
              <h3 style="margin-top: 0;">Additional Stats</h3>
              <p><strong>Security Scans:</strong> ${stats.securityScans}</p>
              <p><strong>CI/CD Runs:</strong> ${stats.cicdRuns}</p>
            </div>
            
            ${topRepositories.length > 0 ? `
              <h3>Most Active Repositories</h3>
              ${topRepositories.map(repo => `
                <div class="alert-card info" style="margin: 10px 0;">
                  <strong>${repo.name}</strong> (${repo.language})
                  <br>${repo.commits} commits this week
                </div>
              `).join('')}
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn">View Full Dashboard</a>
          </div>
          
          <div class="footer">
            <p>Keep up the great work! 🚀</p>
            <p>This digest was generated by GitFort Analytics.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Weekly Development Digest - GitFort
${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}

Hello ${username}!

Here's your development activity summary for this week.

Weekly Stats:
- Commits: ${stats.commits}
- Active Repositories: ${stats.activeRepos}
- Current Streak: ${stats.currentStreak} days
- CI/CD Success Rate: ${stats.successRate}%
- Security Scans: ${stats.securityScans}
- CI/CD Runs: ${stats.cicdRuns}

${topRepositories.length > 0 ? `
Most Active Repositories:
${topRepositories.map(repo => `- ${repo.name} (${repo.language}): ${repo.commits} commits`).join('\n')}
` : ''}

View full dashboard: ${process.env.NEXTAUTH_URL}/dashboard

Keep up the great work! 🚀
This digest was generated by GitFort Analytics.
    `.trim();

    return { subject, html, text };
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