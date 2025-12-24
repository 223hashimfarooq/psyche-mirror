/**
 * VoiceNavigationService
 * Handles voice-controlled navigation
 */
class VoiceNavigationService {
  constructor() {
    // Navigation target mappings - comprehensive list of all routes
    this.navigationTargets = {
      'en': {
        'dashboard': '/patient/dashboard',
        'home': '/patient/dashboard',
        'main': '/patient/dashboard',
        'therapy': '/patient/therapy',
        'therapy-recommendation': '/patient/therapy-recommendation',
        'therapy recommendation': '/patient/therapy-recommendation',
        'recommendation': '/patient/therapy-recommendation',
        'analyze': '/patient/analyze',
        'analysis': '/patient/analyze',
        'emotion analysis': '/patient/analyze',
        'emotion': '/patient/analyze',
        'settings': '/patient/settings',
        'setting': '/patient/settings',
        'notifications': '/patient/notifications',
        'notification': '/patient/notifications',
        'notification settings': '/patient/notification-settings',
        'notification-settings': '/patient/notification-settings',
        'privacy': '/patient/privacy',
        'privacy settings': '/patient/privacy',
        'emergency contacts': '/patient/emergency-contacts',
        'emergency-contacts': '/patient/emergency-contacts',
        'emergency hotline': '/patient/emergency-hotline',
        'emergency-hotline': '/patient/emergency-hotline',
        'contact doctor': '/patient/contact-doctor',
        'contact-doctor': '/patient/contact-doctor',
        'scheduled notifications': '/patient/scheduled-notifications',
        'scheduled-notifications': '/patient/scheduled-notifications',
        'chart': '/patient/dashboard',
        'mood chart': '/patient/dashboard',
        'emotional trends': '/patient/dashboard',
        'trends': '/patient/dashboard',
        'graph': '/patient/dashboard',
        'statistics': '/patient/dashboard'
      },
      'es': {
        'panel': '/patient/dashboard',
        'inicio': '/patient/dashboard',
        'principal': '/patient/dashboard',
        'terapia': '/patient/therapy',
        'recomendación': '/patient/therapy-recommendation',
        'recomendación de terapia': '/patient/therapy-recommendation',
        'analizar': '/patient/analyze',
        'análisis': '/patient/analyze',
        'análisis emocional': '/patient/analyze',
        'emoción': '/patient/analyze',
        'configuración': '/patient/settings',
        'ajustes': '/patient/settings',
        'notificaciones': '/patient/notifications',
        'configuración de notificaciones': '/patient/notification-settings',
        'privacidad': '/patient/privacy',
        'configuración de privacidad': '/patient/privacy',
        'contactos de emergencia': '/patient/emergency-contacts',
        'línea de emergencia': '/patient/emergency-hotline',
        'contactar doctor': '/patient/contact-doctor',
        'notificaciones programadas': '/patient/scheduled-notifications',
        'gráfico': '/patient/dashboard',
        'tendencias': '/patient/dashboard',
        'estadísticas': '/patient/dashboard'
      },
      'fr': {
        'tableau': '/patient/dashboard',
        'accueil': '/patient/dashboard',
        'principal': '/patient/dashboard',
        'thérapie': '/patient/therapy',
        'recommandation': '/patient/therapy-recommendation',
        'recommandation de thérapie': '/patient/therapy-recommendation',
        'analyser': '/patient/analyze',
        'analyse': '/patient/analyze',
        'analyse émotionnelle': '/patient/analyze',
        'émotion': '/patient/analyze',
        'paramètres': '/patient/settings',
        'notifications': '/patient/notifications',
        'paramètres de notification': '/patient/notification-settings',
        'confidentialité': '/patient/privacy',
        'paramètres de confidentialité': '/patient/privacy',
        'contacts d\'urgence': '/patient/emergency-contacts',
        'ligne d\'urgence': '/patient/emergency-hotline',
        'contacter le médecin': '/patient/contact-doctor',
        'notifications programmées': '/patient/scheduled-notifications',
        'graphique': '/patient/dashboard',
        'tendances': '/patient/dashboard',
        'statistiques': '/patient/dashboard'
      },
      'de': {
        'dashboard': '/patient/dashboard',
        'startseite': '/patient/dashboard',
        'hauptseite': '/patient/dashboard',
        'therapie': '/patient/therapy',
        'empfehlung': '/patient/therapy-recommendation',
        'therapieempfehlung': '/patient/therapy-recommendation',
        'analysieren': '/patient/analyze',
        'analyse': '/patient/analyze',
        'emotionsanalyse': '/patient/analyze',
        'emotion': '/patient/analyze',
        'einstellungen': '/patient/settings',
        'benachrichtigungen': '/patient/notifications',
        'benachrichtigungseinstellungen': '/patient/notification-settings',
        'datenschutz': '/patient/privacy',
        'datenschutzeinstellungen': '/patient/privacy',
        'notfallkontakte': '/patient/emergency-contacts',
        'notruf': '/patient/emergency-hotline',
        'arzt kontaktieren': '/patient/contact-doctor',
        'geplante benachrichtigungen': '/patient/scheduled-notifications',
        'diagramm': '/patient/dashboard',
        'trends': '/patient/dashboard',
        'statistiken': '/patient/dashboard'
      }
    };
  }

  /**
   * Get navigation path from voice command
   */
  getNavigationPath(target, language = 'en') {
    const targets = this.navigationTargets[language] || this.navigationTargets['en'];
    const normalizedTarget = target.toLowerCase().trim();
    
    console.log('🔍 Looking for navigation target:', normalizedTarget, 'in language:', language);
    
    // Direct match
    if (targets[normalizedTarget]) {
      console.log('✅ Direct match found:', targets[normalizedTarget]);
      return targets[normalizedTarget];
    }

    // Try matching individual words
    const targetWords = normalizedTarget.split(/\s+/);
    for (const word of targetWords) {
      if (word.length > 2 && targets[word]) {
        console.log('✅ Word match found:', word, '->', targets[word]);
        return targets[word];
      }
    }

    // Partial match - check if target contains any key or vice versa
    for (const [key, path] of Object.entries(targets)) {
      // Check if target contains the key
      if (normalizedTarget.includes(key) && key.length > 2) {
        console.log('✅ Partial match (target contains key):', key, '->', path);
        return path;
      }
      // Check if key contains the target
      if (key.includes(normalizedTarget) && normalizedTarget.length > 2) {
        console.log('✅ Partial match (key contains target):', key, '->', path);
        return path;
      }
      // Check if any word in target matches the key
      for (const word of targetWords) {
        if (word.length > 2 && (key.includes(word) || word.includes(key))) {
          console.log('✅ Word-based match:', word, 'with', key, '->', path);
          return path;
        }
      }
    }

    // Try fuzzy matching for common variations
    const fuzzyMatches = {
      'en': {
        'therapy': ['therapy', 'therapies', 'therapeutic'],
        'analyze': ['analyze', 'analysis', 'analyzing', 'analyses'],
        'notification': ['notification', 'notifications', 'notify', 'alerts', 'alert'],
        'privacy': ['privacy', 'private', 'confidential'],
        'emergency': ['emergency', 'emergencies', 'urgent', 'hotline'],
        'contact': ['contact', 'contacts', 'connect', 'doctor', 'doctors'],
        'scheduled': ['scheduled', 'schedule', 'scheduling'],
        'recommendation': ['recommendation', 'recommendations', 'recommended'],
        'settings': ['settings', 'setting', 'config', 'configuration'],
      }
    };

    const fuzzy = fuzzyMatches[language] || fuzzyMatches['en'];
    for (const [baseWord, variations] of Object.entries(fuzzy)) {
      for (const variation of variations) {
        if (normalizedTarget.includes(variation) || variation.includes(normalizedTarget)) {
          // Try to find a route that contains this base word
          for (const [key, path] of Object.entries(targets)) {
            if (key.includes(baseWord) || baseWord.includes(key)) {
              console.log('✅ Fuzzy match:', variation, '->', key, '->', path);
              return path;
            }
          }
        }
      }
    }
    
    // Last resort: check if any word in the target matches any key
    for (const word of targetWords) {
      if (word.length > 3) { // Only check words longer than 3 characters
        for (const [key, path] of Object.entries(targets)) {
          if (key.includes(word) || word.includes(key)) {
            console.log('✅ Last resort word match:', word, '->', key, '->', path);
            return path;
          }
        }
      }
    }

    console.log('⚠️ No match found, defaulting to dashboard');
    // Default to dashboard
    return '/patient/dashboard';
  }

  /**
   * Parse navigation command
   */
  parseNavigationCommand(text, language = 'en') {
    const navigationKeywords = {
      'en': ['open', 'go to', 'navigate', 'show', 'display', 'view'],
      'es': ['abrir', 'ir a', 'navegar', 'mostrar', 'ver'],
      'fr': ['ouvrir', 'aller', 'naviguer', 'afficher', 'voir'],
      'de': ['öffnen', 'gehen', 'navigieren', 'zeigen', 'anzeigen']
    };

    const keywords = navigationKeywords[language] || navigationKeywords['en'];
    let target = 'dashboard';

    // Extract target from text
    for (const keyword of keywords) {
      const index = text.toLowerCase().indexOf(keyword);
      if (index !== -1) {
        const afterKeyword = text.substring(index + keyword.length).trim();
        // Get first few words as target
        const words = afterKeyword.split(/\s+/).slice(0, 3).join(' ');
        target = words;
        break;
      }
    }

    return {
      target,
      path: this.getNavigationPath(target, language)
    };
  }
}

module.exports = VoiceNavigationService;

