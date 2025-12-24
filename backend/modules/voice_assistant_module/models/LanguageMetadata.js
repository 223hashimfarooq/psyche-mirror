/**
 * LanguageMetadata Model
 * Stores language detection and translation metadata
 */
class LanguageMetadata {
  constructor(data) {
    this.detected_language = data.detected_language || 'en';
    this.confidence = data.confidence || 0.0;
    this.source_text = data.source_text;
    this.translated_text = data.translated_text;
    this.target_language = data.target_language || 'en';
  }

  static detect(text) {
    // Simple language detection based on common patterns
    // In production, use a proper language detection library
    const patterns = {
      'es': /\b(como|estoy|sentir|emocion|semana|mes|ayuda|meditacion|relajacion)\b/i,
      'fr': /\b(comment|suis|sentir|emotion|semaine|mois|aide|meditation|relaxation)\b/i,
      'de': /\b(wie|bin|fühlen|emotion|woche|monat|hilfe|meditation|entspannung)\b/i,
      'en': /\b(how|am|feeling|emotion|week|month|help|meditation|relaxation)\b/i
    };

    let maxMatches = 0;
    let detectedLang = 'en';

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = (text.match(pattern) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLang = lang;
      }
    }

    return new LanguageMetadata({
      detected_language: detectedLang,
      confidence: maxMatches > 0 ? Math.min(0.9, maxMatches / 5) : 0.5,
      source_text: text
    });
  }
}

module.exports = LanguageMetadata;

