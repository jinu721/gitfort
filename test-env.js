// Quick test to verify environment validation works
import { env } from './src/lib/env.js';

console.log('Environment validation successful!');
console.log('NODE_ENV:', env.NODE_ENV);
console.log('NEXTAUTH_URL:', env.NEXTAUTH_URL);
console.log('SMTP_PORT:', env.SMTP_PORT);
console.log('All environment variables loaded and validated ✅');