/**
 * EmergencyAlertController
 * Handles HTTP requests for emergency alert system
 */
const DistressDetectionService = require('../services/DistressDetectionService');
const EmergencyAlertService = require('../services/EmergencyAlertService');
const CrisisRecommendationService = require('../services/CrisisRecommendationService');
const EmergencyPreferenceService = require('../services/EmergencyPreferenceService');
const EmergencyContact = require('../../notifications_module/models/EmergencyContact');
const pool = require('../../../config/database');

class EmergencyAlertController {
  constructor() {
    this.distressDetection = new DistressDetectionService();
    this.alertService = new EmergencyAlertService();
    this.recommendationService = new CrisisRecommendationService();
    this.preferenceService = new EmergencyPreferenceService();
  }

  /**
   * GET /emergency-alert/preferences
   * Get user's emergency alert preferences
   */
  async getPreferences(req, res) {
    try {
      const userId = req.user.userId;
      const preferences = await this.preferenceService.getPreferences(userId);
      
      res.json({
        success: true,
        preferences
      });
    } catch (error) {
      console.error('Error fetching emergency preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch preferences',
        message: error.message
      });
    }
  }

  /**
   * POST /emergency-alert/preferences/update
   * Update user's emergency alert preferences
   */
  async updatePreferences(req, res) {
    try {
      const userId = req.user.userId;
      const preferences = await this.preferenceService.updatePreferences(userId, req.body);
      
      res.json({
        success: true,
        preferences,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating emergency preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences',
        message: error.message
      });
    }
  }

  /**
   * POST /emergency-alert/contacts/add
   * Add emergency contact (uses existing EmergencyContact model)
   */
  async addContact(req, res) {
    try {
      const userId = req.user.userId;
      const contact = await EmergencyContact.create(pool, {
        user_id: userId,
        ...req.body
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
  }

  /**
   * POST /emergency-alert/contacts/delete
   * Delete emergency contact
   */
  async deleteContact(req, res) {
    try {
      const userId = req.user.userId;
      const contactId = req.body.contactId || req.params.contactId;
      
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
  }

  /**
   * POST /emergency-alert/trigger
   * Manually trigger emergency alert or process automatic detection
   */
  async triggerAlert(req, res) {
    try {
      const userId = req.user.userId;
      const { emotionData, manual } = req.body;

      // Check if detection is enabled
      const isEnabled = await this.preferenceService.isDetectionEnabled(userId);
      if (!isEnabled && !manual) {
        return res.json({
          success: false,
          message: 'Emergency detection is disabled',
          shouldAlert: false
        });
      }

      let distressResult;
      
      if (manual) {
        // Manual trigger
        const alertResult = await this.alertService.triggerManualAlert(userId, 'manual_trigger');
        return res.json({
          success: true,
          message: 'Emergency alert triggered manually',
          alertResult
        });
      } else {
        // Automatic detection from emotion data
        if (!emotionData) {
          return res.status(400).json({
            success: false,
            error: 'Emotion data is required for automatic detection'
          });
        }

        // Analyze distress
        distressResult = await this.distressDetection.analyzeDistress(userId, emotionData);

        if (distressResult.shouldAlert) {
          // Get user preferences for alert methods
          const preferences = await this.preferenceService.getPreferences(userId);
          const alertMethods = preferences.alert_methods || ['sms', 'email'];

          // Send alerts
          const alertResult = await this.alertService.sendEmergencyAlerts(
            userId,
            distressResult,
            alertMethods
          );

          // Get crisis recommendations
          const userLanguage = await this.getUserLanguage(userId);
          const recommendations = await this.recommendationService.getRecommendations(
            userId,
            userLanguage
          );

          return res.json({
            success: true,
            shouldAlert: true,
            distressResult,
            alertResult,
            recommendations,
            message: 'Emergency alert triggered and contacts notified'
          });
        } else {
          return res.json({
            success: true,
            shouldAlert: false,
            distressResult,
            message: 'Distress detected but below emergency threshold'
          });
        }
      }
    } catch (error) {
      console.error('Error triggering emergency alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger emergency alert',
        message: error.message
      });
    }
  }

  /**
   * GET /emergency-alert/recommendations
   * Get crisis recommendations for user
   */
  async getRecommendations(req, res) {
    try {
      const userId = req.user.userId;
      const language = req.query.language || await this.getUserLanguage(userId);
      
      const recommendations = await this.recommendationService.getRecommendations(
        userId,
        language
      );
      
      res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendations',
        message: error.message
      });
    }
  }

  /**
   * Helper: Get user language
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
      return 'en';
    }
  }
}

module.exports = EmergencyAlertController;

