/**
 * NotificationService
 * Core service for creating and managing notifications
 */
const Notification = require('../models/Notification');
const UserNotificationPreferences = require('../models/UserNotificationPreferences');
const AlertEngine = require('./AlertEngine');
const pool = require('../../../config/database');

class NotificationService {
  constructor() {
    this.alertEngine = new AlertEngine();
  }

  /**
   * Create and send a notification
   */
  async createNotification(notificationData) {
    try {
      // Get user preferences
      const preferences = await UserNotificationPreferences.findByUserId(pool, notificationData.user_id);
      
      // Check if notification type is enabled
      if (preferences && !this.isNotificationTypeEnabled(preferences, notificationData.type)) {
        console.log(`Notification type ${notificationData.type} is disabled for user ${notificationData.user_id}`);
        return null;
      }

      // Check quiet hours
      if (preferences && this.isQuietHours(preferences)) {
        console.log(`Quiet hours active for user ${notificationData.user_id}, notification will be queued`);
        // Queue for later delivery
        notificationData.delayed = true;
      }

      // Create notification record
      const notification = await Notification.create(pool, notificationData);

      // Send through appropriate channels
      if (!notificationData.delayed) {
        await this.sendNotification(notification, preferences);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send notification through preferred channels
   */
  async sendNotification(notification, preferences) {
    const channels = preferences?.preferred_channels || ['in_app'];
    
    for (const channel of channels) {
      try {
        await this.alertEngine.send(notification, channel);
        await Notification.markAsDelivered(pool, notification.id);
      } catch (error) {
        console.error(`Error sending notification via ${channel}:`, error);
        await Notification.incrementDeliveryAttempts(pool, notification.id);
      }
    }
  }

  /**
   * Check if notification type is enabled
   */
  isNotificationTypeEnabled(preferences, type) {
    switch (type) {
      case 'emotion_alert':
        return preferences.enable_emotion_alerts;
      case 'scheduled_reminder':
        return preferences.enable_scheduled_reminders;
      case 'motivation':
        return preferences.enable_motivational_messages;
      case 'self_care':
        return preferences.enable_self_care_reminders;
      case 'emergency':
        return preferences.enable_emergency_alerts;
      default:
        return true;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  isQuietHours(preferences) {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    return await Notification.findByUserId(pool, userId, options);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return await Notification.markAsRead(pool, notificationId, userId);
  }
}

module.exports = NotificationService;

