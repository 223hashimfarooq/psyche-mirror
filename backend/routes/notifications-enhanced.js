const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const NotificationService = require('../modules/notifications_module/services/NotificationService');
const PreferenceManager = require('../modules/notifications_module/services/PreferenceManager');
const EmergencyAlertHandler = require('../modules/notifications_module/services/EmergencyAlertHandler');
const EmergencyContact = require('../modules/notifications_module/models/EmergencyContact');
const Scheduler = require('../modules/notifications_module/services/Scheduler');
const pool = require('../config/database');

const notificationService = new NotificationService();
const preferenceManager = new PreferenceManager();
const emergencyHandler = new EmergencyAlertHandler();
const scheduler = new Scheduler();

// Get notification preferences
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = await preferenceManager.getPreferences(userId);
    
    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences',
      message: error.message
    });
  }
});

// Update notification preferences
router.post('/preferences/update', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Validate and sanitize input
    const preferencesData = {
      enable_emotion_alerts: req.body.enable_emotion_alerts,
      enable_scheduled_reminders: req.body.enable_scheduled_reminders,
      enable_motivational_messages: req.body.enable_motivational_messages,
      enable_self_care_reminders: req.body.enable_self_care_reminders,
      enable_emergency_alerts: req.body.enable_emergency_alerts,
      preferred_channels: req.body.preferred_channels,
      frequency: req.body.frequency,
      quiet_hours_start: req.body.quiet_hours_start,
      quiet_hours_end: req.body.quiet_hours_end,
      language: req.body.language
    };
    
    const preferences = await preferenceManager.updatePreferences(userId, preferencesData);
    
    // Parse preferred_channels for response
    const responsePreferences = { ...preferences };
    if (typeof responsePreferences.preferred_channels === 'string') {
      try {
        responsePreferences.preferred_channels = JSON.parse(responsePreferences.preferred_channels);
      } catch (e) {
        responsePreferences.preferred_channels = ['in_app'];
      }
    }
    
    res.json({
      success: true,
      preferences: responsePreferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      message: error.message || 'An error occurred while updating preferences'
    });
  }
});

// Get emergency contacts
router.get('/emergency-contacts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const contacts = await EmergencyContact.findByUserId(pool, userId);
    
    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency contacts',
      message: error.message
    });
  }
});

// Add emergency contact
router.post('/emergency-contacts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const contact = await EmergencyContact.create(pool, {
      ...req.body,
      user_id: userId
    });
    
    res.json({
      success: true,
      contact,
      message: 'Emergency contact added successfully'
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add emergency contact',
      message: error.message
    });
  }
});

// Update emergency contact
router.put('/emergency-contacts/:contactId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contactId } = req.params;
    const contact = await EmergencyContact.update(pool, contactId, userId, req.body);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Emergency contact not found'
      });
    }
    
    res.json({
      success: true,
      contact,
      message: 'Emergency contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update emergency contact',
      message: error.message
    });
  }
});

// Delete emergency contact
router.delete('/emergency-contacts/:contactId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contactId } = req.params;
    const contact = await EmergencyContact.delete(pool, contactId, userId);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Emergency contact not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete emergency contact',
      message: error.message
    });
  }
});

// Trigger emergency alert (for testing or manual trigger)
router.post('/emergency-alert', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { emotion, severity, confidence_score } = req.body;
    
    const emotionData = {
      emotion: emotion || 'unknown',
      severity: severity || 'critical',
      confidence_score: confidence_score || 0.9,
      timestamp: new Date().toISOString()
    };
    
    const result = await emergencyHandler.handleEmergencyAlert(userId, emotionData);
    
    res.json({
      success: true,
      ...result,
      message: 'Emergency alert sent successfully'
    });
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send emergency alert',
      message: error.message
    });
  }
});

// Schedule a notification
router.post('/schedule', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationData, schedule } = req.body;
    
    let jobId;
    if (schedule.frequency === 'onetime') {
      jobId = await scheduler.scheduleOneTimeNotification(userId, notificationData, schedule.scheduledTime);
    } else {
      jobId = await scheduler.scheduleRecurringNotification(userId, notificationData, schedule);
    }
    
    res.json({
      success: true,
      jobId,
      message: 'Notification scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule notification',
      message: error.message
    });
  }
});

// Cancel scheduled notification
router.delete('/schedule/:jobId', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    await scheduler.cancelScheduledNotification(jobId);
    
    res.json({
      success: true,
      message: 'Scheduled notification cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled notification',
      message: error.message
    });
  }
});

// Get scheduled notifications for user
router.get('/schedule', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(`
      SELECT * FROM scheduled_notifications 
      WHERE user_id = $1 AND is_active = true
      ORDER BY next_run_at ASC
    `, [userId]);

    const scheduled = result.rows.map(row => ({
      ...row,
      notification_data: typeof row.notification_data === 'string' 
        ? JSON.parse(row.notification_data) 
        : row.notification_data,
      schedule_config: typeof row.schedule_config === 'string'
        ? JSON.parse(row.schedule_config)
        : row.schedule_config
    }));

    res.json({
      success: true,
      scheduled: scheduled
    });
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled notifications',
      message: error.message
    });
  }
});

module.exports = router;

