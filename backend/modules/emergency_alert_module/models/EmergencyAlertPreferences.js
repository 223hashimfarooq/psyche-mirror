/**
 * EmergencyAlertPreferences Model
 * Manages user preferences for emergency alert system
 */
class EmergencyAlertPreferences {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.enable_detection = data.enable_detection !== undefined ? data.enable_detection : true;
    this.alert_methods = typeof data.alert_methods === 'string' 
      ? JSON.parse(data.alert_methods) 
      : (data.alert_methods || ['sms', 'email']);
    this.require_consent = data.require_consent !== undefined ? data.require_consent : true;
    this.allow_manual_override = data.allow_manual_override !== undefined ? data.allow_manual_override : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findByUserId(pool, userId) {
    const query = `
      SELECT * FROM emergency_alert_preferences
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0 ? new EmergencyAlertPreferences(result.rows[0]) : null;
  }

  static async create(pool, preferenceData) {
    const alertMethods = Array.isArray(preferenceData.alert_methods)
      ? JSON.stringify(preferenceData.alert_methods)
      : preferenceData.alert_methods || JSON.stringify(['sms', 'email']);

    const query = `
      INSERT INTO emergency_alert_preferences
      (user_id, enable_detection, alert_methods, require_consent, allow_manual_override)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      preferenceData.user_id,
      preferenceData.enable_detection !== undefined ? preferenceData.enable_detection : true,
      alertMethods,
      preferenceData.require_consent !== undefined ? preferenceData.require_consent : true,
      preferenceData.allow_manual_override !== undefined ? preferenceData.allow_manual_override : true
    ];
    const result = await pool.query(query, values);
    return new EmergencyAlertPreferences(result.rows[0]);
  }

  static async update(pool, userId, updateData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (updateData.enable_detection !== undefined) {
      updates.push(`enable_detection = $${paramCount++}`);
      values.push(updateData.enable_detection);
    }
    if (updateData.alert_methods !== undefined) {
      const alertMethods = Array.isArray(updateData.alert_methods)
        ? JSON.stringify(updateData.alert_methods)
        : updateData.alert_methods;
      updates.push(`alert_methods = $${paramCount++}`);
      values.push(alertMethods);
    }
    if (updateData.require_consent !== undefined) {
      updates.push(`require_consent = $${paramCount++}`);
      values.push(updateData.require_consent);
    }
    if (updateData.allow_manual_override !== undefined) {
      updates.push(`allow_manual_override = $${paramCount++}`);
      values.push(updateData.allow_manual_override);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE emergency_alert_preferences
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount++}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new EmergencyAlertPreferences(result.rows[0]) : null;
  }
}

module.exports = EmergencyAlertPreferences;

