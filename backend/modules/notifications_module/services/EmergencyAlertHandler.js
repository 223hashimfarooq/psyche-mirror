/**
 * EmergencyAlertHandler
 * Handles emergency alerts when critical distress is detected
 */
const NotificationService = require('./NotificationService');
const EmergencyContact = require('../models/EmergencyContact');
const AlertEngine = require('./AlertEngine');
const pool = require('../../../config/database');

class EmergencyAlertHandler {
  constructor() {
    this.notificationService = new NotificationService();
    this.alertEngine = new AlertEngine();
  }

  /**
   * Handle emergency alert for critical emotional distress
   */
  async handleEmergencyAlert(userId, emotionData) {
    try {
      // Get user info
      const userResult = await pool.query('SELECT name, email, phone FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      const user = userResult.rows[0];

      // Get emergency contacts
      const emergencyContacts = await EmergencyContact.findByUserId(pool, userId);
      const primaryContact = await EmergencyContact.findPrimary(pool, userId);

      // Create emergency notification
      const notification = await this.notificationService.createNotification({
        user_id: userId,
        title: 'Emergency Alert: Critical Emotional Distress Detected',
        message: `Critical emotional distress has been detected. User: ${user.name}, Emotion: ${emotionData.emotion}, Severity: ${emotionData.severity}, Timestamp: ${new Date().toISOString()}`,
        type: 'emergency',
        channel: 'sms', // Emergency alerts use SMS first
        severity: 'critical',
        emotion_data: emotionData
      });

      // Send to emergency contacts
      if (emergencyContacts.length > 0) {
        await this.alertEngine.sendEmergencyAlert(notification, emergencyContacts);
      }

      // Also send to primary contact if different
      if (primaryContact && !emergencyContacts.find(c => c.id === primaryContact.id)) {
        await this.alertEngine.sendEmergencyAlert(notification, [primaryContact]);
      }

      // Optionally notify registered mental health professional
      // TODO: Implement doctor notification if user has an active relationship

      return {
        success: true,
        notification,
        contactsNotified: emergencyContacts.length
      };
    } catch (error) {
      console.error('Error handling emergency alert:', error);
      throw error;
    }
  }

  /**
   * Check if emotion severity warrants emergency alert
   */
  shouldTriggerEmergency(emotionData) {
    const criticalEmotions = ['anger', 'sad', 'anxious', 'fear'];
    const isCriticalEmotion = criticalEmotions.includes(emotionData.emotion?.toLowerCase());
    const isHighSeverity = emotionData.severity === 'critical' || 
                           emotionData.severity === 'high' ||
                           (emotionData.confidence_score && emotionData.confidence_score > 0.8);
    
    return isCriticalEmotion && isHighSeverity;
  }
}

module.exports = EmergencyAlertHandler;

