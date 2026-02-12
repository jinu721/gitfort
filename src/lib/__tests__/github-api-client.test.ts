import { GitHubAPIClient } from '../github-api-client';

jest.mock('../token-manager', () => ({
  getValidAccessToken: jest.fn().mockResolvedValue({
    isValid: true,
    accessToken: 'mock-token'
  })
}));

global.fetch = jest.fn();

describe('GitHubAPIClient GraphQL Methods', () => {
  let client: GitHubAPIClient;

  beforeEach(() => {
    client = new GitHubAPIClient();
    jest.clearAllMocks();
  });

  describe('getContributions', () => {
    it('should fetch contribution data successfully', async () => {
      const mockResponse = {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 100,
                weeks: [
                  {
                    contributionDays: [
                      { date: '2024-01-01', contributionCount: 5 },
                      { date: '2024-01-02', contributionCount: 3 }
                    ]
                  }
                ]
              }
            }
          }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const from = new Date('2024-01-01');
      const to = new Date('2024-01-31');
      const result = await client.getContributions('testuser', from, to);

      expect(result).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('contributionsCollection')
        })
      );
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile data successfully', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 'user-id',
            databaseId: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.jpg'
          }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.getUserProfile('testuser');

      expect(result).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/graphql',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('user(login: $username)')
        })
      );
    });
  });

  describe('transformContributionData', () => {
    it('should transform contribution calendar data correctly', () => {
      const mockCalendar = {
        totalContributions: 10,
        weeks: [
          {
            contributionDays: [
              { date: '2024-01-01', contributionCount: 5 },
              { date: '2024-01-02', contributionCount: 3 }
            ]
          },
          {
            contributionDays: [
              { date: '2024-01-03', contributionCount: 2 }
            ]
          }
        ]
      };

      const result = client.transformContributionData(mockCalendar);

      expect(result).toEqual([
        { date: '2024-01-01', contributionCount: 5 },
        { date: '2024-01-02', contributionCount: 3 },
        { date: '2024-01-03', contributionCount: 2 }
      ]);
    });
  });

  describe('calculateQueryComplexity', () => {
    it('should calculate query complexity correctly', () => {
      const simpleQuery = 'query { user { login } }';
      const complexQuery = `
        query {
          user {
            repositories(first: 100) {
              nodes {
                name
                languages(first: 10) {
                  nodes {
                    name
                  }
                }
              }
            }
          }
        }
      `;

      expect((client as any).calculateQueryComplexity(simpleQuery)).toBeLessThan(
        (client as any).calculateQueryComplexity(complexQuery)
      );
    });
  });
});