/**
 * MultimodalFusionEngine
 * Combines signals from facial, voice, and text analysis to detect extreme distress
 */
class MultimodalFusionEngine {
  constructor() {
    // Weights for different modalities (can be adjusted based on reliability)
    this.weights = {
      facial: 0.35,
      voice: 0.35,
      text: 0.30
    };

    // Critical emotion indicators
    this.criticalEmotions = ['anger', 'sad', 'anxious', 'fear', 'angry', 'depressed', 'suicidal'];
    
    // High-risk text keywords
    this.crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'want to die', 'no point',
      'hopeless', 'worthless', 'burden', 'better off without me',
      'self harm', 'cutting', 'overdose', 'give up'
    ];
  }

  /**
   * Fuse multimodal signals into a combined distress score
   * @param {Object} facialData - Facial emotion analysis result
   * @param {Object} voiceData - Voice emotion analysis result
   * @param {Object} textData - Text sentiment/emotion analysis result
   * @returns {Object} Combined distress assessment
   */
  fuseSignals(facialData, voiceData, textData) {
    try {
      const signals = {
        facial: this.extractFacialSignal(facialData),
        voice: this.extractVoiceSignal(voiceData),
        text: this.extractTextSignal(textData)
      };

      // Calculate weighted distress scores
      const distressScores = {
        facial: this.calculateDistressScore(signals.facial, 'facial'),
        voice: this.calculateDistressScore(signals.voice, 'voice'),
        text: this.calculateDistressScore(signals.text, 'text')
      };

      // Weighted average of distress scores
      const combinedScore = 
        (distressScores.facial * this.weights.facial) +
        (distressScores.voice * this.weights.voice) +
        (distressScores.text * this.weights.text);

      // Determine severity level
      const severity = this.determineSeverity(combinedScore, signals);

      // Check for crisis indicators
      const isCrisis = this.detectCrisis(signals, combinedScore);

      // Determine primary emotion
      const primaryEmotion = this.determinePrimaryEmotion(signals);

      return {
        combinedScore: Math.min(1.0, Math.max(0.0, combinedScore)),
        severity,
        isCrisis,
        primaryEmotion,
        signals,
        distressScores,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fusing multimodal signals:', error);
      return {
        combinedScore: 0.0,
        severity: 'low',
        isCrisis: false,
        primaryEmotion: 'neutral',
        error: error.message
      };
    }
  }

  /**
   * Extract distress signal from facial analysis
   */
  extractFacialSignal(facialData) {
    if (!facialData) return null;

    const emotion = (facialData.emotion || facialData.detected_emotion || 'neutral').toLowerCase();
    const confidence = facialData.confidence || facialData.confidence_score || 0.5;
    
    return {
      emotion,
      confidence,
      modality: 'facial',
      raw: facialData
    };
  }

  /**
   * Extract distress signal from voice analysis
   */
  extractVoiceSignal(voiceData) {
    if (!voiceData) return null;

    const emotion = (voiceData.emotion || voiceData.detected_emotion || 'neutral').toLowerCase();
    const confidence = voiceData.confidence || voiceData.confidence_score || 0.5;
    const stressLevel = voiceData.stress_level || voiceData.stress || 0.5;
    
    return {
      emotion,
      confidence,
      stressLevel,
      modality: 'voice',
      raw: voiceData
    };
  }

  /**
   * Extract distress signal from text analysis
   */
  extractTextSignal(textData) {
    if (!textData) return null;

    const emotion = (textData.emotion || textData.sentiment || 'neutral').toLowerCase();
    const confidence = textData.confidence || textData.confidence_score || 0.5;
    const sentiment = textData.sentiment || 'neutral';
    const text = textData.text || textData.input || '';
    
    // Check for crisis keywords
    const hasCrisisKeywords = this.crisisKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
      emotion,
      confidence,
      sentiment,
      hasCrisisKeywords,
      modality: 'text',
      raw: textData
    };
  }

  /**
   * Calculate distress score for a single signal
   */
  calculateDistressScore(signal, modality) {
    if (!signal) return 0.0;

    let baseScore = 0.0;
    const emotion = signal.emotion || 'neutral';
    const confidence = signal.confidence || 0.5;

    // Critical emotions get high base scores
    if (this.criticalEmotions.includes(emotion)) {
      baseScore = 0.8;
    } else if (['disgust', 'surprise', 'fear'].includes(emotion)) {
      baseScore = 0.6;
    } else if (emotion === 'neutral') {
      baseScore = 0.3;
    } else {
      baseScore = 0.4;
    }

    // Adjust by confidence
    const adjustedScore = baseScore * confidence;

    // Modality-specific adjustments
    if (modality === 'text' && signal.hasCrisisKeywords) {
      return Math.min(1.0, adjustedScore + 0.3); // Boost for crisis keywords
    }

    if (modality === 'voice' && signal.stressLevel) {
      return Math.min(1.0, adjustedScore + (signal.stressLevel * 0.2));
    }

    return adjustedScore;
  }

  /**
   * Determine severity level from combined score and signals
   */
  determineSeverity(combinedScore, signals) {
    // Check for explicit crisis indicators
    if (signals.text?.hasCrisisKeywords) {
      return 'critical';
    }

    // Score-based severity
    if (combinedScore >= 0.85) {
      return 'critical';
    } else if (combinedScore >= 0.70) {
      return 'high';
    } else if (combinedScore >= 0.50) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Detect if current state indicates a crisis
   */
  detectCrisis(signals, combinedScore) {
    // Crisis if combined score is very high
    if (combinedScore >= 0.85) {
      return true;
    }

    // Crisis if text contains crisis keywords
    if (signals.text?.hasCrisisKeywords) {
      return true;
    }

    // Crisis if multiple modalities show critical emotions with high confidence
    const criticalCount = [
      signals.facial,
      signals.voice,
      signals.text
    ].filter(s => 
      s && 
      this.criticalEmotions.includes(s.emotion) && 
      (s.confidence || 0) > 0.7
    ).length;

    return criticalCount >= 2;
  }

  /**
   * Determine primary emotion from all signals
   */
  determinePrimaryEmotion(signals) {
    const emotions = [];
    
    if (signals.facial?.emotion) emotions.push(signals.facial.emotion);
    if (signals.voice?.emotion) emotions.push(signals.voice.emotion);
    if (signals.text?.emotion) emotions.push(signals.text.emotion);

    // Count occurrences
    const emotionCounts = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    // Return most common emotion, or first critical emotion found
    const criticalEmotion = emotions.find(e => this.criticalEmotions.includes(e));
    if (criticalEmotion) return criticalEmotion;

    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'neutral';
  }
}

module.exports = MultimodalFusionEngine;

