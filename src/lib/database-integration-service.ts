import { database } from './database';
import { User, IUser } from './models/user';
import { Repository, IRepository } from './models/repository';
import { Streak, IStreak } from './models/streak';
import { SecurityScan, ISecurityScan } from './models/security-scan';
import { WorkflowRun, IWorkflowRun } from './models/workflow-run';
import { NotificationPreference, INotificationPreference } from './models/notification-preference';

export interface UserDataSummary {
  user: IUser;
  repositories: IRepository[];
  streaks: IStreak[];
  securityScans: ISecurityScan[];
  workflowRuns: IWorkflowRun[];
  notificationPreferences: INotificationPreference | null;
  stats: {
    totalRepositories: number;
    totalSecurityScans: number;
    totalWorkflowRuns: number;
    currentStreak: number;
    longestStreak: number;
    lastActivity: Date | null;
  };
}

export class DatabaseIntegrationService {
  async ensureConnection(): Promise<void> {
    await database.connect();
  }

  async getUserDataSummary(githubId: number): Promise<UserDataSummary | null> {
    await this.ensureConnection();

    try {
      // Get user
      const user = await User.findOne({ githubId }).select('+accessToken');
      if (!user) {
        return null;
      }

      // Get all related data in parallel
      const [
        repositories,
        streaks,
        securityScans,
        workflowRuns,
        notificationPreferences
      ] = await Promise.all([
        Repository.find({ userId: user._id }).sort({ updatedAt: -1 }),
        Streak.find({ userId: user._id }).sort({ date: -1 }),
        SecurityScan.find({ userId: user._id }).sort({ scanDate: -1 }),
        WorkflowRun.find({ userId: user._id }).sort({ runDate: -1 }),
        NotificationPreference.findOne({ userId: user._id.toString() })
      ]);

      // Calculate stats
      const currentStreak = streaks.length > 0 ? streaks[0].currentStreak : 0;
      const longestStreak = Math.max(...streaks.map(s => s.longestStreak), 0);
      const lastActivity = repositories.length > 0 ? repositories[0].updatedAt : null;

      const stats = {
        totalRepositories: repositories.length,
        totalSecurityScans: securityScans.length,
        totalWorkflowRuns: workflowRuns.length,
        currentStreak,
        longestStreak,
        lastActivity
      };

      return {
        user,
        repositories,
        streaks,
        securityScans,
        workflowRuns,
        notificationPreferences,
        stats
      };
    } catch (error) {
      console.error('Error fetching user data summary:', error);
      throw new Error(`Failed to fetch user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async syncUserRepositories(userId: string, repositoriesData: any[]): Promise<IRepository[]> {
    await this.ensureConnection();

    try {
      const repositories: IRepository[] = [];

      for (const repoData of repositoriesData) {
        const repository = await Repository.findOneAndUpdate(
          { 
            userId,
            githubId: repoData.id 
          },
          {
            userId,
            githubId: repoData.id,
            name: repoData.name,
            fullName: repoData.full_name,
            description: repoData.description || '',
            url: repoData.html_url,
            language: repoData.language || 'Unknown',
            starCount: repoData.stargazers_count || 0,
            forkCount: repoData.forks_count || 0,
            isPrivate: repoData.private || false,
            isFork: repoData.fork || false,
            defaultBranch: repoData.default_branch || 'main',
            createdAt: new Date(repoData.created_at),
            updatedAt: new Date(repoData.updated_at || repoData.created_at)
          },
          { 
            upsert: true, 
            returnDocument: 'after',
            runValidators: true
          }
        );

        repositories.push(repository);
      }

      return repositories;
    } catch (error) {
      console.error('Error syncing repositories:', error);
      throw new Error(`Failed to sync repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveStreakData(userId: string, streakData: any): Promise<IStreak> {
    await this.ensureConnection();

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const streak = await Streak.findOneAndUpdate(
        { 
          userId,
          date: today
        },
        {
          userId,
          date: today,
          currentStreak: streakData.currentStreak || 0,
          longestStreak: streakData.longestStreak || 0,
          contributionCount: streakData.todayContributions || 0,
          isAtRisk: streakData.isAtRisk || false,
          riskLevel: streakData.riskLevel || 'none',
          lastContributionDate: streakData.lastContributionDate ? new Date(streakData.lastContributionDate) : null,
          contributionData: streakData.contributionData || []
        },
        { 
          upsert: true, 
          returnDocument: 'after',
          runValidators: true
        }
      );

      return streak;
    } catch (error) {
      console.error('Error saving streak data:', error);
      throw new Error(`Failed to save streak data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveSecurityScan(userId: string, repositoryId: string, scanData: any): Promise<ISecurityScan> {
    await this.ensureConnection();

    try {
      const securityScan = await SecurityScan.findOneAndUpdate(
        { 
          userId,
          repositoryId,
          scanDate: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
          }
        },
        {
          userId,
          repositoryId,
          scanDate: new Date(),
          riskScore: scanData.riskScore || 0,
          vulnerabilities: scanData.vulnerabilities || [],
          summary: {
            totalVulnerabilities: scanData.vulnerabilities?.length || 0,
            criticalCount: scanData.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0,
            highCount: scanData.vulnerabilities?.filter((v: any) => v.severity === 'high').length || 0,
            mediumCount: scanData.vulnerabilities?.filter((v: any) => v.severity === 'medium').length || 0,
            lowCount: scanData.vulnerabilities?.filter((v: any) => v.severity === 'low').length || 0
          }
        },
        { 
          upsert: true, 
          returnDocument: 'after',
          runValidators: true
        }
      );

      return securityScan;
    } catch (error) {
      console.error('Error saving security scan:', error);
      throw new Error(`Failed to save security scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveWorkflowRuns(userId: string, repositoryId: string, workflowRuns: any[]): Promise<IWorkflowRun[]> {
    await this.ensureConnection();

    try {
      const savedRuns: IWorkflowRun[] = [];

      for (const runData of workflowRuns) {
        const workflowRun = await WorkflowRun.findOneAndUpdate(
          { 
            userId,
            repositoryId,
            githubRunId: runData.id
          },
          {
            userId,
            repositoryId,
            githubRunId: runData.id,
            workflowName: runData.name || runData.workflow_name || 'Unknown',
            status: runData.status || 'unknown',
            conclusion: runData.conclusion || null,
            runDate: new Date(runData.created_at || runData.run_started_at || Date.now()),
            duration: runData.duration || null,
            branch: runData.head_branch || 'main',
            commitSha: runData.head_sha || '',
            triggeredBy: runData.triggering_actor?.login || 'unknown',
            url: runData.html_url || ''
          },
          { 
            upsert: true, 
            returnDocument: 'after',
            runValidators: true
          }
        );

        savedRuns.push(workflowRun);
      }

      return savedRuns;
    } catch (error) {
      console.error('Error saving workflow runs:', error);
      throw new Error(`Failed to save workflow runs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentActivity(userId: string, days: number = 30): Promise<{
    repositories: IRepository[];
    securityScans: ISecurityScan[];
    workflowRuns: IWorkflowRun[];
    streaks: IStreak[];
  }> {
    await this.ensureConnection();

    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [repositories, securityScans, workflowRuns, streaks] = await Promise.all([
        Repository.find({ 
          userId,
          updatedAt: { $gte: cutoffDate }
        }).sort({ updatedAt: -1 }).limit(20),
        
        SecurityScan.find({ 
          userId,
          scanDate: { $gte: cutoffDate }
        }).sort({ scanDate: -1 }).limit(50),
        
        WorkflowRun.find({ 
          userId,
          runDate: { $gte: cutoffDate }
        }).sort({ runDate: -1 }).limit(100),
        
        Streak.find({ 
          userId,
          date: { $gte: cutoffDate }
        }).sort({ date: -1 }).limit(days)
      ]);

      return {
        repositories,
        securityScans,
        workflowRuns,
        streaks
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw new Error(`Failed to fetch recent activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cleanupOldData(userId: string, retentionDays: number = 90): Promise<{
    deletedSecurityScans: number;
    deletedWorkflowRuns: number;
    deletedStreaks: number;
  }> {
    await this.ensureConnection();

    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const [securityResult, workflowResult, streakResult] = await Promise.all([
        SecurityScan.deleteMany({ 
          userId,
          scanDate: { $lt: cutoffDate }
        }),
        
        WorkflowRun.deleteMany({ 
          userId,
          runDate: { $lt: cutoffDate }
        }),
        
        Streak.deleteMany({ 
          userId,
          date: { $lt: cutoffDate }
        })
      ]);

      return {
        deletedSecurityScans: securityResult.deletedCount || 0,
        deletedWorkflowRuns: workflowResult.deletedCount || 0,
        deletedStreaks: streakResult.deletedCount || 0
      };
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw new Error(`Failed to cleanup old data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserStats(userId: string): Promise<{
    totalRepositories: number;
    activeRepositories: number;
    totalSecurityScans: number;
    recentSecurityScans: number;
    totalWorkflowRuns: number;
    recentWorkflowRuns: number;
    currentStreak: number;
    longestStreak: number;
    averageRiskScore: number;
    workflowSuccessRate: number;
  }> {
    await this.ensureConnection();

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalRepositories,
        activeRepositories,
        totalSecurityScans,
        recentSecurityScans,
        totalWorkflowRuns,
        recentWorkflowRuns,
        latestStreak,
        avgRiskScore,
        successfulRuns
      ] = await Promise.all([
        Repository.countDocuments({ userId }),
        Repository.countDocuments({ userId, updatedAt: { $gte: thirtyDaysAgo } }),
        SecurityScan.countDocuments({ userId }),
        SecurityScan.countDocuments({ userId, scanDate: { $gte: thirtyDaysAgo } }),
        WorkflowRun.countDocuments({ userId }),
        WorkflowRun.countDocuments({ userId, runDate: { $gte: thirtyDaysAgo } }),
        Streak.findOne({ userId }).sort({ date: -1 }),
        SecurityScan.aggregate([
          { $match: { userId } },
          { $group: { _id: null, avgRisk: { $avg: '$riskScore' } } }
        ]),
        WorkflowRun.countDocuments({ userId, conclusion: 'success' })
      ]);

      const currentStreak = latestStreak?.currentStreak || 0;
      const longestStreak = latestStreak?.longestStreak || 0;
      const averageRiskScore = avgRiskScore[0]?.avgRisk || 0;
      const workflowSuccessRate = totalWorkflowRuns > 0 ? (successfulRuns / totalWorkflowRuns) * 100 : 0;

      return {
        totalRepositories,
        activeRepositories,
        totalSecurityScans,
        recentSecurityScans,
        totalWorkflowRuns,
        recentWorkflowRuns,
        currentStreak,
        longestStreak,
        averageRiskScore: Math.round(averageRiskScore * 100) / 100,
        workflowSuccessRate: Math.round(workflowSuccessRate * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error(`Failed to fetch user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateDataIntegrity(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    await this.ensureConnection();

    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check if user exists
      const user = await User.findOne({ githubId: parseInt(userId) });
      if (!user) {
        issues.push('User not found in database');
        return { isValid: false, issues, recommendations };
      }

      // Check for orphaned records
      const [orphanedRepos, orphanedScans, orphanedRuns, orphanedStreaks] = await Promise.all([
        Repository.countDocuments({ userId, $expr: { $ne: [{ $toObjectId: '$userId' }, user._id] } }),
        SecurityScan.countDocuments({ userId, $expr: { $ne: [{ $toObjectId: '$userId' }, user._id] } }),
        WorkflowRun.countDocuments({ userId, $expr: { $ne: [{ $toObjectId: '$userId' }, user._id] } }),
        Streak.countDocuments({ userId, $expr: { $ne: [{ $toObjectId: '$userId' }, user._id] } })
      ]);

      if (orphanedRepos > 0) {
        issues.push(`Found ${orphanedRepos} orphaned repositories`);
        recommendations.push('Clean up orphaned repository records');
      }

      if (orphanedScans > 0) {
        issues.push(`Found ${orphanedScans} orphaned security scans`);
        recommendations.push('Clean up orphaned security scan records');
      }

      if (orphanedRuns > 0) {
        issues.push(`Found ${orphanedRuns} orphaned workflow runs`);
        recommendations.push('Clean up orphaned workflow run records');
      }

      if (orphanedStreaks > 0) {
        issues.push(`Found ${orphanedStreaks} orphaned streak records`);
        recommendations.push('Clean up orphaned streak records');
      }

      // Check for missing notification preferences
      const notificationPrefs = await NotificationPreference.findOne({ userId: user._id.toString() });
      if (!notificationPrefs) {
        issues.push('Missing notification preferences');
        recommendations.push('Create default notification preferences');
      }

      // Check for stale data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const staleScans = await SecurityScan.countDocuments({ 
        userId: user._id.toString(),
        scanDate: { $lt: thirtyDaysAgo }
      });

      if (staleScans > 100) {
        recommendations.push('Consider cleaning up old security scan data');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error validating data integrity:', error);
      return {
        isValid: false,
        issues: ['Failed to validate data integrity'],
        recommendations: ['Check database connection and try again']
      };
    }
  }
}

export const databaseIntegrationService = new DatabaseIntegrationService();