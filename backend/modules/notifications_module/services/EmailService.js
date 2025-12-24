/**
 * EmailService
 * Handles email notifications
 */
const pool = require('../../../config/database');

class EmailService {
  constructor() {
    // In production, use nodemailer or similar
    this.enabled = process.env.EMAIL_ENABLED === 'true';
  }

  async getUserEmail(userId) {
    try {
      const result = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      return result.rows.length > 0 ? result.rows[0].email : null;
    } catch (error) {
      console.error('Error fetching user email:', error);
      return null;
    }
  }

  async send(notification) {
    if (!this.enabled) {
      console.log(`[EmailService] Email disabled, would send: ${notification.title} to user ${notification.user_id}`);
      return;
    }

    const userEmail = await this.getUserEmail(notification.user_id);
    if (!userEmail) {
      console.warn(`[EmailService] No email found for user ${notification.user_id}`);
      return;
    }

    // TODO: Implement actual email sending using nodemailer or similar
    // For now, just log
    console.log(`[EmailService] Sending email notification:`, {
      to: userEmail,
      subject: notification.title,
      body: notification.message
    });

    // Example nodemailer implementation (commented out):
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: notification.title,
      text: notification.message,
      html: `<p>${notification.message}</p>`
    });
    */
  }

  async sendEmergency(notification, contact) {
    if (!this.enabled || !contact.email) {
      console.log(`[EmailService] Email disabled or no email provided, would send emergency alert to ${contact.email}`);
      return;
    }

    // TODO: Implement emergency email template
    console.log(`[EmailService] Sending emergency email to ${contact.email}:`, {
      subject: `URGENT: ${notification.title}`,
      body: notification.message
    });

    // Example nodemailer implementation for emergency (commented out):
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: contact.email,
      subject: `URGENT: ${notification.title}`,
      text: notification.message,
      html: `<h2>URGENT ALERT</h2><p>${notification.message}</p><p>Please check on this person immediately.</p>`
    });
    */
  }
}

module.exports = EmailService;

