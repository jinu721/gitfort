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
  async getDashboardStats(username: string): Promise<DashboardStats> {
    try {
      console.log(`Fetching dashboard stats for ${username}...`);

      // Fetch all data in parallel for better performance
      const [repositories, contributions, userProfile] = await Promise.all([
        this.githubService.getAllRepositories(username),
        this.githubService.getContributions(username),
        this.githubService.getUserProfile(username)
      ]);

      console.log(`Found ${repositories.length} repositories and ${contributions.length} contribution days`);

      // Calculate streak data
      const streakData = this.githubService.calculateStreakData(contributions);

      // Calculate language statistics
      const languageStats = await this.calculateLanguageStats(repositories);

      // Calculate repository activity
      const activeRepos = repositories.filter(repo => {
        const lastUpdate = new Date(repo.pushed_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastUpdate > thirtyDaysAgo;
      });

      // Estimate total commits (GitHub API limitation)
      const totalCommits = await this.estimateTotalCommits(repositories.slice(0, 10)); // Sample first 10 repos

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
      throw new Error('Failed to fetch dashboard statistics');
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
  private async calculateLanguageStats(repositories: GitHubRepository[]): Promise<Array<{
    name: string;
    percentage: number;
    color: string;
  }>> {
    const languageMap = new Map<string, number>();
    let totalBytes = 0;

    // Sample repositories to avoid rate limiting (take every 3rd repo)
    const sampleRepos = repositories.filter((_, index) => index % 3 === 0).slice(0, 20);

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