import { ENCRYPTION_KEY } from './env';
import crypto from 'crypto';

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encryptToken(token: string): string {
  try {
    if (typeof window !== 'undefined') {
      return Buffer.from(token).toString('base64');
    }
    
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    return Buffer.from(token).toString('base64');
  }
}

export function decryptToken(encryptedToken: string): string {
  try {
    if (typeof window !== 'undefined') {
      return Buffer.from(encryptedToken, 'base64').toString('utf8');
    }
    
    if (!encryptedToken.includes(':')) {
      return Buffer.from(encryptedToken, 'base64').toString('utf8');
    }
    
    const [ivHex, encrypted] = encryptedToken.split(':');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return Buffer.from(encryptedToken, 'base64').toString('utf8');
  }
}