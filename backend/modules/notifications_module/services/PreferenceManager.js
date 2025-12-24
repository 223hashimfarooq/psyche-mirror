/**
 * PreferenceManager
 * Manages user notification preferences
 */
const UserNotificationPreferences = require('../models/UserNotificationPreferences');
const pool = require('../../../config/database');

class PreferenceManager {
  /**
   * Get user preferences
   */
  async getPreferences(userId) {
    let preferences = await UserNotificationPreferences.findByUserId(pool, userId);
    
    // Create default preferences if none exist
    if (!preferences) {
      preferences = await UserNotificationPreferences.createOrUpdate(pool, userId, {});
    }

    // Parse JSON fields
    if (typeof preferences.preferred_channels === 'string') {
      preferences.preferred_channels = JSON.parse(preferences.preferred_channels);
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, preferencesData) {
    // Parse preferred_channels if it's an array
    if (Array.isArray(preferencesData.preferred_channels)) {
      preferencesData.preferred_channels = preferencesData.preferred_channels;
    }

    return await UserNotificationPreferences.createOrUpdate(pool, userId, preferencesData);
  }

  /**
   * Get user language preference
   */
  async getUserLanguage(userId) {
    const preferences = await this.getPreferences(userId);
    return preferences.language || 'en';
  }
}

module.exports = PreferenceManager;

