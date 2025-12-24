/**
 * SMSService
 * Handles SMS notifications via Twilio or similar
 */
const pool = require('../../../config/database');

class SMSService {
  constructor() {
    // In production, use Twilio or similar
    this.enabled = process.env.SMS_ENABLED === 'true';
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async getUserPhone(userId) {
    try {
      const result = await pool.query('SELECT phone FROM users WHERE id = $1', [userId]);
      return result.rows.length > 0 ? result.rows[0].phone : null;
    } catch (error) {
      console.error('Error fetching user phone:', error);
      return null;
    }
  }

  async send(notification) {
    if (!this.enabled) {
      console.log(`[SMSService] SMS disabled, would send: ${notification.title} to user ${notification.user_id}`);
      return;
    }

    const userPhone = await this.getUserPhone(notification.user_id);
    if (!userPhone) {
      console.warn(`[SMSService] No phone found for user ${notification.user_id}`);
      return;
    }

    // TODO: Implement actual SMS sending using Twilio
    // For now, just log
    console.log(`[SMSService] Sending SMS notification:`, {
      to: userPhone,
      message: `${notification.title}: ${notification.message}`
    });
  }

  async sendEmergency(notification, contact) {
    if (!this.enabled) {
      console.log(`[SMSService] SMS disabled, would send emergency alert to ${contact.phone}`);
      return;
    }

    // TODO: Implement emergency SMS template
    const emergencyMessage = `URGENT: ${notification.title}\n\n${notification.message}\n\nPlease check on this person immediately.`;
    
    console.log(`[SMSService] Sending emergency SMS to ${contact.phone}:`, {
      message: emergencyMessage
    });

    // Example Twilio implementation (commented out):
    /*
    const twilio = require('twilio');
    const client = twilio(this.twilioAccountSid, this.twilioAuthToken);
    
    await client.messages.create({
      body: emergencyMessage,
      from: this.twilioPhoneNumber,
      to: contact.phone
    });
    */
  }
}

module.exports = SMSService;

