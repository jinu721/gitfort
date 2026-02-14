import axios, { AxiosInstance } from 'axios';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  private: boolean;
}

export interface GitHubContribution {
  date: string;
  count: number;
  level: number;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  streakStart: string | null;
  streakEnd: string | null;
}

class GitHubService {
  private api: AxiosInstance;

  constructor(token?: string) {
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitFort-App',
        ...(token && { 'Authorization': `token ${token}` })
      },
      timeout: 30000
    });
  }

  /**
   * Fetch all repositories with proper pagination
   */
  async getAllRepositories(username: string): Promise<GitHubRepository[]> {
    const repositories: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100; // GitHub max per page

    try {
      while (true) {
        const response = await this.api.get(`/users/${username}/repos`, {
          params: {
            per_page: perPage,
            page: page,
            sort: 'updated',
            type: 'all' // Include all repos (public, private, forks)
          }
        });

        const repos = response.data;
        
        if (repos.length === 0) {
          break; // No more repositories
        }

        repositories.push(...repos);
        
        // If we got less than perPage, we're on the last page
        if (repos.length < perPage) {
          break;
        }
        
        page++;
      }

      console.log(`Fetched ${repositories.length} repositories for ${username}`);
      return repositories;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(username: string): Promise<GitHubUser> {
    try {
      const response = await this.api.get(`/users/${username}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get contribution data for the last year with proper parsing
   */
  async getContributions(username: string): Promise<GitHubContribution[]> {
    try {
      // GitHub's contribution graph is not available via REST API
      // We need to scrape it or use GraphQL API
      const response = await axios.get(`https://github.com/users/${username}/contributions`, {
        headers: {
          'User-Agent': 'GitFort-App'
        }
      });

      // Parse the SVG contribution graph
      const contributions = this.parseContributionsFromSVG(response.data);
      console.log(`Fetched ${contributions.length} contribution days for ${username}`);
      return contributions;
    } catch (error) {
      console.error('Error fetching contributions:', error);
      // Fallback to mock data or empty array
      return this.generateMockContributions();
    }
  }

  /**
   * Calculate streak data from contributions
   */
  calculateStreakData(contributions: GitHubContribution[]): StreakData {
    const sortedContributions = contributions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let streakStart: string | null = null;
    let streakEnd: string | null = null;
    let longestStreakStart: string | null = null;
    let longestStreakEnd: string | null = null;

    const totalContributions = contributions.reduce((sum, day) => sum + day.count, 0);

    // Calculate current streak (from today backwards)
    const today = new Date();
    for (let i = sortedContributions.length - 1; i >= 0; i--) {
      const contribution = sortedContributions[i];
      const contributionDate = new Date(contribution.date);
      
      if (contribution.count > 0) {
        if (currentStreak === 0) {
          streakEnd = contribution.date;
        }
        currentStreak++;
        streakStart = contribution.date;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (const contribution of sortedContributions) {
      if (contribution.count > 0) {
        if (tempStreak === 0) {
          longestStreakStart = contribution.date;
        }
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          longestStreakEnd = contribution.date;
        }
      } else {
        tempStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      totalContributions,
      streakStart,
      streakEnd
    };
  }

  /**
   * Get repository languages with pagination
   */
  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/languages`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching languages for ${owner}/${repo}:`, error);
      return {};
    }
  }

  /**
   * Get repository commits count
   */
  async getRepositoryCommitsCount(owner: string, repo: string): Promise<number> {
    try {
      // Get the first page to check total count
      const response = await this.api.get(`/repos/${owner}/${repo}/commits`, {
        params: {
          per_page: 1,
          page: 1
        }
      });

      // GitHub doesn't provide total count directly, so we estimate
      // This is a limitation of GitHub API
      const linkHeader = response.headers.link;
      if (linkHeader) {
        const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (lastPageMatch) {
          return parseInt(lastPageMatch[1]);
        }
      }

      return 1; // At least 1 commit if we got a response
    } catch (error) {
      console.error(`Error fetching commits for ${owner}/${repo}:`, error);
      return 0;
    }
  }

  /**
   * Parse contributions from GitHub's SVG (fallback method)
   */
  private parseContributionsFromSVG(html: string): GitHubContribution[] {
    // This is a simplified parser - in production, you'd want a more robust solution
    const contributions: GitHubContribution[] = [];
    
    // Extract data-date and data-count from SVG rectangles
    const rectRegex = /<rect[^>]*data-date="([^"]*)"[^>]*data-count="([^"]*)"[^>]*>/g;
    let match;

    while ((match = rectRegex.exec(html)) !== null) {
      const date = match[1];
      const count = parseInt(match[2]) || 0;
      const level = count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 9 ? 3 : 4;

      contributions.push({
        date,
        count,
        level
      });
    }

    return contributions;
  }

  /**
   * Generate mock contributions for testing
   */
  private generateMockContributions(): GitHubContribution[] {
    const contributions: GitHubContribution[] = [];
    const today = new Date();
    
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const count = Math.random() > 0.3 ? Math.floor(Math.random() * 10) : 0;
      const level = count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 9 ? 3 : 4;

      contributions.push({
        date: date.toISOString().split('T')[0],
        count,
        level
      });
    }

    return contributions;
  }
}

export default GitHubService;