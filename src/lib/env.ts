interface EnvironmentConfig {
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  MONGODB_URI?: string;
  ENCRYPTION_KEY: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

function validateEnvironmentVariables(): EnvironmentConfig {
  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'ENCRYPTION_KEY',
    'NODE_ENV'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Some features may not work properly without proper configuration.');
  }

  const nextAuthSecret = process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production-32chars';
  const encryptionKey = process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-characters';

  if (nextAuthSecret.length < 32) {
    console.warn('NEXTAUTH_SECRET should be at least 32 characters long');
  }

  if (encryptionKey.length !== 32) {
    console.warn('ENCRYPTION_KEY should be exactly 32 characters long');
  }

  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  if (smtpPort && (isNaN(smtpPort) || smtpPort <= 0 || smtpPort > 65535)) {
    console.warn('SMTP_PORT must be a valid port number between 1 and 65535');
  }

  const validNodeEnvs = ['development', 'production', 'test'];
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!validNodeEnvs.includes(nodeEnv)) {
    console.warn(`NODE_ENV should be one of: ${validNodeEnvs.join(', ')}`);
  }

  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    console.warn('MONGODB_URI should be a valid MongoDB connection string');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (process.env.SMTP_FROM && !emailRegex.test(process.env.SMTP_FROM)) {
    console.warn('SMTP_FROM should be a valid email address');
  }
  if (process.env.SMTP_USER && !emailRegex.test(process.env.SMTP_USER)) {
    console.warn('SMTP_USER should be a valid email address');
  }

  return {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: nextAuthSecret,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    MONGODB_URI: process.env.MONGODB_URI,
    ENCRYPTION_KEY: encryptionKey,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: smtpPort,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    NODE_ENV: nodeEnv as 'development' | 'production' | 'test'
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