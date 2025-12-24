const crypto = require('crypto');

// Encryption key - In production, this should be stored securely (e.g., environment variable, key management service)
// For HIPAA/GDPR compliance, use a proper key management system
const DEFAULT_ENCRYPTION_KEY = 'psychemirror-dev-default-key-00000000000000000000000000000000';
if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️  Encryption warning: Using default development key. Set ENCRYPTION_KEY in production.');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Generate a secure encryption key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Derive a key from a password using PBKDF2
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt sensitive data (end-to-end encryption)
 * @param {string} text - Plain text to encrypt
 * @param {string} key - Encryption key (optional, uses default if not provided)
 * @returns {string} - Encrypted data in format: iv:salt:tag:encryptedData
 */
function encrypt(text, key = ENCRYPTION_KEY) {
  try {
    if (!text) return null;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key from password
    const derivedKey = deriveKey(key, salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return format: iv:salt:tag:encryptedData
    return `${iv.toString('hex')}:${salt.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data in format: iv:salt:tag:encryptedData
 * @param {string} key - Encryption key (optional, uses default if not provided)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData, key = ENCRYPTION_KEY) {
  try {
    if (!encryptedData) return null;
    
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, saltHex, tagHex, encrypted] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const salt = Buffer.from(saltHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    // Derive key from password
    const derivedKey = deriveKey(key, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt JSON object
 */
function encryptJSON(obj) {
  if (!obj) return null;
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt JSON object
 */
function decryptJSON(encryptedData) {
  if (!encryptedData) return null;
  const decrypted = decrypt(encryptedData);
  return JSON.parse(decrypted);
}

/**
 * Hash sensitive data (one-way, for storage)
 */
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  hashData,
  generateSecureToken,
  generateEncryptionKey
};

