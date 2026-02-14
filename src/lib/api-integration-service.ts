import { GitHubAPIClient } from './github-api-client';
import { StreakCalculator } from './streak-calculator';
import { SecurityScanner } from './security-scanner';
import { WorkflowTrackingService } from './workflow-tracking-service';
import { WorkflowDataFetcher } from './workflow-fetcher';
import { AnalyticsProcessor } from './analytics-processor';
import { NotificationService } from './notification-service';
import { getUserWithDecryptedToken } from './session-manager';

export interface IntegratedUserData {
  profile: any;
  repositories: any[];
  contributions: any[];
  streakData: any;
  securityFindings: any[];
  workflowMetrics: any;
  analytics: any;
}

export class APIIntegrationService {
  private githubClient: GitHubAPIClient;
  private streakCalculator: StreakCalculator;
  private securityScanner: SecurityScanner;
  private workflowService: WorkflowTrackingService;
  private analyticsProcessor: AnalyticsProcessor;
  private notificationService: NotificationService;

  constructor() {
    this.githubClient = new GitHubAPIClient();
    this.streakCalculator = new StreakCalculator();
    this.securityScanner = new SecurityScanner(this.githubClient);
    const workflowFetcher = new WorkflowDataFetcher(this.githubClient);
    this.workflowService = new WorkflowTrackingService(workflowFetcher);
    this.analyticsProcessor = new AnalyticsProcessor(this.githubClient);
    this.notificationService = new NotificationService();
  }

  async getIntegratedUserData(githubId: number): Promise<IntegratedUserData> {
    // Get user with decrypted token
    const userWithToken = await getUserWithDecryptedToken(githubId);
    if (!userWithToken) {
      throw new Error('User not found or invalid token');
    }

    const { user } = userWithToken;
    const username = user.username;

    try {
      // Fetch all data in parallel where possible
      const [
        profile,
        repositories,
        contributions,
        contributionYears
      ] = await Promise.all([
        this.githubClient.getUserProfile(username),
        this.githubClient.getRepositories(username),
        this.githubClient.getContributionsForStreak(username, 365),
        this.githubClient.getContributionYears(username)
      ]);

      // Calculate streak data
      const streakData = this.streakCalculator.getStreakStatistics(contributions);

      // Get security findings for repositories (limit to top 10 for performance)
      const topRepos = repositories.slice(0, 10);
      const securityPromises = topRepos.map(async (repo) => {
        try {
          return await this.securityScanner.scanRepository(repo.owner.login, repo.name);
        } catch (error) {
          console.error(`Security scan failed for ${repo.full_name}:`, error);
          return null;
        }
      });

      const securityResults = await Promise.allSettled(securityPromises);
      const securityFindings = securityResults
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      // Get workflow metrics for repositories with CI/CD
      const workflowPromises = topRepos.map(async (repo) => {
        try {
          const runs = await this.githubClient.getWorkflowRuns(repo.owner.login, repo.name);
          return await this.workflowService.calculateWorkflowMetrics(repo.owner.login, repo.name);
        } catch (error) {
          console.error(`Workflow fetch failed for ${repo.full_name}:`, error);
          return null;
        }
      });

      const workflowResults = await Promise.allSettled(workflowPromises);
      const workflowMetrics = workflowResults
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      // Process analytics data
      const repositoryStats = repositories.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        language: repo.language || 'Unknown',
        starCount: repo.stargazers_count,
        forkCount: repo.forks_count,
        commits: 0, // This would need to be fetched separately
        lastCommitDate: new Date(repo.updated_at),
        activityScore: 0
      }));

      const [commitFrequency, languageUsage, repositoryActivity, heatmap] = await Promise.all([
        this.analyticsProcessor.processCommitFrequency(profile.user.login, repositoryStats),
        this.analyticsProcessor.processLanguageUsage(repositories.map(repo => ({
          owner: repo.owner.login,
          name: repo.name
        }))),
        this.analyticsProcessor.processRepositoryActivity(profile.user.login, repositoryStats),
        this.analyticsProcessor.generateContributionHeatmap(profile.user.login)
      ]);

      const analytics = {
        commitFrequency,
        languageUsage,
        repositoryActivity,
        heatmap
      };

      return {
        profile: profile.user,
        repositories,
        contributions,
        streakData,
        securityFindings,
        workflowMetrics: workflowMetrics.filter(m => m !== null),
        analytics
      };
    } catch (error) {
      console.error('Error fetching integrated user data:', error);
      throw new Error(`Failed to fetch user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refreshUserData(githubId: number, components: string[] = ['all']): Promise<Partial<IntegratedUserData>> {
    const userWithToken = await getUserWithDecryptedToken(githubId);
    if (!userWithToken) {
      throw new Error('User not found or invalid token');
    }

    const { user } = userWithToken;
    const username = user.username;
    const result: Partial<IntegratedUserData> = {};

    try {
      if (components.includes('all') || components.includes('profile')) {
        // Invalidate cache and fetch fresh profile
        this.githubClient.invalidateUserCache(username);
        result.profile = (await this.githubClient.getUserProfile(username)).user;
      }

      if (components.includes('all') || components.includes('repositories')) {
        // Invalidate cache and fetch fresh repositories
        this.githubClient.invalidateRepositoryCache(username);
        result.repositories = await this.githubClient.getRepositories(username);
      }

      if (components.includes('all') || components.includes('contributions')) {
        // Invalidate cache and fetch fresh contributions
        this.githubClient.invalidateContributionsCache(username);
        result.contributions = await this.githubClient.getContributionsForStreak(username, 365);
        
        if (result.contributions) {
          result.streakData = this.streakCalculator.getStreakStatistics(result.contributions);
        }
      }

      if (components.includes('all') || components.includes('security')) {
        const repositories = result.repositories || await this.githubClient.getRepositories(username);
        const topRepos = repositories.slice(0, 10);
        
        const securityPromises = topRepos.map(async (repo) => {
          try {
            return await this.securityScanner.scanRepository(repo.owner.login, repo.name);
          } catch (error) {
            console.error(`Security scan failed for ${repo.full_name}:`, error);
            return null;
          }
        });

        const securityResults = await Promise.allSettled(securityPromises);
        result.securityFindings = securityResults
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => (result as PromiseFulfilledResult<any>).value);
      }

      if (components.includes('all') || components.includes('workflows')) {
        const repositories = result.repositories || await this.githubClient.getRepositories(username);
        const topRepos = repositories.slice(0, 10);
        
        const workflowPromises = topRepos.map(async (repo) => {
          try {
            const runs = await this.githubClient.getWorkflowRuns(repo.owner.login, repo.name);
            return await this.workflowService.calculateWorkflowMetrics(repo.owner.login, repo.name);
          } catch (error) {
            console.error(`Workflow fetch failed for ${repo.full_name}:`, error);
            return null;
          }
        });

        const workflowResults = await Promise.allSettled(workflowPromises);
        result.workflowMetrics = workflowResults
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => (result as PromiseFulfilledResult<any>).value);
      }

      if (components.includes('all') || components.includes('analytics')) {
        const profile = result.profile || (await this.githubClient.getUserProfile(username)).user;
        const repositories = result.repositories || await this.githubClient.getRepositories(username);
        const contributions = result.contributions || await this.githubClient.getContributionsForStreak(username, 365);
        const workflowMetrics = result.workflowMetrics || [];

        const repositoryStats = repositories.map(repo => ({
          name: repo.name,
          fullName: repo.full_name,
          language: repo.language || 'Unknown',
          starCount: repo.stargazers_count,
          forkCount: repo.forks_count,
          commits: 0,
          lastCommitDate: new Date(repo.updated_at),
          activityScore: 0
        }));

        const [commitFrequency, languageUsage, repositoryActivity, heatmap] = await Promise.all([
          this.analyticsProcessor.processCommitFrequency(profile.login, repositoryStats),
          this.analyticsProcessor.processLanguageUsage(repositories.map(repo => ({
            owner: repo.owner.login,
            name: repo.name
          }))),
          this.analyticsProcessor.processRepositoryActivity(profile.login, repositoryStats),
          this.analyticsProcessor.generateContributionHeatmap(profile.login)
        ]);

        result.analytics = {
          commitFrequency,
          languageUsage,
          repositoryActivity,
          heatmap
        };
      }

      return result;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw new Error(`Failed to refresh user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendNotificationForEvent(githubId: number, eventType: string, eventData: any): Promise<boolean> {
    try {
      const event = {
        type: eventType as any,
        userId: githubId.toString(),
        data: eventData,
        timestamp: new Date()
      };

      return await this.notificationService.sendNotification(event);
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async checkStreakRisk(githubId: number): Promise<{ isAtRisk: boolean; riskLevel?: string; hoursUntilBreak?: number }> {
    try {
      const userWithToken = await getUserWithDecryptedToken(githubId);
      if (!userWithToken) {
        return { isAtRisk: false };
      }

      const { user } = userWithToken;
      const contributions = await this.githubClient.getContributionsForStreak(user.username, 30);
      const streakData = this.streakCalculator.getStreakStatistics(contributions);

      // Check if streak is at risk (no contribution in last 20+ hours)
      const lastContribution = contributions
        .filter(c => c.contributionCount > 0)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (!lastContribution) {
        return { isAtRisk: true, riskLevel: 'critical', hoursUntilBreak: 4 };
      }

      const lastContribDate = new Date(lastContribution.date);
      const now = new Date();
      const hoursSinceLastContrib = (now.getTime() - lastContribDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastContrib > 20) {
        const hoursUntilBreak = Math.max(0, 24 - hoursSinceLastContrib);
        const riskLevel = hoursUntilBreak < 4 ? 'critical' : hoursUntilBreak < 8 ? 'danger' : 'warning';
        
        return { 
          isAtRisk: true, 
          riskLevel, 
          hoursUntilBreak: Math.round(hoursUntilBreak) 
        };
      }

      return { isAtRisk: false };
    } catch (error) {
      console.error('Error checking streak risk:', error);
      return { isAtRisk: false };
    }
  }

  async getAPIStatus(): Promise<{
    github: { connected: boolean; rateLimit?: any; queueStatus?: any };
    cache: any;
    services: { [key: string]: boolean };
  }> {
    try {
      const [rateLimitStatus, queueStatus, cacheStats] = await Promise.all([
        this.githubClient.getRateLimitStatus(),
        this.githubClient.getQueueStatus(),
        this.githubClient.getCacheStats()
      ]);

      return {
        github: {
          connected: true,
          rateLimit: rateLimitStatus,
          queueStatus
        },
        cache: cacheStats,
        services: {
          streakCalculator: true,
          securityScanner: true,
          workflowService: true,
          analyticsProcessor: true,
          notificationService: true
        }
      };
    } catch (error) {
      console.error('Error getting API status:', error);
      return {
        github: { connected: false },
        cache: null,
        services: {
          streakCalculator: false,
          securityScanner: false,
          workflowService: false,
          analyticsProcessor: false,
          notificationService: false
        }
      };
    }
  }

  async clearAllCaches(): Promise<void> {
    this.githubClient.clearCache();
  }

  async invalidateUserCaches(username: string): Promise<void> {
    this.githubClient.invalidateUserCache(username);
    this.githubClient.invalidateContributionsCache(username);
    this.githubClient.invalidateRepositoryCache(username);
  }

  destroy(): void {
    this.githubClient.destroy();
  }
}

export const apiIntegrationService = new APIIntegrationService();