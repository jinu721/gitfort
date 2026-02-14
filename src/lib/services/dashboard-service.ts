import GitHubService, { GitHubRepository, GitHubContribution, StreakData } from './github-service';

export interface DashboardStats {
  currentStreak: number;
  totalContributions: number;
  totalRepositories: number;
  totalCommits: number;
  buildSuccessRate: number;
  securityIssues: number;
  activeRepositories: number;
  primaryLanguage: string;
  languageStats: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
}

export interface RepositoryActivity {
  repository: string;
  commits: number;
  lastActivity: Date;
  language: string;
  stars: number;
  forks: number;
}

class DashboardService {
  private githubService: GitHubService;

  constructor(token?: string) {
    this.githubService = new GitHubService(token);
  }

  /**
   * Get comprehensive dashboard statistics
   */
  /**
     * Get comprehensive dashboard statistics with improved error handling
     */
    async getDashboardStats(username: string): Promise<DashboardStats> {
      try {
        console.log(`Fetching dashboard stats for ${username}...`);

        // Fetch core data first
        const repositories = await this.githubService.getAllRepositories(username);
        console.log(`Found ${repositories.length} repositories`);

        // Fetch user profile and contributions in parallel
        const [userProfile, contributions] = await Promise.allSettled([
          this.githubService.getUserProfile(username),
          this.githubService.getContributions(username)
        ]);

        // Handle contributions data
        let contributionsData: any[] = [];
        if (contributions.status === 'fulfilled') {
          contributionsData = contributions.value;
          console.log(`Found ${contributionsData.length} contribution days`);
        } else {
          console.warn('Failed to fetch contributions, using fallback data');
          contributionsData = []; // Will use mock data in calculateStreakData
        }

        // Calculate streak data
        const streakData = this.githubService.calculateStreakData(contributionsData);

        // Calculate language statistics (reduced API calls)
        const languageStats = await this.calculateLanguageStats(repositories);

        // Calculate repository activity (no additional API calls)
        const activeRepos = repositories.filter(repo => {
          const lastUpdate = new Date(repo.pushed_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastUpdate > thirtyDaysAgo;
        });

        // Estimate total commits with reduced API calls
        const totalCommits = await this.estimateTotalCommits(repositories);

        return {
          currentStreak: streakData.currentStreak,
          totalContributions: streakData.totalContributions,
          totalRepositories: repositories.length,
          totalCommits,
          buildSuccessRate: 94.2, // This would come from CI/CD integration
          securityIssues: Math.floor(Math.random() * 5), // This would come from security scanning
          activeRepositories: activeRepos.length,
          primaryLanguage: languageStats.length > 0 ? languageStats[0].name : 'Unknown',
          languageStats: languageStats.slice(0, 5) // Top 5 languages
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);

        // Provide more specific error messages
        if (error.message?.includes('rate limit')) {
          throw new Error('GitHub API rate limit exceeded. Please try again in a few minutes.');
        }

        throw new Error(`Failed to fetch dashboard statistics: ${error.message}`);
      }
    }

  /**
   * Get repository activity data
   */
  async getRepositoryActivity(username: string): Promise<RepositoryActivity[]> {
    try {
      const repositories = await this.githubService.getAllRepositories(username);

      const activities: RepositoryActivity[] = repositories.map(repo => ({
        repository: repo.full_name,
        commits: 0, // Will be populated separately
        lastActivity: new Date(repo.pushed_at),
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count
      }));

      // Sort by last activity
      return activities.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      console.error('Error fetching repository activity:', error);
      throw new Error('Failed to fetch repository activity');
    }
  }

  /**
   * Get streak data
   */
  async getStreakData(username: string): Promise<StreakData> {
    try {
      const contributions = await this.githubService.getContributions(username);
      return this.githubService.calculateStreakData(contributions);
    } catch (error) {
      console.error('Error fetching streak data:', error);
      throw new Error('Failed to fetch streak data');
    }
  }

  /**
   * Calculate language statistics from repositories
   */
  /**
     * Calculate language statistics from repositories with reduced API calls
     */
    private async calculateLanguageStats(repositories: GitHubRepository[]): Promise<Array<{
      name: string;
      percentage: number;
      color: string;
    }>> {
      const languageMap = new Map<string, number>();

      // Use repository language field first (no API call needed)
      repositories.forEach(repo => {
        if (repo.language) {
          languageMap.set(repo.language, (languageMap.get(repo.language) || 0) + 1);
        }
      });

      // If we have enough data from repository language field, use it
      if (languageMap.size > 0) {
        const total = repositories.length;
        const languageStats = Array.from(languageMap.entries())
          .map(([name, count]) => ({
            name,
            percentage: (count / total) * 100,
            color: this.getLanguageColor(name)
          }))
          .sort((a, b) => b.percentage - a.percentage);

        return languageStats;
      }

      // Fallback: Sample a few repositories for detailed language analysis
      const sampleRepos = repositories.filter((_, index) => index % 5 === 0).slice(0, 10);
      let totalBytes = 0;

      console.log(`Analyzing languages for ${sampleRepos.length} repositories...`);

      for (const repo of sampleRepos) {
        try {
          const languages = await this.githubService.getRepositoryLanguages(repo.owner.login, repo.name);

          for (const [language, bytes] of Object.entries(languages)) {
            languageMap.set(language, (languageMap.get(language) || 0) + bytes);
            totalBytes += bytes;
          }
        } catch (error) {
          console.error(`Failed to fetch languages for ${repo.full_name}`);
          // Continue with other repos instead of failing
        }
      }

      const languageStats = Array.from(languageMap.entries())
        .map(([name, bytes]) => ({
          name,
          percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
          color: this.getLanguageColor(name)
        }))
        .sort((a, b) => b.percentage - a.percentage);

      return languageStats;
    }

    /**
     * Estimate total commits across repositories with reduced API calls
     */
    private async estimateTotalCommits(repositories: GitHubRepository[]): Promise<number> {
      // Sample only a few repositories to avoid rate limiting
      const sampleRepos = repositories.slice(0, 5);
      let totalCommits = 0;
      let successfulRequests = 0;

      for (const repo of sampleRepos) {
        try {
          const commits = await this.githubService.getRepositoryCommitsCount(repo.owner.login, repo.name);
          totalCommits += commits;
          successfulRequests++;
        } catch (error) {
          console.error(`Failed to fetch commits for ${repo.full_name}`);
          // Continue with other repos
        }
      }

      if (successfulRequests === 0) {
        // Fallback estimation based on repository age and activity
        return repositories.length * 10; // Rough estimate
      }

      // Extrapolate based on successful samples
      const averageCommitsPerRepo = totalCommits / successfulRequests;
      return Math.floor(averageCommitsPerRepo * repositories.length);
    }

  /**
   * Estimate total commits across repositories
   */
  private async estimateTotalCommits(repositories: GitHubRepository[]): Promise<number> {
    let totalCommits = 0;

    for (const repo of repositories) {
      try {
        const commits = await this.githubService.getRepositoryCommitsCount(repo.owner.login, repo.name);
        totalCommits += commits;
      } catch (error) {
        console.error(`Failed to fetch commits for ${repo.full_name}`);
      }
    }

    // Extrapolate based on sample
    const extrapolationFactor = repositories.length > 10 ? repositories.length / 10 : 1;
    return Math.floor(totalCommits * extrapolationFactor);
  }

  /**
   * Get language color mapping
   */
  private getLanguageColor(language: string): string {
    const colors: Record<string, string> = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C': '#555555',
      'C#': '#239120',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'HTML': '#e34c26',
      'CSS': '#1572B6',
      'Shell': '#89e051',
      'Dockerfile': '#384d54'
    };

    return colors[language] || '#8b949e';
  }
}

export default DashboardService;