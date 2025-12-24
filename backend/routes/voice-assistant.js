/**
 * Voice Assistant Routes
 */
const express = require('express');
const router = express.Router();
const VoiceAssistantController = require('../modules/voice_assistant_module/controllers/VoiceAssistantController');
const { verifyToken } = require('../middleware/auth');

const controller = new VoiceAssistantController();

// Process voice command
router.post('/process', verifyToken, (req, res) => {
  controller.processVoiceCommand(req, res);
});

// Trigger action from voice command
router.post('/trigger-action', verifyToken, (req, res) => {
  controller.triggerAction(req, res);
});

// Get command history
router.get('/history', verifyToken, (req, res) => {
  controller.getCommandHistory(req, res);
});

// Get supported languages
router.get('/supported-languages', verifyToken, (req, res) => {
  controller.getSupportedLanguages(req, res);
});

module.exports = router;

