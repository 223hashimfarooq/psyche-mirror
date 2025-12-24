/**
 * Notification Model
 * Represents a notification sent to a user
 */
class Notification {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.message = data.message;
    this.type = data.type; // 'emotion_alert', 'scheduled_reminder', 'emergency', 'motivation', 'self_care'
    this.channel = data.channel; // 'push', 'email', 'sms', 'in_app'
    this.severity = data.severity; // 'low', 'medium', 'high', 'critical'
    this.emotion_data = data.emotion_data; // JSONB for emotion-related notifications
    this.is_read = data.is_read || false;
    this.is_delivered = data.is_delivered || false;
    this.delivery_attempts = data.delivery_attempts || 0;
    this.created_at = data.created_at;
    this.delivered_at = data.delivered_at;
  }

  static async create(pool, notificationData) {
    const query = `
      INSERT INTO notifications_enhanced 
      (user_id, title, message, type, channel, severity, emotion_data, is_read, is_delivered)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      notificationData.user_id,
      notificationData.title,
      notificationData.message,
      notificationData.type,
      notificationData.channel || 'in_app',
      notificationData.severity || 'medium',
      notificationData.emotion_data ? JSON.stringify(notificationData.emotion_data) : null,
      notificationData.is_read || false,
      notificationData.is_delivered || false
    ];
    const result = await pool.query(query, values);
    return new Notification(result.rows[0]);
  }

  static async findByUserId(pool, userId, options = {}) {
    let query = `
      SELECT * FROM notifications_enhanced 
      WHERE user_id = $1
    `;
    const values = [userId];

    if (options.unreadOnly) {
      query += ' AND is_read = false';
    }

    if (options.type) {
      query += ' AND type = $2';
      values.push(options.type);
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new Notification(row));
  }

  static async markAsRead(pool, notificationId, userId) {
    const query = `
      UPDATE notifications_enhanced 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows.length > 0 ? new Notification(result.rows[0]) : null;
  }

  static async markAsDelivered(pool, notificationId) {
    const query = `
      UPDATE notifications_enhanced 
      SET is_delivered = true, delivered_at = CURRENT_TIMESTAMP, delivery_attempts = delivery_attempts + 1
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId]);
    return result.rows.length > 0 ? new Notification(result.rows[0]) : null;
  }

  static async incrementDeliveryAttempts(pool, notificationId) {
    const query = `
      UPDATE notifications_enhanced 
      SET delivery_attempts = delivery_attempts + 1
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId]);
    return result.rows.length > 0 ? new Notification(result.rows[0]) : null;
  }
}

module.exports = Notification;

