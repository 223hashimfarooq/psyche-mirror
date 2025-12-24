/**
 * VoiceAssistantController
 * Handles HTTP requests for voice assistant functionality
 */
const NLUService = require('../services/NLUService');
const VoiceCommandRouter = require('../services/VoiceCommandRouter');
const TextToSpeechService = require('../services/TextToSpeechService');
const VoiceCommand = require('../models/VoiceCommand');
const AssistantResponseService = require('../services/AssistantResponseService');
const pool = require('../../../config/database');

class VoiceAssistantController {
  constructor() {
    this.nluService = new NLUService();
    this.commandRouter = new VoiceCommandRouter();
    this.ttsService = new TextToSpeechService();
    this.responseService = new AssistantResponseService();
  }

  /**
   * POST /voice/process
   * Process voice command text
   */
  async processVoiceCommand(req, res) {
    try {
      const { text, language } = req.body;
      const userId = req.user.userId;

      console.log('🎤 Voice command received:', { text, language, userId });

      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Missing text',
          message: 'Voice command text is required'
        });
      }

      // Process with NLU
      console.log('🔍 Processing with NLU...');
      const nluResult = await this.nluService.process(text, userId);
      console.log('✅ NLU result:', JSON.stringify(nluResult, null, 2));
      
      if (!nluResult.success) {
        return res.status(400).json({
          success: false,
          error: 'NLU processing failed',
          message: nluResult.error
        });
      }

      // Save command to database
      console.log('💾 Saving to database...');
      console.log('Entities type:', typeof nluResult.entities, 'Value:', nluResult.entities);
      const voiceCommand = await VoiceCommand.create(pool, {
        user_id: userId,
        raw_text: text,
        processed_text: nluResult.text,
        intent: nluResult.intent,
        entities: nluResult.entities,
        confidence: nluResult.intent_confidence,
        language: nluResult.language,
        status: 'processing'
      });
      console.log('✅ Command saved:', voiceCommand.id);

      // Route command (pass raw text for fallback navigation detection)
      console.log('🔀 Routing command with:', {
        intent: nluResult.intent,
        entities: nluResult.entities,
        language: nluResult.language,
        rawText: text
      });
      
      const routeResult = await this.commandRouter.route(
        nluResult.intent,
        nluResult.entities,
        userId,
        nluResult.language,
        text // Pass raw text for fallback detection
      );
      
      console.log('✅ Route result:', {
        action_required: routeResult.action_required,
        action_type: routeResult.action_type,
        action_params: routeResult.action_params,
        response_text: routeResult.response_text
      });

      // Update command status
      await VoiceCommand.updateStatus(pool, voiceCommand.id, 'completed', {
        response_text: routeResult.response_text
      });

      // Generate TTS metadata
      const ttsResult = await this.ttsService.synthesize(
        routeResult.response_text,
        nluResult.language
      );

      const response = {
        success: true,
        command_id: voiceCommand.id,
        intent: nluResult.intent,
        response_text: routeResult.response_text,
        response_data: routeResult.response_data,
        action_required: routeResult.action_required || false,
        action_type: routeResult.action_type || null,
        action_params: routeResult.action_params || null,
        tts: ttsResult,
        language: nluResult.language
      };
      
      console.log('📤 Sending response to frontend:', JSON.stringify(response, null, 2));
      
      res.json(response);

    } catch (error) {
      console.error('Voice command processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Voice command processing failed',
        message: error.message
      });
    }
  }

  /**
   * POST /voice/trigger-action
   * Trigger an action from voice command
   */
  async triggerAction(req, res) {
    try {
      const { action_type, action_params } = req.body;
      const userId = req.user.userId;

      if (!action_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing action type',
          message: 'Action type is required'
        });
      }

      let result = {
        success: true,
        action_type,
        message: 'Action triggered successfully'
      };

      // Handle different action types
      switch (action_type) {
        case 'navigate':
          result.navigation_path = action_params.path || '/patient/dashboard';
          break;
        
        case 'start_meditation':
          result.meditation_started = true;
          break;
        
        case 'start_breathing':
          result.breathing_started = true;
          break;
        
        case 'show_chart':
          result.chart_type = action_params.chart_type || 'mood';
          break;
        
        default:
          result.message = 'Action type not recognized';
      }

      res.json(result);

    } catch (error) {
      console.error('Action trigger error:', error);
      res.status(500).json({
        success: false,
        error: 'Action trigger failed',
        message: error.message
      });
    }
  }

  /**
   * GET /voice/history
   * Get voice command history
   */
  async getCommandHistory(req, res) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 20;

      const commands = await VoiceCommand.findByUserId(pool, userId, { limit });

      res.json({
        success: true,
        commands,
        total: commands.length
      });

    } catch (error) {
      console.error('Error fetching command history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch command history',
        message: error.message
      });
    }
  }

  /**
   * GET /voice/supported-languages
   * Get supported languages
   */
  async getSupportedLanguages(req, res) {
    try {
      const VoiceRecognitionService = require('../services/VoiceRecognitionService');
      const recognitionService = new VoiceRecognitionService();
      
      const languages = recognitionService.getSupportedLanguages();

      res.json({
        success: true,
        languages
      });

    } catch (error) {
      console.error('Error fetching supported languages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch supported languages',
        message: error.message
      });
    }
  }
}

module.exports = VoiceAssistantController;

