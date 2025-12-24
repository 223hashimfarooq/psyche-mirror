/**
 * MessageTranslator
 * Provides language-specific messages for notifications
 */
const fs = require('fs');
const path = require('path');

class MessageTranslator {
  constructor() {
    this.messages = {};
    this.loadMessages();
  }

  loadMessages() {
    const localesPath = path.join(__dirname, '../../../..', 'frontend/src/i18n/locales');
    const languages = ['en', 'es', 'fr', 'de'];
    
    for (const lang of languages) {
      try {
        const filePath = path.join(localesPath, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          this.messages[lang] = JSON.parse(content);
        }
      } catch (error) {
        console.error(`Error loading messages for ${lang}:`, error);
      }
    }
  }

  /**
   * Get translated message
   */
  getMessage(language, key, fallback = null) {
    const lang = language || 'en';
    const keys = key.split('.');
    let value = this.messages[lang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }

    if (value) {
      return value;
    }

    // Fallback to English
    if (lang !== 'en') {
      value = this.messages['en'];
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = null;
          break;
        }
      }
    }

    return value || fallback || key;
  }

  /**
   * Get motivational message based on emotion
   */
  getMotivationalMessage(language, emotion) {
    const key = `notifications.motivational.${emotion}`;
    return this.getMessage(language, key, `You're doing great! Keep taking care of yourself.`);
  }

  /**
   * Get affirmation message
   */
  getAffirmation(language) {
    const affirmations = [
      'notifications.affirmations.1',
      'notifications.affirmations.2',
      'notifications.affirmations.3',
      'notifications.affirmations.4',
      'notifications.affirmations.5'
    ];
    const randomKey = affirmations[Math.floor(Math.random() * affirmations.length)];
    return this.getMessage(language, randomKey, 'You are strong and capable.');
  }

  /**
   * Get self-care reminder
   */
  getSelfCareReminder(language, type) {
    const key = `notifications.selfCare.${type}`;
    return this.getMessage(language, key, 'Remember to take a moment for yourself today.');
  }

  /**
   * Get emergency alert template
   */
  getEmergencyTemplate(language, userName, emotion, severity) {
    const template = this.getMessage(language, 'notifications.emergency.template', 
      'URGENT: Critical emotional distress detected for {{userName}}. Emotion: {{emotion}}, Severity: {{severity}}');
    
    return template
      .replace('{{userName}}', userName)
      .replace('{{emotion}}', emotion)
      .replace('{{severity}}', severity);
  }
}

module.exports = new MessageTranslator();

