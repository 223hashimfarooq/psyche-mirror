/**
 * UserNotificationPreferences Model
 * Manages user preferences for notifications
 */
class UserNotificationPreferences {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.enable_emotion_alerts = data.enable_emotion_alerts !== undefined ? data.enable_emotion_alerts : true;
    this.enable_scheduled_reminders = data.enable_scheduled_reminders !== undefined ? data.enable_scheduled_reminders : true;
    this.enable_motivational_messages = data.enable_motivational_messages !== undefined ? data.enable_motivational_messages : true;
    this.enable_self_care_reminders = data.enable_self_care_reminders !== undefined ? data.enable_self_care_reminders : true;
    this.enable_emergency_alerts = data.enable_emergency_alerts !== undefined ? data.enable_emergency_alerts : true;
    this.preferred_channels = data.preferred_channels || ['in_app']; // Array: ['push', 'email', 'sms', 'in_app']
    this.frequency = data.frequency || 'instant'; // 'instant', 'hourly', 'daily', 'weekly'
    this.quiet_hours_start = data.quiet_hours_start || '22:00'; // HH:MM format
    this.quiet_hours_end = data.quiet_hours_end || '08:00'; // HH:MM format
    this.language = data.language || 'en';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findByUserId(pool, userId) {
    const query = `
      SELECT * FROM user_notification_preferences 
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0 ? new UserNotificationPreferences(result.rows[0]) : null;
  }

  static async createOrUpdate(pool, userId, preferences) {
    // Check if preferences exist
    const existing = await this.findByUserId(pool, userId);
    
    if (existing) {
      // Update existing preferences - use existing values if new ones are undefined
      // Build dynamic update query to only update provided fields
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (preferences.enable_emotion_alerts !== undefined) {
        updates.push(`enable_emotion_alerts = $${paramCount++}`);
        values.push(preferences.enable_emotion_alerts);
      }
      if (preferences.enable_scheduled_reminders !== undefined) {
        updates.push(`enable_scheduled_reminders = $${paramCount++}`);
        values.push(preferences.enable_scheduled_reminders);
      }
      if (preferences.enable_motivational_messages !== undefined) {
        updates.push(`enable_motivational_messages = $${paramCount++}`);
        values.push(preferences.enable_motivational_messages);
      }
      if (preferences.enable_self_care_reminders !== undefined) {
        updates.push(`enable_self_care_reminders = $${paramCount++}`);
        values.push(preferences.enable_self_care_reminders);
      }
      if (preferences.enable_emergency_alerts !== undefined) {
        updates.push(`enable_emergency_alerts = $${paramCount++}`);
        values.push(preferences.enable_emergency_alerts);
      }
      if (preferences.preferred_channels !== undefined) {
        // Prepare preferred_channels - handle both string and array
        let preferredChannels = preferences.preferred_channels;
        if (Array.isArray(preferredChannels)) {
          preferredChannels = JSON.stringify(preferredChannels);
        } else if (typeof preferredChannels !== 'string') {
          preferredChannels = JSON.stringify(['in_app']);
        }
        updates.push(`preferred_channels = $${paramCount++}`);
        values.push(preferredChannels);
      }
      if (preferences.frequency !== undefined) {
        updates.push(`frequency = $${paramCount++}`);
        values.push(preferences.frequency);
      }
      if (preferences.quiet_hours_start !== undefined) {
        updates.push(`quiet_hours_start = $${paramCount++}`);
        values.push(preferences.quiet_hours_start);
      }
      if (preferences.quiet_hours_end !== undefined) {
        updates.push(`quiet_hours_end = $${paramCount++}`);
        values.push(preferences.quiet_hours_end);
      }
      if (preferences.language !== undefined) {
        updates.push(`language = $${paramCount++}`);
        values.push(preferences.language);
      }

      if (updates.length === 0) {
        // No updates provided, return existing
        return existing;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE user_notification_preferences 
        SET ${updates.join(', ')}
        WHERE user_id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return new UserNotificationPreferences(result.rows[0]);
    } else {
      // Create new preferences
      const query = `
        INSERT INTO user_notification_preferences 
        (user_id, enable_emotion_alerts, enable_scheduled_reminders, 
         enable_motivational_messages, enable_self_care_reminders, 
         enable_emergency_alerts, preferred_channels, frequency, 
         quiet_hours_start, quiet_hours_end, language)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const values = [
        userId,
        preferences.enable_emotion_alerts !== undefined ? preferences.enable_emotion_alerts : true,
        preferences.enable_scheduled_reminders !== undefined ? preferences.enable_scheduled_reminders : true,
        preferences.enable_motivational_messages !== undefined ? preferences.enable_motivational_messages : true,
        preferences.enable_self_care_reminders !== undefined ? preferences.enable_self_care_reminders : true,
        preferences.enable_emergency_alerts !== undefined ? preferences.enable_emergency_alerts : true,
        JSON.stringify(preferences.preferred_channels || ['in_app']),
        preferences.frequency || 'instant',
        preferences.quiet_hours_start || '22:00',
        preferences.quiet_hours_end || '08:00',
        preferences.language || 'en'
      ];
      const result = await pool.query(query, values);
      return new UserNotificationPreferences(result.rows[0]);
    }
  }
}

module.exports = UserNotificationPreferences;

