import { encryptToken, decryptToken } from '../encryption';
import * as fc from 'fast-check';

describe('Token Encryption Property Tests', () => {
  beforeAll(() => {
    // Set a test encryption key if not provided
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    }
  });

  test('Property 1: Authentication Token Round Trip - Encryption and decryption should be reversible', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (originalToken) => {
          // Encrypt then decrypt should return original token
          const encrypted = encryptToken(originalToken);
          const decrypted = decryptToken(encrypted);
          
          // Should be able to encrypt any non-empty string
          expect(typeof encrypted).toBe('string');
          expect(encrypted.length).toBeGreaterThan(0);
          
          // Decryption should return original token
          expect(decrypted).toBe(originalToken);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property 1: Token encryption should handle common edge cases', async () => {
    const edgeCases = [
      'simple-token',
      'token.with.dots',
      'token_with_underscores',
      'token-with-dashes',
      'TOKEN_UPPERCASE',
      'token123numbers',
      'very-long-token-that-might-cause-issues-with-encryption-algorithms-and-should-still-work-properly',
      'a', // single character
      '🚀', // unicode
    ];

    for (const token of edgeCases) {
      const encrypted = encryptToken(token);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(token);
    }
  });
});