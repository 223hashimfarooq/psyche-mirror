const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { verifyMFAToken } = require('../utils/mfa');
const { decrypt } = require('../utils/encryption');

const router = express.Router();

// JWT Secret (in production, use a secure secret)
const JWT_SECRET = process.env.JWT_SECRET || 'psychemirror-secret-key';

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, role, specialization, experience } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email, password, name, and role are required' 
      });
    }

    // Validate role
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: 'Role must be either "patient" or "doctor"' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'User already exists',
        message: 'An account with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, phone, role, specialization, experience) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, name, phone, role, specialization, experience, created_at`,
      [email, passwordHash, name, phone || null, role, specialization || null, experience || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'An error occurred during registration' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }

    // Check if MFA is enabled
    const mfaResult = await pool.query(
      'SELECT mfa_enabled, mfa_secret, backup_codes, backup_codes_used FROM mfa_settings WHERE user_id = $1',
      [user.id]
    );

    const mfaEnabled = mfaResult.rows.length > 0 && mfaResult.rows[0].mfa_enabled;
    const { mfaToken, backupCode } = req.body;

    // If MFA is enabled, require MFA token
    if (mfaEnabled) {
      if (!mfaToken && !backupCode) {
        return res.status(200).json({
          requiresMFA: true,
          message: 'MFA token required'
        });
      }

      const { mfa_secret, backup_codes, backup_codes_used } = mfaResult.rows[0];
      const usedCodes = backup_codes_used ? JSON.parse(backup_codes_used) : [];
      let isValidMFA = false;

      if (backupCode) {
        // Verify backup code (backup codes don't require secret decryption)
        try {
          const backupCodes = JSON.parse(backup_codes);
          if (backupCodes.includes(backupCode) && !usedCodes.includes(backupCode)) {
            isValidMFA = true;
            usedCodes.push(backupCode);
            await pool.query(
              'UPDATE mfa_settings SET backup_codes_used = $1, last_mfa_used = CURRENT_TIMESTAMP WHERE user_id = $2',
              [JSON.stringify(usedCodes), user.id]
            );
          }
        } catch (error) {
          console.error('Error verifying backup code:', error);
        }
      } else if (mfaToken) {
        let decryptedSecret;
        try {
          if (!mfa_secret) {
            console.error('MFA secret is null or undefined for user:', user.id);
            return res.status(400).json({
              error: 'MFA secret missing',
              message: 'MFA secret is missing. Please use a backup code to login, then set up MFA again.'
            });
          }
          decryptedSecret = decrypt(mfa_secret);
          if (!decryptedSecret) {
            console.error('MFA secret decryption returned null for user:', user.id);
            return res.status(400).json({
              error: 'MFA secret invalid',
              message: 'MFA secret cannot be decrypted. Please use a backup code to login, then set up MFA again.'
            });
          }
        } catch (decryptError) {
          console.error('MFA secret decryption failed during login:', decryptError);
          console.error('Decryption error details:', {
            message: decryptError.message,
            secretPreview: mfa_secret ? mfa_secret.substring(0, 50) + '...' : 'null',
            secretLength: mfa_secret ? mfa_secret.length : 0
          });
          
          // Secret was encrypted with a different key - user must use backup code
          return res.status(400).json({
            error: 'MFA secret corrupted',
            message: 'MFA secret cannot be decrypted (likely encrypted with different key). Please use a backup code to login, then set up MFA again.',
            requiresBackupCode: true
          });
        }

        // Verify TOTP token
        console.log('Verifying MFA token for user:', user.id, 'Token:', mfaToken);
        isValidMFA = verifyMFAToken(mfaToken, decryptedSecret, user.id);
        console.log('MFA verification result:', isValidMFA);
        
        if (isValidMFA) {
          await pool.query(
            'UPDATE mfa_settings SET last_mfa_used = CURRENT_TIMESTAMP WHERE user_id = $1',
            [user.id]
          );
        } else {
          console.error('MFA token verification failed for user:', user.id, 'Token provided:', mfaToken);
        }
      }

      if (!isValidMFA) {
        return res.status(401).json({
          error: 'Invalid MFA token',
          message: 'MFA verification failed'
        });
      }
    }

    // Update last active
    await pool.query(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        lastActive: user.last_active,
        lastMood: user.last_mood
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: 'An error occurred during login' 
    });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or expired' 
    });
  }
};

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, role, specialization, experience, created_at, last_active, last_mood FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User profile not found' 
      });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        createdAt: user.created_at,
        lastActive: user.last_active,
        lastMood: user.last_mood
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching profile' 
    });
  }
});

/**
 * Reset MFA - Password protected (no JWT required)
 * Use this when you're locked out and don't have backup codes
 */
router.post('/reset-mfa', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required to reset MFA'
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Clear MFA settings
    await pool.query(
      'DELETE FROM mfa_settings WHERE user_id = $1',
      [user.id]
    );

    // Log MFA reset
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, details)
       VALUES ($1, 'mfa_reset', 'mfa_settings', $2)`,
      [user.id, JSON.stringify({ timestamp: new Date(), method: 'password_verified' })]
    );

    res.json({
      success: true,
      message: 'MFA has been reset successfully. You can now login with just your password.'
    });

  } catch (error) {
    console.error('MFA reset error:', error);
    res.status(500).json({
      error: 'Failed to reset MFA',
      message: 'An error occurred while resetting MFA'
    });
  }
});

module.exports = router;
