interface EnvironmentConfig {
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  MONGODB_URI: string;
  ENCRYPTION_KEY: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  NODE_ENV: 'development' | 'production' | 'test';
}
function validateEnvironmentVariables(): EnvironmentConfig {
  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'MONGODB_URI',
    'ENCRYPTION_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'NODE_ENV'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.NEXTAUTH_SECRET!.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  if (process.env.ENCRYPTION_KEY!.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }

  const smtpPort = parseInt(process.env.SMTP_PORT!, 10);
  if (isNaN(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
    throw new Error('SMTP_PORT must be a valid port number between 1 and 65535');
  }

  const validNodeEnvs = ['development', 'production', 'test'];
  if (!validNodeEnvs.includes(process.env.NODE_ENV!)) {
    throw new Error(`NODE_ENV must be one of: ${validNodeEnvs.join(', ')}`);
  }

  if (!process.env.MONGODB_URI!.startsWith('mongodb')) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.SMTP_FROM!)) {
    throw new Error('SMTP_FROM must be a valid email address');
  }
  if (!emailRegex.test(process.env.SMTP_USER!)) {
    throw new Error('SMTP_USER must be a valid email address');
  }

  return {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
    MONGODB_URI: process.env.MONGODB_URI!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: smtpPort,
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASS: process.env.SMTP_PASS!,
    SMTP_FROM: process.env.SMTP_FROM!,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test'
  };
}

export const env = validateEnvironmentVariables();

export const {
  NEXTAUTH_URL,
  NEXTAUTH_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  MONGODB_URI,
  ENCRYPTION_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  NODE_ENV
} = env;