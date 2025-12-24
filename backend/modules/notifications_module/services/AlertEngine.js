/**
 * AlertEngine
 * Handles delivery of notifications through various channels
 */
const EmailService = require('./EmailService');
const SMSService = require('./SMSService');
const PushService = require('./PushService');

class AlertEngine {
  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushService();
  }

  /**
   * Send notification through specified channel
   */
  async send(notification, channel) {
    try {
      switch (channel) {
        case 'email':
          await this.emailService.send(notification);
          break;
        case 'sms':
          await this.smsService.send(notification);
          break;
        case 'push':
          await this.pushService.send(notification);
          break;
        case 'in_app':
          // In-app notifications are already stored in database
          console.log(`In-app notification created: ${notification.id}`);
          break;
        default:
          console.warn(`Unknown channel: ${channel}`);
      }
    } catch (error) {
      console.error(`Error sending notification via ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Send emergency alert with retry mechanism
   */
  async sendEmergencyAlert(notification, emergencyContacts, maxRetries = 3) {
    let attempts = 0;
    let lastError = null;

    while (attempts < maxRetries) {
      try {
        // Try SMS first (most reliable for emergencies)
        if (emergencyContacts && emergencyContacts.length > 0) {
          for (const contact of emergencyContacts) {
            if (contact.phone) {
              await this.smsService.sendEmergency(notification, contact);
            }
            if (contact.email) {
              await this.emailService.sendEmergency(notification, contact);
            }
          }
        }
        return { success: true };
      } catch (error) {
        lastError = error;
        attempts++;
        if (attempts < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    }

    throw new Error(`Failed to send emergency alert after ${maxRetries} attempts: ${lastError?.message}`);
  }
}

module.exports = AlertEngine;

