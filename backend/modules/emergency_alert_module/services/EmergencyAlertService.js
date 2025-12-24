/**
 * EmergencyAlertService
 * Handles sending emergency alerts to contacts via multiple channels
 */
const EmergencyContact = require('../../notifications_module/models/EmergencyContact');
const SMSService = require('../../notifications_module/services/SMSService');
const EmailService = require('../../notifications_module/services/EmailService');
const MessageTranslator = require('../../notifications_module/utils/messageTranslator');
const pool = require('../../../config/database');

class EmergencyAlertService {
  constructor() {
    this.smsService = new SMSService();
    this.emailService = new EmailService();
    this.messageTranslator = MessageTranslator;
  }

  /**
   * Send emergency alerts to all configured contacts
   * @param {number} userId - User ID
   * @param {Object} distressData - Distress detection result
   * @param {Array} alertMethods - Preferred alert methods ['sms', 'email', 'whatsapp']
   * @returns {Object} Alert dispatch result
   */
  async sendEmergencyAlerts(userId, distressData, alertMethods = ['sms', 'email']) {
    try {
      // Get user info
      const userResult = await pool.query(
        'SELECT name, email, phone FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      const userLanguage = await this.getUserLanguage(userId);

      // Get emergency contacts
      const contacts = await EmergencyContact.findByUserId(pool, userId);
      const primaryContact = await EmergencyContact.findPrimary(pool, userId);

      // Combine all contacts (avoid duplicates)
      const allContacts = [...contacts];
      if (primaryContact && !allContacts.find(c => c.id === primaryContact.id)) {
        allContacts.push(primaryContact);
      }

      if (allContacts.length === 0) {
        console.warn(`No emergency contacts found for user ${userId}`);
        return {
          success: false,
          message: 'No emergency contacts configured',
          contactsNotified: 0
        };
      }

      // Prepare alert message
      const alertMessage = this.prepareAlertMessage(
        user,
        distressData,
        userLanguage
      );

      // Send alerts via preferred methods
      const results = [];
      for (const contact of allContacts) {
        if (!contact.notify_on_critical) {
          continue; // Skip if contact opted out
        }

        for (const method of alertMethods) {
          try {
            const result = await this.sendAlertToContact(
              contact,
              alertMessage,
              method,
              userLanguage
            );
            results.push({
              contactId: contact.id,
              contactName: contact.name,
              method,
              success: result.success,
              error: result.error
            });
          } catch (error) {
            console.error(`Error sending ${method} to ${contact.name}:`, error);
            results.push({
              contactId: contact.id,
              contactName: contact.name,
              method,
              success: false,
              error: error.message
            });
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        contactsNotified: successCount,
        totalContacts: allContacts.length,
        results
      };
    } catch (error) {
      console.error('Error sending emergency alerts:', error);
      throw error;
    }
  }

  /**
   * Prepare alert message in user's language
   */
  prepareAlertMessage(user, distressData, language) {
    const userName = user.name || 'User';
    const emotion = distressData.fusionResult?.primaryEmotion || 'distress';
    const severity = distressData.fusionResult?.severity || 'high';
    const timestamp = new Date().toLocaleString(language || 'en');

    const title = this.messageTranslator.getMessage(
      language,
      'emergencyAlert.title',
      'URGENT: Mental Health Alert'
    );

    const message = this.messageTranslator.getMessage(
      language,
      'emergencyAlert.message',
      'Possible crisis detected for {{userName}}. Emotion: {{emotion}}, Severity: {{severity}}, Time: {{timestamp}}. Please reach out immediately.'
    )
      .replace('{{userName}}', userName)
      .replace('{{emotion}}', emotion)
      .replace('{{severity}}', severity)
      .replace('{{timestamp}}', timestamp);

    return {
      title,
      message,
      userName,
      emotion,
      severity,
      timestamp
    };
  }

  /**
   * Send alert to a specific contact via specified method
   */
  async sendAlertToContact(contact, alertMessage, method, language) {
    switch (method.toLowerCase()) {
      case 'sms':
        if (contact.phone) {
          await this.smsService.sendEmergency({
            title: alertMessage.title,
            message: alertMessage.message,
            user_id: contact.user_id
          }, contact);
          return { success: true };
        }
        return { success: false, error: 'No phone number' };

      case 'email':
        if (contact.email) {
          await this.emailService.sendEmergency({
            title: alertMessage.title,
            message: alertMessage.message,
            user_id: contact.user_id
          }, contact);
          return { success: true };
        }
        return { success: false, error: 'No email address' };

      case 'whatsapp':
        // WhatsApp integration would go here
        // For now, fallback to SMS if phone available
        if (contact.phone) {
          console.log(`[EmergencyAlertService] WhatsApp not implemented, using SMS for ${contact.name}`);
          await this.smsService.sendEmergency({
            title: alertMessage.title,
            message: alertMessage.message,
            user_id: contact.user_id
          }, contact);
          return { success: true };
        }
        return { success: false, error: 'WhatsApp not available' };

      default:
        return { success: false, error: `Unknown method: ${method}` };
    }
  }

  /**
   * Get user's language preference
   */
  async getUserLanguage(userId) {
    try {
      const query = `
        SELECT language FROM user_notification_preferences
        WHERE user_id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0].language : 'en';
    } catch (error) {
      console.error('Error fetching user language:', error);
      return 'en';
    }
  }

  /**
   * Manually trigger emergency alert (for testing or manual override)
   */
  async triggerManualAlert(userId, reason = 'manual_trigger') {
    try {
      const distressData = {
        fusionResult: {
          primaryEmotion: 'manual',
          severity: 'high',
          isCrisis: true,
          combinedScore: 0.9
        },
        shouldAlert: true
      };

      // Get user preferences
      const EmergencyPreferenceService = require('./EmergencyPreferenceService');
      const prefService = new EmergencyPreferenceService();
      const preferences = await prefService.getPreferences(userId);
      const alertMethods = preferences.alert_methods || ['sms', 'email'];

      return await this.sendEmergencyAlerts(userId, distressData, alertMethods);
    } catch (error) {
      console.error('Error triggering manual alert:', error);
      throw error;
    }
  }
}

module.exports = EmergencyAlertService;

