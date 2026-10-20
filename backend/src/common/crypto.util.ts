import * as crypto from 'crypto';

function getKey(customSecret?: string): Buffer {
  const secret =
    customSecret ||
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'codemind-fallback-secret-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Format: iv:authTag:encryptedHex
 */
export function encryptText(plaintext: string, secret?: string): string {
  if (!plaintext) return '';
  const key = getKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 */
export function decryptText(encryptedText: string, secret?: string): string {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // Return raw text if not in encrypted format (e.g. legacy plain strings)
    return encryptedText;
  }

  const [ivHex, authTagHex, encryptedData] = parts;
  try {
    const key = getKey(secret);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed for stored API key:', err);
    return '';
  }
}

/**
 * Masks an API key for safe UI display (e.g. sk-...a1b2).
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}
