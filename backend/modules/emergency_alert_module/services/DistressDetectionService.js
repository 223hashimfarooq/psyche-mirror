/**
 * DistressDetectionService
 * Monitors emotion analysis results and detects extreme distress
 */
const MultimodalFusionEngine = require('./MultimodalFusionEngine');
const pool = require('../../../config/database');

class DistressDetectionService {
  constructor() {
    this.fusionEngine = new MultimodalFusionEngine();
    this.detectionHistory = new Map(); // In-memory cache for recent detections (userId -> history)
  }

  /**
   * Analyze emotion data and determine if emergency alert should be triggered
   * @param {number} userId - User ID
   * @param {Object} emotionData - Combined emotion analysis result
   * @returns {Object} Distress detection result
   */
  async analyzeDistress(userId, emotionData) {
    try {
      // Extract multimodal data
      const facialData = emotionData.details?.facial || emotionData.facial || null;
      const voiceData = emotionData.details?.voice || emotionData.voice || null;
      const textData = emotionData.details?.text || emotionData.text || null;

      // Fuse signals
      const fusionResult = this.fusionEngine.fuseSignals(facialData, voiceData, textData);

      // Check if emergency threshold is exceeded
      const shouldAlert = this.shouldTriggerEmergency(fusionResult);

      // Store detection history
      this.recordDetection(userId, fusionResult);

      return {
        shouldAlert,
        fusionResult,
        recommendation: this.getRecommendation(fusionResult)
      };
    } catch (error) {
      console.error('Error analyzing distress:', error);
      return {
        shouldAlert: false,
        fusionResult: null,
        error: error.message
      };
    }
  }

  /**
   * Determine if emergency alert should be triggered
   */
  shouldTriggerEmergency(fusionResult) {
    if (!fusionResult) return false;

    // Trigger if crisis detected
    if (fusionResult.isCrisis) {
      return true;
    }

    // Trigger if severity is critical
    if (fusionResult.severity === 'critical') {
      return true;
    }

    // Trigger if combined score exceeds threshold
    if (fusionResult.combinedScore >= 0.80) {
      return true;
    }

    // Check for sustained high distress
    return this.checkSustainedDistress(fusionResult);
  }

  /**
   * Check if user has been in high distress state for sustained period
   */
  checkSustainedDistress(fusionResult) {
    // This would check recent history - simplified for now
    // In production, would check database for recent high-distress detections
    return false;
  }

  /**
   * Record detection in history
   */
  recordDetection(userId, fusionResult) {
    if (!this.detectionHistory.has(userId)) {
      this.detectionHistory.set(userId, []);
    }

    const history = this.detectionHistory.get(userId);
    history.push({
      timestamp: new Date().toISOString(),
      score: fusionResult.combinedScore,
      severity: fusionResult.severity,
      isCrisis: fusionResult.isCrisis
    });

    // Keep only last 10 detections
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Get recommendation based on distress level
   */
  getRecommendation(fusionResult) {
    if (fusionResult.isCrisis || fusionResult.severity === 'critical') {
      return {
        type: 'immediate',
        message: 'crisis_detected',
        actions: ['contact_helpline', 'contact_emergency_contact', 'seek_professional_help']
      };
    } else if (fusionResult.severity === 'high') {
      return {
        type: 'urgent',
        message: 'high_distress_detected',
        actions: ['practice_breathing', 'contact_support', 'schedule_therapy']
      };
    } else {
      return {
        type: 'monitor',
        message: 'monitoring_recommended',
        actions: ['self_care', 'track_mood']
      };
    }
  }

  /**
   * Get user's recent distress history
   */
  async getDistressHistory(userId, limit = 10) {
    try {
      const query = `
        SELECT 
          id,
          emotion_type,
          emotion_value,
          confidence,
          combined_score,
          created_at
        FROM emotions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching distress history:', error);
      return [];
    }
  }
}

module.exports = DistressDetectionService;

