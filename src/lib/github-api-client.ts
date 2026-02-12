import { getValidAccessToken } from './token-manager';

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionsCollection {
  contributionCalendar: ContributionCalendar;
  totalCommitContributions?: number;
  totalIssueContributions?: number;
  totalPullRequestContributions?: number;
  totalPullRequestReviewContributions?: number;
  contributionYears?: number[];
}

export interface UserProfile {
  id: string;
  databaseId: number;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  websiteUrl: string;
  twitterUsername: string;
  createdAt: string;
  updatedAt: string;
  followers: { totalCount: number };
  following: { totalCount: number };
  repositories: { totalCount: number };
  contributionsCollection: ContributionsCollection;
}

export interface RepositoryLanguage {
  name: string;
  color: string;
}

export interface RepositoryLanguageEdge {
  size: number;
  node: RepositoryLanguage;
}

export interface RepositoryLanguages {
  edges: RepositoryLanguageEdge[];
  totalSize: number;
}

export interface RepositoryDetails {
  id: string;
  databaseId: number;
  name: string;
  nameWithOwner: string;
  description: string;
  url: string;
  homepageUrl: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  stargazerCount: number;
  forkCount: number;
  watchers: { totalCount: number };
  issues: { totalCount: number };
  pullRequests: { totalCount: number };
  releases: { totalCount: number };
  primaryLanguage: RepositoryLanguage;
  licenseInfo: { name: string; spdxId: string };
  defaultBranchRef: { name: string };
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface QueuedRequest {
  url: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retryCount: number;
}

export class GitHubAPIClient {
  private baseUrl = 'https://api.github.com';
  private graphqlUrl = 'https://api.github.com/graphql';
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private rateLimitStatus: RateLimitStatus | null = null;
  private maxRetries = 3;
  private baseDelay = 1000;
  private maxQueueSize = 100;
  private queueProcessingDelay = 100;

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const tokenInfo = await getValidAccessToken();
    
    if (!tokenInfo || !tokenInfo.isValid) {
      throw new Error(tokenInfo?.error || 'No valid access token available');
    }

    return {
      'Authorization': `Bearer ${tokenInfo.accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Control-Center/1.0'
    };
  }

  private updateRateLimitStatus(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const used = headers.get('x-ratelimit-used');

    if (limit && remaining && reset && used) {
      this.rateLimitStatus = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        used: parseInt(used)
      };
    }
  }

  private async waitForRateLimit(): Promise<void> {
    if (!this.rateLimitStatus) return;

    const now = Math.floor(Date.now() / 1000);
    const resetTime = this.rateLimitStatus.reset;
    
    if (this.rateLimitStatus.remaining <= 0 && now < resetTime) {
      const waitTime = (resetTime - now + 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private shouldQueueRequest(): boolean {
    if (!this.rateLimitStatus) return false;
    
    return this.rateLimitStatus.remaining <= 10;
  }

  private async handleRateLimitResponse(response: Response): Promise<void> {
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      if (rateLimitRemaining === '0') {
        const resetTime = response.headers.get('x-ratelimit-reset');
        if (resetTime) {
          const now = Math.floor(Date.now() / 1000);
          const waitTime = (parseInt(resetTime) - now + 1) * 1000;
          if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
    }
  }

  private async executeRequest(url: string, options: RequestInit): Promise<Response> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    this.updateRateLimitStatus(response.headers);

    if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
      await this.handleRateLimitResponse(response);
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      try {
        await this.waitForRateLimit();
        
        const response = await this.executeRequest(request.url, request.options);
        const data = await response.json();
        
        request.resolve(data);
        
        if (this.shouldQueueRequest()) {
          await new Promise(resolve => setTimeout(resolve, this.queueProcessingDelay));
        }
      } catch (error: any) {
        if (error.message === 'RATE_LIMIT_EXCEEDED' && request.retryCount < this.maxRetries) {
          request.retryCount++;
          this.requestQueue.unshift(request);
          await this.waitForRateLimit();
          continue;
        }

        if (request.retryCount < this.maxRetries && error.message.includes('GitHub API error')) {
          request.retryCount++;
          const delay = this.baseDelay * Math.pow(2, request.retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          this.requestQueue.unshift(request);
          continue;
        }

        request.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  private async queueRequest(url: string, options: RequestInit = {}): Promise<any> {
    if (this.requestQueue.length >= this.maxQueueSize) {
      throw new Error('Request queue is full. Please try again later.');
    }

    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        url,
        options,
        resolve,
        reject,
        retryCount: 0
      };

      this.requestQueue.push(queuedRequest);
      this.processQueue();
    });
  }

  public getQueueStatus(): { queueLength: number; isProcessing: boolean; maxQueueSize: number } {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      maxQueueSize: this.maxQueueSize
    };
  }

  public async checkRateLimit(): Promise<RateLimitStatus> {
    try {
      const response = await this.executeRequest(`${this.baseUrl}/rate_limit`, {
        method: 'GET'
      });
      
      const data = await response.json();
      return data.rate;
    } catch (error) {
      throw new Error(`Failed to check rate limit: ${error}`);
    }
  }

  public getRateLimitStatus(): RateLimitStatus | null {
    return this.rateLimitStatus;
  }

  public async get(endpoint: string): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    return this.queueRequest(url, { method: 'GET' });
  }

  public async post(endpoint: string, data?: any): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    return this.queueRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }

  public async graphql(query: string, variables?: Record<string, any>): Promise<any> {
    return this.queueRequest(this.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
  }

  public async getRepositories(username: string): Promise<any[]> {
    const response = await this.get(`/users/${username}/repos?per_page=100&sort=updated`);
    return response;
  }

  public async getWorkflowRuns(owner: string, repo: string): Promise<any[]> {
    const response = await this.get(`/repos/${owner}/${repo}/actions/runs?per_page=100`);
    return response.workflow_runs || [];
  }

  public async getRepositoryContent(owner: string, repo: string, path: string): Promise<string> {
    const response = await this.get(`/repos/${owner}/${repo}/contents/${path}`);

    if (response.type === 'file' && response.content) {
      return Buffer.from(response.content, 'base64').toString('utf-8');
    }

    throw new Error('Content not found or not a file');
    throw new Error('Content not found or not a file');
  }

  public async getContributions(username: string, from: Date, to: Date): Promise<{ user: { contributionsCollection: ContributionsCollection } }> {
    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      username,
      from: from.toISOString(),
      to: to.toISOString()
    };

    const response = await this.graphql(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return response.data;
  }

  public async getUserProfile(username: string): Promise<{ user: UserProfile }> {
    const query = `
      query($username: String!) {
        user(login: $username) {
          id
          databaseId
          login
          name
          email
          avatarUrl
          bio
          company
          location
          websiteUrl
          twitterUsername
          createdAt
          updatedAt
          followers {
            totalCount
          }
          following {
            totalCount
          }
          repositories(privacy: PUBLIC) {
            totalCount
          }
          contributionsCollection {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
          }
        }
      }
    `;

    const variables = { username };

    const response = await this.graphql(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return response.data;
  }

  public async getContributionYears(username: string): Promise<{ user: { contributionsCollection: { contributionYears: number[] } } }> {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionYears
          }
        }
      }
    `;

    const variables = { username };

    const response = await this.graphql(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return response.data;
  }

  public async getRepositoryLanguages(owner: string, repo: string): Promise<{ repository: { languages: RepositoryLanguages } }> {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node {
                name
                color
              }
            }
            totalSize
          }
        }
      }
    `;

    const variables = { owner, repo };

    const response = await this.graphql(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return response.data;
  }

  public async getRepositoryDetails(owner: string, repo: string): Promise<{ repository: RepositoryDetails }> {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
          databaseId
          name
          nameWithOwner
          description
          url
          homepageUrl
          isPrivate
          isFork
          isArchived
          createdAt
          updatedAt
          pushedAt
          stargazerCount
          forkCount
          watchers {
            totalCount
          }
          issues(states: OPEN) {
            totalCount
          }
          pullRequests(states: OPEN) {
            totalCount
          }
          releases {
            totalCount
          }
          primaryLanguage {
            name
            color
          }
          licenseInfo {
            name
            spdxId
          }
          defaultBranchRef {
            name
          }
        }
      }
    `;

    const variables = { owner, repo };

    const response = await this.graphql(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return response.data;
  }

  public async getOptimizedContributions(username: string, years: number[] = []): Promise<Record<string, { contributionsCollection: ContributionsCollection }>> {
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      years = [currentYear];
    }

    const queries = years.map((year) => {
      const from = new Date(`${year}-01-01T00:00:00Z`);
      const to = new Date(`${year}-12-31T23:59:59Z`);
      
      return `
        year${year}: user(login: $username) {
          contributionsCollection(from: "${from.toISOString()}", to: "${to.toISOString()}") {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      `;
    });

    const query = `
      query($username: String!) {
        ${queries.join('\n')}
      }
    `;

    const variables = { username };

    const response = await this.graphql(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return response.data;
  }
}
