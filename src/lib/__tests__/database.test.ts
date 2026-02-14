import { database } from '../database';
import * as fc from 'fast-check';

describe('Database Connection Property Tests', () => {
  const originalUri = process.env.MONGODB_URI;
  
  beforeAll(() => {
    // Set a test MongoDB URI if not provided
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    }
  });

  afterAll(() => {
    process.env.MONGODB_URI = originalUri;
  });

  afterEach(async () => {
    try {
      await database.disconnect();
    } catch (error) {
      // Ignore disconnect errors in tests
    }
  });

  test('Property 4: Database Error Handling - Connection should handle various error scenarios gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidUri: fc.constantFrom(
            'invalid-uri',
            'mongodb://invalid:27017',
            'mongodb://localhost:99999',
            ''
          )
        }),
        async ({ invalidUri }) => {
          // Test that invalid connections are handled gracefully
          const currentUri = process.env.MONGODB_URI;
          process.env.MONGODB_URI = invalidUri;
          
          try {
            // Should not throw unhandled errors
            await database.connect();
            // If it somehow connects, disconnect cleanly
            await database.disconnect();
          } catch (error) {
            // Errors should be proper Error instances with messages
            expect(error).toBeInstanceOf(Error);
            expect(typeof (error as Error).message).toBe('string');
            expect((error as Error).message.length).toBeGreaterThan(0);
          } finally {
            process.env.MONGODB_URI = currentUri;
          }
        }
      ),
      { numRuns: 5, timeout: 3000 }
    );
  });

  test('Property 4: Database connection should be idempotent', async () => {
    // Skip if no valid MongoDB URI is available
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017/test') {
      console.log('Skipping idempotent test - no valid MongoDB URI');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (connectionAttempts) => {
          // Multiple connection attempts should not cause issues
          for (let i = 0; i < connectionAttempts; i++) {
            await database.connect();
          }
          
          // Should be able to disconnect cleanly
          await database.disconnect();
        }
      ),
      { numRuns: 3, timeout: 5000 }
    );
  });
});