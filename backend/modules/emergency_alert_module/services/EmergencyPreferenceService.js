/**
 * EmergencyPreferenceService
 * Manages user preferences for emergency alert system
 */
const pool = require('../../../config/database');

class EmergencyPreferenceService {
  /**
   * Get emergency alert preferences for user
   */
  async getPreferences(userId) {
    try {
      const query = `
        SELECT * FROM emergency_alert_preferences
        WHERE user_id = $1
      `;
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length > 0) {
        const prefs = result.rows[0];
        // Parse JSON fields
        return {
          ...prefs,
          alert_methods: typeof prefs.alert_methods === 'string' 
            ? JSON.parse(prefs.alert_methods) 
            : prefs.alert_methods || ['sms', 'email']
        };
      }

      // Return defaults if no preferences found
      return this.getDefaultPreferences();
    } catch (error) {
      console.error('Error fetching emergency preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update emergency alert preferences
   */
  async updatePreferences(userId, preferences) {
    try {
      // Check if preferences exist
      const existing = await this.getPreferences(userId);
      
      const alertMethods = Array.isArray(preferences.alert_methods) 
        ? JSON.stringify(preferences.alert_methods)
        : preferences.alert_methods || JSON.stringify(['sms', 'email']);

      if (existing.id) {
        // Update existing
        const query = `
          UPDATE emergency_alert_preferences
          SET 
            enable_detection = $1,
            alert_methods = $2,
            require_consent = $3,
            allow_manual_override = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $5
          RETURNING *
        `;
        const result = await pool.query(query, [
          preferences.enable_detection !== undefined ? preferences.enable_detection : true,
          alertMethods,
          preferences.require_consent !== undefined ? preferences.require_consent : true,
          preferences.allow_manual_override !== undefined ? preferences.allow_manual_override : true,
          userId
        ]);
        
        const prefs = result.rows[0];
        return {
          ...prefs,
          alert_methods: typeof prefs.alert_methods === 'string' 
            ? JSON.parse(prefs.alert_methods) 
            : prefs.alert_methods
        };
      } else {
        // Create new
        const query = `
          INSERT INTO emergency_alert_preferences
          (user_id, enable_detection, alert_methods, require_consent, allow_manual_override)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const result = await pool.query(query, [
          userId,
          preferences.enable_detection !== undefined ? preferences.enable_detection : true,
          alertMethods,
          preferences.require_consent !== undefined ? preferences.require_consent : true,
          preferences.allow_manual_override !== undefined ? preferences.allow_manual_override : true
        ]);
        
        const prefs = result.rows[0];
        return {
          ...prefs,
          alert_methods: typeof prefs.alert_methods === 'string' 
            ? JSON.parse(prefs.alert_methods) 
            : prefs.alert_methods
        };
      }
    } catch (error) {
      console.error('Error updating emergency preferences:', error);
      throw error;
    }
  }

  /**
   * Check if emergency detection is enabled for user
   */
  async isDetectionEnabled(userId) {
    try {
      const preferences = await this.getPreferences(userId);
      return preferences.enable_detection !== false;
    } catch (error) {
      console.error('Error checking detection status:', error);
      return true; // Default to enabled for safety
    }
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences() {
    return {
      id: null,
      user_id: null,
      enable_detection: true,
      alert_methods: ['sms', 'email'],
      require_consent: true,
      allow_manual_override: true,
      created_at: null,
      updated_at: null
    };
  }

  /**
   * Initialize preferences for user (called on first use)
   */
  async initializePreferences(userId) {
    try {
      const existing = await this.getPreferences(userId);
      if (!existing.id) {
        return await this.updatePreferences(userId, this.getDefaultPreferences());
      }
      return existing;
    } catch (error) {
      console.error('Error initializing preferences:', error);
      throw error;
    }
  }
}

module.exports = EmergencyPreferenceService;

