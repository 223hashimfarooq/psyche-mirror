const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { encrypt, decrypt, encryptJSON, decryptJSON } = require('../utils/encryption');
const { generateMFASecret, generateQRCode, verifyMFAToken, generateBackupCodes } = require('../utils/mfa');

/**
 * Get user privacy settings
 */
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM privacy_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default privacy settings
      await pool.query(
        `INSERT INTO privacy_settings (user_id, encryption_enabled, hipaa_compliant)
         VALUES ($1, TRUE, TRUE)
         RETURNING *`,
        [userId]
      );
      
      const newResult = await pool.query(
        'SELECT * FROM privacy_settings WHERE user_id = $1',
        [userId]
      );
      
      return res.json({
        success: true,
        settings: newResult.rows[0]
      });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch privacy settings'
    });
  }
});

/**
 * Update privacy settings
 */
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      dataRetentionDays,
      allowDataSharing,
      allowAnalytics,
      encryptionEnabled,
      anonymizeData,
      gdprConsent
    } = req.body;

    // Check if settings exist
    const existing = await pool.query(
      'SELECT id FROM privacy_settings WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existing.rows.length === 0) {
      // Create new settings
      result = await pool.query(
        `INSERT INTO privacy_settings (
          user_id, data_retention_days, allow_data_sharing, allow_analytics,
          encryption_enabled, anonymize_data, gdpr_consent, gdpr_consent_date, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          userId,
          dataRetentionDays || 365,
          allowDataSharing || false,
          allowAnalytics || false,
          encryptionEnabled !== undefined ? encryptionEnabled : true,
          anonymizeData || false,
          gdprConsent || false,
          gdprConsent ? new Date() : null
        ]
      );
    } else {
      // Update existing settings
      result = await pool.query(
        `UPDATE privacy_settings SET
          data_retention_days = COALESCE($1, data_retention_days),
          allow_data_sharing = COALESCE($2, allow_data_sharing),
          allow_analytics = COALESCE($3, allow_analytics),
          encryption_enabled = COALESCE($4, encryption_enabled),
          anonymize_data = COALESCE($5, anonymize_data),
          gdpr_consent = COALESCE($6, gdpr_consent),
          gdpr_consent_date = CASE WHEN $6 = TRUE AND gdpr_consent_date IS NULL THEN CURRENT_TIMESTAMP ELSE gdpr_consent_date END,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $7
        RETURNING *`,
        [
          dataRetentionDays,
          allowDataSharing,
          allowAnalytics,
          encryptionEnabled,
          anonymizeData,
          gdprConsent,
          userId
        ]
      );
    }

    // Log privacy settings update
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, details)
       VALUES ($1, 'privacy_settings_updated', 'privacy_settings', $2)`,
      [userId, JSON.stringify({ settings: result.rows[0] })]
    );

    res.json({
      success: true,
      settings: result.rows[0],
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings'
    });
  }
});

/**
 * Request data deletion
 */
router.post('/data/delete', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;

    // Create deletion request
    const result = await pool.query(
      `INSERT INTO data_deletion_requests (user_id, request_type, status, notes)
       VALUES ($1, 'delete', 'pending', $2)
       RETURNING *`,
      [userId, reason || 'User requested data deletion']
    );

    // Log deletion request
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, details)
       VALUES ($1, 'data_deletion_requested', 'user_data', $2)`,
      [userId, JSON.stringify({ requestId: result.rows[0].id, reason })]
    );

    res.json({
      success: true,
      message: 'Data deletion request submitted. Your data will be permanently deleted within 30 days.',
      requestId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating deletion request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit deletion request'
    });
  }
});

/**
 * Request data anonymization
 */
router.post('/data/anonymize', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;

    // Create anonymization request
    const result = await pool.query(
      `INSERT INTO data_deletion_requests (user_id, request_type, status, notes)
       VALUES ($1, 'anonymize', 'pending', $2)
       RETURNING *`,
      [userId, reason || 'User requested data anonymization']
    );

    // Log anonymization request
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, details)
       VALUES ($1, 'data_anonymization_requested', 'user_data', $2)`,
      [userId, JSON.stringify({ requestId: result.rows[0].id, reason })]
    );

    res.json({
      success: true,
      message: 'Data anonymization request submitted. Your data will be anonymized within 7 days.',
      requestId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating anonymization request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit anonymization request'
    });
  }
});

/**
 * Get audit logs for user (compliance)
 */
router.get('/audit-logs', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, action_type, resource_type, resource_id, ip_address, details, created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      logs: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

/**
 * Setup MFA - Generate secret and QR code
 */
router.post('/mfa/setup', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { secret, otpAuthUrl } = generateMFASecret(userResult.rows[0].email);
    const qrCode = await generateQRCode(otpAuthUrl);
    const backupCodes = generateBackupCodes(10);

    // Store MFA secret (encrypted)
    const encryptedSecret = encrypt(secret);
    
    await pool.query(
      `INSERT INTO mfa_settings (user_id, mfa_secret, backup_codes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET mfa_secret = $2, backup_codes = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, encryptedSecret, JSON.stringify(backupCodes)]
    );

    // Log MFA setup
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, details)
       VALUES ($1, 'mfa_setup_initiated', 'mfa_settings', $2)`,
      [userId, JSON.stringify({ timestamp: new Date() })]
    );

    res.json({
      success: true,
      secret: secret, // Return plain secret for initial setup (user should save it)
      qrCode: qrCode,
      backupCodes: backupCodes,
      message: 'MFA setup initiated. Please verify with a code to complete setup.'
    });
  } catch (error) {
    console.error('Error setting up MFA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup MFA'
    });
  }
});

/**
 * Verify and enable MFA
 */
router.post('/mfa/verify', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token, backupCode } = req.body;

    const mfaResult = await pool.query(
      'SELECT mfa_secret, backup_codes, backup_codes_used FROM mfa_settings WHERE user_id = $1',
      [userId]
    );

    if (mfaResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'MFA not set up' });
    }

    const { mfa_secret, backup_codes, backup_codes_used } = mfaResult.rows[0];
    const usedCodes = backup_codes_used ? JSON.parse(backup_codes_used) : [];

    let isValid = false;

    if (backupCode) {
      // Verify backup code
      const backupCodes = JSON.parse(backup_codes);
      if (backupCodes.includes(backupCode) && !usedCodes.includes(backupCode)) {
        isValid = true;
        usedCodes.push(backupCode);
        await pool.query(
          'UPDATE mfa_settings SET backup_codes_used = $1 WHERE user_id = $2',
          [JSON.stringify(usedCodes), userId]
        );
      }
    } else if (token) {
      let decryptedSecret;
      try {
        decryptedSecret = decrypt(mfa_secret);
      } catch (decryptError) {
        console.error('MFA secret decryption failed during verification:', decryptError);
        return res.status(500).json({
          success: false,
          error: 'Failed to verify MFA secret. Please restart setup.'
        });
      }

      // Verify TOTP token
      isValid = verifyMFAToken(token, decryptedSecret, userId);
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid MFA token'
      });
    }

    // Enable MFA
    await pool.query(
      'UPDATE mfa_settings SET mfa_enabled = TRUE, last_mfa_used = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );

    // Log MFA verification
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, details)
       VALUES ($1, 'mfa_enabled', 'mfa_settings', $2)`,
      [userId, JSON.stringify({ timestamp: new Date() })]
    );

    res.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error) {
    console.error('Error verifying MFA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify MFA'
    });
  }
});

/**
 * Disable MFA
 */
router.post('/mfa/disable', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body; // Require password confirmation

    // Verify password (you should add password verification here)
    // For now, just disable MFA

    await pool.query(
      'UPDATE mfa_settings SET mfa_enabled = FALSE WHERE user_id = $1',
      [userId]
    );

    // Log MFA disable
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, details)
       VALUES ($1, 'mfa_disabled', 'mfa_settings', $2)`,
      [userId, JSON.stringify({ timestamp: new Date() })]
    );

    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling MFA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable MFA'
    });
  }
});

/**
 * Get MFA status
 */
router.get('/mfa/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT mfa_enabled, backup_codes, backup_codes_used, created_at, updated_at FROM mfa_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        mfaEnabled: false,
        setup: false
      });
    }

    const { backup_codes, backup_codes_used } = result.rows[0];
    const usedCodes = backup_codes_used ? JSON.parse(backup_codes_used) : [];
    const allBackupCodes = backup_codes ? JSON.parse(backup_codes) : [];
    const unusedBackupCodes = allBackupCodes.filter(code => !usedCodes.includes(code));

    res.json({
      success: true,
      mfaEnabled: result.rows[0].mfa_enabled,
      setup: true,
      lastUpdated: result.rows[0].updated_at,
      unusedBackupCodes: unusedBackupCodes.length > 0 ? unusedBackupCodes : null, // Only show if there are unused codes
      totalBackupCodes: allBackupCodes.length,
      usedBackupCodes: usedCodes.length
    });
  } catch (error) {
    console.error('Error fetching MFA status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MFA status'
    });
  }
});

module.exports = router;

