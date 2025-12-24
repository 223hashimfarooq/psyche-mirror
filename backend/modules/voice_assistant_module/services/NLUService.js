/**
 * NLUService
 * Natural Language Understanding service for parsing voice commands
 */
const LanguageDetectionService = require('./LanguageDetectionService');
const IntentClassificationService = require('./IntentClassificationService');

class NLUService {
  constructor() {
    this.languageDetector = new LanguageDetectionService();
    this.intentClassifier = new IntentClassificationService();
  }

  /**
   * Process natural language input
   */
  async process(text, userId = null) {
    try {
      // Detect language
      const languageMetadata = this.languageDetector.detect(text);
      
      // Normalize text
      const normalizedText = this.normalizeText(text, languageMetadata.detected_language);
      
      // Classify intent
      console.log('🎯 Classifying intent for text:', normalizedText);
      const intentResult = await this.intentClassifier.classify(
        normalizedText,
        languageMetadata.detected_language
      );
      console.log('✅ Intent classification result:', {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        entities: intentResult.entities
      });

      // Extract entities
      const entities = this.extractEntities(normalizedText, intentResult.intent, languageMetadata.detected_language);
      console.log('📦 Extracted entities:', entities);

      const finalEntities = {
        ...entities,
        ...intentResult.entities
      };
      
      console.log('📦 Final entities:', finalEntities);

      return {
        success: true,
        text: normalizedText,
        language: languageMetadata.detected_language,
        language_confidence: languageMetadata.confidence,
        intent: intentResult.intent,
        intent_confidence: intentResult.confidence,
        entities: finalEntities,
        raw_text: text
      };
    } catch (error) {
      console.error('NLU processing error:', error);
      return {
        success: false,
        error: error.message,
        text: text,
        language: 'en',
        intent: 'unknown',
        entities: {}
      };
    }
  }

  /**
   * Normalize text for processing
   */
  normalizeText(text, language) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Extract entities from text
   */
  extractEntities(text, intent, language) {
    const entities = {};

    // Extract time ranges
    const timePatterns = {
      'en': {
        'today': /\b(today|now|right now|current)\b/i,
        'week': /\b(week|this week|weekly|last week)\b/i,
        'month': /\b(month|this month|monthly|last month)\b/i,
        'all': /\b(all|ever|always|history)\b/i
      },
      'es': {
        'today': /\b(hoy|ahora|actualmente)\b/i,
        'week': /\b(semana|esta semana|semanal)\b/i,
        'month': /\b(mes|este mes|mensual)\b/i,
        'all': /\b(todo|siempre|historial)\b/i
      },
      'fr': {
        'today': /\b(aujourd'hui|maintenant|actuellement)\b/i,
        'week': /\b(semaine|cette semaine|hebdomadaire)\b/i,
        'month': /\b(mois|ce mois|mensuel)\b/i,
        'all': /\b(tout|toujours|historique)\b/i
      },
      'de': {
        'today': /\b(heute|jetzt|aktuell)\b/i,
        'week': /\b(woche|diese woche|wöchentlich)\b/i,
        'month': /\b(monat|diesen monat|monatlich)\b/i,
        'all': /\b(alle|immer|verlauf)\b/i
      }
    };

    const patterns = timePatterns[language] || timePatterns['en'];
    for (const [range, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        entities.time_range = range;
        break;
      }
    }

    // Extract emotion types
    const emotionPatterns = {
      'en': ['happy', 'sad', 'angry', 'anxious', 'stressed', 'calm', 'neutral', 'excited', 'tired'],
      'es': ['feliz', 'triste', 'enojado', 'ansioso', 'estresado', 'tranquilo', 'neutral', 'emocionado', 'cansado'],
      'fr': ['heureux', 'triste', 'en colère', 'anxieux', 'stressé', 'calme', 'neutre', 'excité', 'fatigué'],
      'de': ['glücklich', 'traurig', 'wütend', 'ängstlich', 'gestresst', 'ruhig', 'neutral', 'aufgeregt', 'müde']
    };

    const emotions = emotionPatterns[language] || emotionPatterns['en'];
    for (const emotion of emotions) {
      if (text.includes(emotion)) {
        entities.emotion_type = emotion;
        break;
      }
    }

    // Extract actions
    const actionPatterns = {
      'en': {
        'start_meditation': /\b(start|begin|launch).*meditation/i,
        'start_breathing': /\b(start|begin|do).*breathing/i,
        'show_chart': /\b(show|display|view|open).*(chart|graph|trend|visualization)/i,
        'mute_notifications': /\b(mute|disable|turn off).*notification/i
      },
      'es': {
        'start_meditation': /\b(iniciar|empezar|comenzar).*meditacion/i,
        'start_breathing': /\b(iniciar|hacer).*respiración/i,
        'show_chart': /\b(mostrar|ver|abrir).*(gráfico|gráfica|tendencia)/i,
        'mute_notifications': /\b(silenciar|desactivar).*notificación/i
      },
      'fr': {
        'start_meditation': /\b(démarrer|commencer|lancer).*méditation/i,
        'start_breathing': /\b(démarrer|faire).*respiration/i,
        'show_chart': /\b(afficher|voir|ouvrir).*(graphique|tendance)/i,
        'mute_notifications': /\b(couper|désactiver).*notification/i
      },
      'de': {
        'start_meditation': /\b(starten|beginnen).*meditation/i,
        'start_breathing': /\b(starten|machen).*atmung/i,
        'show_chart': /\b(zeigen|anzeigen|öffnen).*(diagramm|grafik|trend)/i,
        'mute_notifications': /\b(stumm|deaktivieren).*benachrichtigung/i
      }
    };

    const actionPatternsLang = actionPatterns[language] || actionPatterns['en'];
    for (const [action, pattern] of Object.entries(actionPatternsLang)) {
      if (pattern.test(text)) {
        entities.action = action;
        break;
      }
    }

    // Extract navigation target if intent is navigation
    if (intent === 'navigation') {
      const navigationKeywords = {
        'en': ['open', 'go to', 'navigate', 'show', 'display', 'view', 'take me to', 'switch to', 'go', 'navigate to'],
        'es': ['abrir', 'ir a', 'navegar', 'mostrar', 'ver', 'llévame a', 'cambiar a'],
        'fr': ['ouvrir', 'aller', 'naviguer', 'afficher', 'voir', 'emmène-moi à', 'changer pour'],
        'de': ['öffnen', 'gehen', 'navigieren', 'zeigen', 'anzeigen', 'bring mich zu', 'wechseln zu']
      };

      const keywords = navigationKeywords[language] || navigationKeywords['en'];
      let target = 'dashboard'; // default

      // Extract target from text - improved matching
      for (const keyword of keywords) {
        const index = text.toLowerCase().indexOf(keyword);
        if (index !== -1) {
          const afterKeyword = text.substring(index + keyword.length).trim();
          // Get first few words as target, but be smarter about it
          let words = afterKeyword.split(/\s+/).slice(0, 4).join(' ').toLowerCase();
          
          // Remove common stop words
          const stopWords = {
            'en': ['the', 'a', 'an', 'my', 'me', 'page', 'screen', 'the', 'to', 'page', 'screen'],
            'es': ['el', 'la', 'los', 'las', 'mi', 'mí', 'página', 'pantalla'],
            'fr': ['le', 'la', 'les', 'mon', 'ma', 'mes', 'page', 'écran'],
            'de': ['der', 'die', 'das', 'mein', 'meine', 'seite', 'bildschirm']
          };
          
          const stops = stopWords[language] || stopWords['en'];
          const cleanedWords = words.split(/\s+/)
            .filter(word => word.length > 0 && !stops.includes(word))
            .join(' ');
          
          if (cleanedWords) {
            target = cleanedWords;
            break;
          } else if (words) {
            target = words;
            break;
          }
        }
      }
      
      // Clean up target - remove any remaining navigation keywords that might have been included
      if (target && target !== 'dashboard') {
        const textLower = target.toLowerCase();
        for (const keyword of keywords) {
          if (textLower.includes(keyword)) {
            // Remove the keyword from target
            target = target.replace(new RegExp(keyword, 'gi'), '').trim();
            break;
          }
        }
        // Clean up any extra spaces
        target = target.replace(/\s+/g, ' ').trim();
      }

      // If no keyword found, try to extract target directly (e.g., "therapy", "analyze")
      if (target === 'dashboard' || !target || target.trim() === '') {
        // Common page names that might be said directly - expanded list
        const directTargets = {
          'en': [
            'therapy', 'therapies', 'therapeutic',
            'analyze', 'analysis', 'analyses', 'analyzing',
            'settings', 'setting', 'config', 'configuration',
            'notifications', 'notification', 'notify', 'alerts', 'alert',
            'privacy', 'private', 'confidential',
            'emergency', 'emergencies', 'urgent', 'hotline',
            'contact', 'contacts', 'doctor', 'doctors',
            'scheduled', 'schedule', 'scheduling',
            'recommendation', 'recommendations', 'recommended',
            'dashboard', 'home', 'main'
          ],
          'es': [
            'terapia', 'terapias', 'analizar', 'análisis', 'configuración', 'ajustes',
            'notificaciones', 'privacidad', 'emergencia', 'contacto', 'recomendación'
          ],
          'fr': [
            'thérapie', 'analyser', 'analyse', 'paramètres', 'notifications',
            'confidentialité', 'urgence', 'contact', 'recommandation'
          ],
          'de': [
            'therapie', 'analysieren', 'analyse', 'einstellungen', 'benachrichtigungen',
            'datenschutz', 'notfall', 'kontakt', 'empfehlung'
          ]
        };
        
        const direct = directTargets[language] || directTargets['en'];
        const textLower = text.toLowerCase();
        
        // Find the longest matching target (to avoid partial matches)
        let bestMatch = '';
        let bestMatchLength = 0;
        
        for (const dt of direct) {
          if (textLower.includes(dt) && dt.length > bestMatchLength) {
            bestMatch = dt;
            bestMatchLength = dt.length;
          }
        }
        
        if (bestMatch) {
          target = bestMatch;
        }
      }

      console.log('🎯 Extracted navigation target:', target, 'from text:', text);
      entities.target = target;
    }

    return entities;
  }
}

module.exports = NLUService;

