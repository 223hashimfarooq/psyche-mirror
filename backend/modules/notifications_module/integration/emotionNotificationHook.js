/**
 * EmotionNotificationHook
 * Integrates emotion detection with notification system
 */
const NotificationService = require('../services/NotificationService');
const EmergencyAlertHandler = require('../services/EmergencyAlertHandler');
const PreferenceManager = require('../services/PreferenceManager');
const MessageTranslator = require('../utils/messageTranslator');
const pool = require('../../../config/database');

class EmotionNotificationHook {
  constructor() {
    this.notificationService = new NotificationService();
    this.emergencyHandler = new EmergencyAlertHandler();
    this.preferenceManager = new PreferenceManager();
  }

  /**
   * Process emotion detection result and trigger appropriate notifications
   */
  async processEmotionDetection(userId, emotionData) {
    try {
      // Get user preferences and language
      const preferences = await this.preferenceManager.getPreferences(userId);
      const language = await this.preferenceManager.getUserLanguage(userId);

      // Determine severity
      const severity = this.determineSeverity(emotionData);

      // Check if emergency alert is needed
      const emotionForCheck = {
        emotion: emotionData.emotion || emotionData.combined_emotion,
        severity: severity,
        confidence_score: emotionData.confidence || emotionData.combined_confidence
      };

      if (this.emergencyHandler.shouldTriggerEmergency(emotionForCheck)) {
        await this.emergencyHandler.handleEmergencyAlert(userId, emotionForCheck);
      }

      // Send emotion-based alert if enabled
      if (preferences && preferences.enable_emotion_alerts) {
        await this.sendEmotionAlert(userId, emotionData, severity, language);
      }

      // Send motivational message if enabled
      if (preferences && preferences.enable_motivational_messages) {
        await this.sendMotivationalMessage(userId, emotionData, language);
      }

    } catch (error) {
      console.error('Error processing emotion notification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Determine severity from emotion data
   */
  determineSeverity(emotionData) {
    const emotion = (emotionData.emotion || emotionData.combined_emotion || '').toLowerCase();
    const confidence = emotionData.confidence || emotionData.combined_confidence || 0.5;

    const criticalEmotions = ['anger', 'sad', 'anxious', 'fear', 'angry'];
    const highEmotions = ['disgust', 'surprise'];
    
    if (criticalEmotions.includes(emotion) && confidence > 0.7) {
      return 'critical';
    } else if (criticalEmotions.includes(emotion) || (highEmotions.includes(emotion) && confidence > 0.8)) {
      return 'high';
    } else if (confidence > 0.6) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Send emotion-based alert
   */
  async sendEmotionAlert(userId, emotionData, severity, language) {
    const emotion = emotionData.emotion || emotionData.combined_emotion || 'unknown';
    const emotionKey = emotion.toLowerCase();

    // Get emotion label in user's language
    const emotionLabel = MessageTranslator.getMessage(language, `emotions.${emotionKey}`, emotion);

    const title = MessageTranslator.getMessage(language, 'notifications.emotionAlert.title', 'Emotion Detected');
    const message = MessageTranslator.getMessage(language, 'notifications.emotionAlert.message', 
      `We detected that you're feeling ${emotionLabel}. Take a moment to breathe and check in with yourself.`)
      .replace('{{emotion}}', emotionLabel);

    await this.notificationService.createNotification({
      user_id: userId,
      title,
      message,
      type: 'emotion_alert',
      channel: 'in_app',
      severity,
      emotion_data: {
        emotion: emotionKey,
        confidence: emotionData.confidence || emotionData.combined_confidence,
        severity,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send motivational message
   */
  async sendMotivationalMessage(userId, emotionData, language) {
    const emotion = (emotionData.emotion || emotionData.combined_emotion || 'neutral').toLowerCase();
    
    const title = MessageTranslator.getMessage(language, 'notifications.motivational.title', 'You\'ve Got This!');
    const message = MessageTranslator.getMotivationalMessage(language, emotion);

    await this.notificationService.createNotification({
      user_id: userId,
      title,
      message,
      type: 'motivation',
      channel: 'in_app',
      severity: 'low',
      emotion_data: {
        emotion,
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = new EmotionNotificationHook();

