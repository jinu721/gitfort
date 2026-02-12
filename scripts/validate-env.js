#!/usr/bin/env node

/**
 * Environment variable validation script
 * Run this to validate your .env.local configuration
 */

import { readFileSync } from 'fs';
import { join } from 'path';

function validateEnvironment() {
  try {
    // Try to load the environment validation module
    const envPath = join(process.cwd(), 'src', 'lib', 'env.ts');
    
    console.log('🔍 Validating environment variables...');
    
    // Check if .env.local exists
    try {
      readFileSync('.env.local', 'utf8');
      console.log('✅ .env.local file found');
    } catch (error) {
      console.log('❌ .env.local file not found');
      console.log('💡 Copy .env.example to .env.local and fill in your values');
      process.exit(1);
    }

    // Load environment variables from .env.local
    const envContent = readFileSync('.env.local', 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
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

    const foundVars = new Set();
    envLines.forEach(line => {
      const [key] = line.split('=');
      if (key) {
        foundVars.add(key.trim());
      }
    });

    const missingVars = requiredVars.filter(varName => !foundVars.has(varName));
    
    if (missingVars.length > 0) {
      console.log('❌ Missing required environment variables:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('💡 Please add these variables to your .env.local file');
      process.exit(1);
    }

    console.log('✅ All required environment variables are present');
    console.log('🎉 Environment configuration is valid!');
    
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }
}

validateEnvironment();