/**
 * LanguageDetectionService
 * Detects language from voice input text
 */
const LanguageMetadata = require('../models/LanguageMetadata');

class LanguageDetectionService {
  constructor() {
    // Language keywords for detection
    this.keywords = {
      'en': ['how', 'am', 'feeling', 'emotion', 'week', 'month', 'help', 'meditation', 'relaxation', 'show', 'start', 'open', 'mood', 'trends', 'advice'],
      'es': ['como', 'estoy', 'sintiendo', 'emocion', 'semana', 'mes', 'ayuda', 'meditacion', 'relajacion', 'mostrar', 'iniciar', 'abrir', 'estado', 'tendencias', 'consejo'],
      'fr': ['comment', 'suis', 'ressentir', 'emotion', 'semaine', 'mois', 'aide', 'meditation', 'relaxation', 'afficher', 'demarrer', 'ouvrir', 'humeur', 'tendances', 'conseil'],
      'de': ['wie', 'bin', 'fühlen', 'emotion', 'woche', 'monat', 'hilfe', 'meditation', 'entspannung', 'zeigen', 'starten', 'öffnen', 'stimmung', 'trends', 'rat']
    };
  }

  /**
   * Detect language from text
   */
  detect(text) {
    if (!text || typeof text !== 'string') {
      return new LanguageMetadata({
        detected_language: 'en',
        confidence: 0.5
      });
    }

    const normalizedText = text.toLowerCase();
    const scores = {};

    // Score each language based on keyword matches
    for (const [lang, keywords] of Object.entries(this.keywords)) {
      scores[lang] = 0;
      for (const keyword of keywords) {
        if (normalizedText.includes(keyword)) {
          scores[lang] += 1;
        }
      }
    }

    // Find language with highest score
    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    // Calculate confidence based on score
    const totalKeywords = this.keywords[detectedLang].length;
    const confidence = maxScore > 0 
      ? Math.min(0.95, 0.5 + (maxScore / totalKeywords) * 0.45)
      : 0.5;

    return new LanguageMetadata({
      detected_language: detectedLang,
      confidence,
      source_text: text
    });
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.keywords);
  }
}

module.exports = LanguageDetectionService;

