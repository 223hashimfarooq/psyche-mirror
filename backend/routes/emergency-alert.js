/**
 * Emergency Alert Routes
 * Handles all emergency alert system endpoints
 */
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const EmergencyAlertController = require('../modules/emergency_alert_module/controllers/EmergencyAlertController');

const controller = new EmergencyAlertController();

// Get emergency alert preferences
router.get('/preferences', verifyToken, (req, res) => controller.getPreferences(req, res));

// Update emergency alert preferences
router.post('/preferences/update', verifyToken, (req, res) => controller.updatePreferences(req, res));

// Add emergency contact
router.post('/contacts/add', verifyToken, (req, res) => controller.addContact(req, res));

// Delete emergency contact
router.post('/contacts/delete', verifyToken, (req, res) => controller.deleteContact(req, res));

// Trigger emergency alert (automatic or manual)
router.post('/trigger', verifyToken, (req, res) => controller.triggerAlert(req, res));

// Get crisis recommendations
router.get('/recommendations', verifyToken, (req, res) => controller.getRecommendations(req, res));

module.exports = router;

