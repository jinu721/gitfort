import { createCipherGCM, createDecipherGCM, randomBytes } from 'crypto';
import { ENCRYPTION_KEY } from './env';

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encryptToken(token: string): string {
  const iv = randomBytes(16);
  const cipher = createCipherGCM('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'));
  
  cipher.setAAD(Buffer.from('github-token', 'utf8'));
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  const encryptedData: EncryptedData = {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
  
  return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
}

export function decryptToken(encryptedToken: string): string {
  const encryptedData: EncryptedData = JSON.parse(
    Buffer.from(encryptedToken, 'base64').toString('utf8')
  );
  
  const decipher = createDecipherGCM('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'));
  decipher.setIV(Buffer.from(encryptedData.iv, 'hex'));
  decipher.setAAD(Buffer.from('github-token', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}