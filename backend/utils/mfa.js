const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generate MFA secret for a user
 */
function generateMFASecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name: `PsycheMirror (${userEmail})`,
    issuer: 'PsycheMirror',
    length: 32
  });
  
  return {
    secret: secret.base32,
    otpAuthUrl: secret.otpauth_url
  };
}

/**
 * Generate QR code for MFA setup
 */
async function generateQRCode(otpAuthUrl) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl);
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

// In-memory cache to track recently used tokens (prevents replay attacks)
// Format: { userId_secretHash_token: timestamp }
const usedTokensCache = new Map();
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes
const TOKEN_VALIDITY_WINDOW = 30 * 1000; // 30 seconds in milliseconds

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of usedTokensCache.entries()) {
    if (now - timestamp > TOKEN_VALIDITY_WINDOW * 2) {
      usedTokensCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

/**
 * Verify MFA token with strict time validation
 */
function verifyMFAToken(token, secret, userId = null) {
  try {
    if (!token || !secret) {
      console.error('MFA verification: Missing token or secret');
      return false;
    }

    // Convert token to string and ensure it's 6 digits
    const tokenStr = String(token).trim();
    if (tokenStr.length !== 6 || !/^\d{6}$/.test(tokenStr)) {
      console.error('MFA verification: Invalid token format', tokenStr);
      return false;
    }

    // Create cache key to prevent replay attacks
    const secretHash = require('crypto').createHash('sha256').update(secret).digest('hex').substring(0, 8);
    const cacheKey = userId ? `${userId}_${secretHash}_${tokenStr}` : `${secretHash}_${tokenStr}`;
    
    // Check if this token was recently used (replay attack prevention)
    if (usedTokensCache.has(cacheKey)) {
      const lastUsed = usedTokensCache.get(cacheKey);
      const timeSinceUse = Date.now() - lastUsed;
      if (timeSinceUse < TOKEN_VALIDITY_WINDOW) {
        console.error('MFA verification: Token already used (replay attack prevented)', {
          token: tokenStr,
          timeSinceUse: Math.round(timeSinceUse / 1000) + 's'
        });
        return false;
      }
    }

    // Verify token with strict window (only current 30-second step)
    // window: 0 means only accept tokens from the exact current time step
    const result = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: tokenStr,
      step: 30,
      window: 0 // Strict: only accept current 30-second window (no tolerance for expired codes)
    });

    if (result) {
      // Token is valid - mark it as used to prevent replay
      usedTokensCache.set(cacheKey, Date.now());
      console.log('MFA verification: Token accepted', { token: tokenStr });
    } else {
      // Check if token might be from adjacent time windows (for debugging)
      const adjacentResult = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: tokenStr,
        step: 30,
        window: 1 // Check if it's from adjacent window
      });
      
      if (adjacentResult && !result) {
        console.error('MFA verification: Token is from adjacent time window (expired)', {
          token: tokenStr,
          message: 'Code has expired. Please use the latest code from your authenticator app.'
        });
      } else {
        console.error('MFA verification: Token validation failed', {
          token: tokenStr,
          secretLength: secret ? secret.length : 0
        });
      }
    }

    return result;
  } catch (error) {
    console.error('MFA verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for MFA
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(speakeasy.generateSecret({ length: 16 }).base32.substring(0, 8).toUpperCase());
  }
  return codes;
}

module.exports = {
  generateMFASecret,
  generateQRCode,
  verifyMFAToken,
  generateBackupCodes
};

