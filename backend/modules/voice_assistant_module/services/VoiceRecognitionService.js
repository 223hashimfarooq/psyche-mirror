/**
 * VoiceRecognitionService
 * Handles voice recognition (speech-to-text)
 * Note: Actual recognition happens on frontend using Web Speech API
 * This service provides backend support for processing recognized text
 */
class VoiceRecognitionService {
  constructor() {
    this.supportedLanguages = ['en', 'es', 'fr', 'de'];
  }

  /**
   * Validate recognized text
   */
  validateText(text) {
    if (!text || typeof text !== 'string') {
      return {
        valid: false,
        error: 'No text provided'
      };
    }

    if (text.trim().length === 0) {
      return {
        valid: false,
        error: 'Empty text'
      };
    }

    if (text.length > 500) {
      return {
        valid: false,
        error: 'Text too long'
      };
    }

    return {
      valid: true
    };
  }

  /**
   * Get supported languages for speech recognition
   */
  getSupportedLanguages() {
    return this.supportedLanguages.map(lang => ({
      code: lang,
      name: this.getLanguageName(lang)
    }));
  }

  /**
   * Get language name
   */
  getLanguageName(code) {
    const names = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German'
    };
    return names[code] || code;
  }

  /**
   * Get Web Speech API language code
   */
  getWebSpeechLanguageCode(language) {
    const codes = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    return codes[language] || 'en-US';
  }
}

module.exports = VoiceRecognitionService;

