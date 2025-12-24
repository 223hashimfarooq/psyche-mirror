/**
 * VoiceCommandRouter
 * Routes voice commands to appropriate handlers
 */
const pool = require('../../../config/database');
const IntentResult = require('../models/IntentResult');
const VoiceNavigationService = require('./VoiceNavigationService');

class VoiceCommandRouter {
  constructor() {
    this.emotionApi = null;
    this.therapyApi = null;
    this.navigationService = new VoiceNavigationService();
  }

  /**
   * Route command based on intent
   */
  async route(intent, entities, userId, language = 'en', rawText = '') {
    try {
      console.log('🔀 VoiceCommandRouter.route called:', { intent, entities, language, rawText });
      
      // Check if this might be a navigation command even if intent wasn't classified as navigation
      // This is a fallback to catch navigation commands that were misclassified
      const navigationKeywords = {
        'en': ['open', 'go to', 'navigate', 'show', 'display', 'view', 'take me to', 'switch to'],
        'es': ['abrir', 'ir a', 'navegar', 'mostrar', 'ver'],
        'fr': ['ouvrir', 'aller', 'naviguer', 'afficher', 'voir'],
        'de': ['öffnen', 'gehen', 'navigieren', 'zeigen', 'anzeigen']
      };
      
      const pageNames = {
        'en': ['therapy', 'dashboard', 'settings', 'notifications', 'privacy', 'emergency', 'analysis', 'analyze', 'recommendation', 'contact', 'hotline'],
        'es': ['terapia', 'panel', 'configuración', 'notificaciones', 'privacidad', 'emergencia', 'análisis', 'recomendación'],
        'fr': ['thérapie', 'tableau', 'paramètres', 'notifications', 'confidentialité', 'urgence', 'analyse', 'recommandation'],
        'de': ['therapie', 'dashboard', 'einstellungen', 'benachrichtigungen', 'datenschutz', 'notfall', 'analyse', 'empfehlung']
      };
      
      const navKeywords = navigationKeywords[language] || navigationKeywords['en'];
      const pages = pageNames[language] || pageNames['en'];
      const textLower = rawText.toLowerCase();
      
      const hasNavKeyword = navKeywords.some(kw => textLower.includes(kw));
      const hasPageName = pages.some(pn => textLower.includes(pn));
      
      console.log('🔍 Fallback check:', { hasNavKeyword, hasPageName, textLower, currentIntent: intent });
      
      // If we have navigation keyword + page name, treat as navigation even if intent wasn't navigation
      if (hasNavKeyword && hasPageName && intent !== 'navigation') {
        console.log('🔄 Overriding intent to navigation - detected navigation keyword and page name');
        intent = 'navigation';
        // Try to extract target if not already extracted
        if (!entities.target || entities.target === 'dashboard') {
          for (const page of pages) {
            if (textLower.includes(page)) {
              entities.target = page;
              console.log('🎯 Extracted target from fallback:', page);
              break;
            }
          }
        }
      }
      
      console.log('✅ Final routing decision:', { intent, target: entities.target });
      
      switch (intent) {
        case 'emotion_query':
          return await this.handleEmotionQuery(userId, language);
        
        case 'mood_history':
          return await this.handleMoodHistory(userId, entities, language);
        
        case 'relaxation_advice':
          return await this.handleRelaxationAdvice(userId, language);
        
        case 'start_meditation':
          return await this.handleStartMeditation(userId, language);
        
        case 'start_breathing':
          return await this.handleStartBreathing(userId, language);
        
        case 'start_emotion_analysis':
          return await this.handleStartEmotionAnalysis(userId, language);
        
        case 'navigation':
          return await this.handleNavigation(entities, language);
        
        case 'settings':
          return await this.handleSettings(entities, language);
        
        case 'help':
          return await this.handleHelp(language);
        
        default:
          return IntentResult.error('Unknown intent', intent);
      }
    } catch (error) {
      console.error('Voice command routing error:', error);
      return IntentResult.error(error.message, intent);
    }
  }

  /**
   * Handle emotion query
   */
  async handleEmotionQuery(userId, language) {
    try {
      // Get latest emotion from database
      const result = await pool.query(
        `SELECT emotion_value, confidence, created_at 
         FROM emotions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        const responses = {
          'en': "I don't have any recent emotion data. Would you like to start an emotion analysis?",
          'es': 'No tengo datos emocionales recientes. ¿Te gustaría comenzar un análisis emocional?',
          'fr': "Je n'ai pas de données émotionnelles récentes. Souhaitez-vous commencer une analyse émotionnelle?",
          'de': 'Ich habe keine aktuellen Emotionsdaten. Möchten Sie eine Emotionsanalyse starten?'
        };
        return IntentResult.success(
          'emotion_query',
          responses[language] || responses['en'],
          { has_data: false }
        );
      }

      const emotion = result.rows[0];
      const responses = {
        'en': `Based on your latest analysis, you're feeling ${emotion.emotion_value} with ${Math.round(emotion.confidence * 100)}% confidence.`,
        'es': `Según tu último análisis, te sientes ${emotion.emotion_value} con ${Math.round(emotion.confidence * 100)}% de confianza.`,
        'fr': `Selon votre dernière analyse, vous vous sentez ${emotion.emotion_value} avec ${Math.round(emotion.confidence * 100)}% de confiance.`,
        'de': `Basierend auf Ihrer letzten Analyse fühlen Sie sich ${emotion.emotion_value} mit ${Math.round(emotion.confidence * 100)}% Vertrauen.`
      };

      return IntentResult.success(
        'emotion_query',
        responses[language] || responses['en'],
        {
          emotion: emotion.emotion_value,
          confidence: emotion.confidence,
          timestamp: emotion.created_at
        }
      );
    } catch (error) {
      throw new Error(`Failed to fetch emotion data: ${error.message}`);
    }
  }

  /**
   * Handle mood history query
   */
  async handleMoodHistory(userId, entities, language) {
    try {
      const timeRange = entities.time_range || 'week';
      let daysBack = 7;
      
      if (timeRange === 'month') daysBack = 30;
      else if (timeRange === 'today') daysBack = 1;
      else if (timeRange === 'all') daysBack = 365;

      const result = await pool.query(
        `SELECT emotion_value, COUNT(*) as count, AVG(confidence) as avg_confidence
         FROM emotions 
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${daysBack} days'
         GROUP BY emotion_value
         ORDER BY count DESC`,
        [userId]
      );

      if (result.rows.length === 0) {
        const responses = {
          'en': `I don't have mood data for the ${timeRange}.`,
          'es': `No tengo datos de estado de ánimo para ${timeRange === 'week' ? 'la semana' : timeRange === 'month' ? 'el mes' : 'hoy'}.`,
          'fr': `Je n'ai pas de données d'humeur pour ${timeRange === 'week' ? 'la semaine' : timeRange === 'month' ? 'le mois' : "aujourd'hui"}.`,
          'de': `Ich habe keine Stimmungsdaten für ${timeRange === 'week' ? 'die Woche' : timeRange === 'month' ? 'den Monat' : 'heute'}.`
        };
        return IntentResult.success('mood_history', responses[language] || responses['en'], {});
      }

      const topEmotion = result.rows[0];
      const responses = {
        'en': `Over the ${timeRange}, your most common mood was ${topEmotion.emotion_value}, appearing ${topEmotion.count} times.`,
        'es': `Durante ${timeRange === 'week' ? 'la semana' : timeRange === 'month' ? 'el mes' : 'hoy'}, tu estado de ánimo más común fue ${topEmotion.emotion_value}, apareciendo ${topEmotion.count} veces.`,
        'fr': `Au cours de ${timeRange === 'week' ? 'la semaine' : timeRange === 'month' ? 'le mois' : "aujourd'hui"}, votre humeur la plus courante était ${topEmotion.emotion_value}, apparaissant ${topEmotion.count} fois.`,
        'de': `Über ${timeRange === 'week' ? 'die Woche' : timeRange === 'month' ? 'den Monat' : 'heute'} war Ihre häufigste Stimmung ${topEmotion.emotion_value}, die ${topEmotion.count} Mal auftrat.`
      };

      return IntentResult.success(
        'mood_history',
        responses[language] || responses['en'],
        {
          time_range: timeRange,
          emotions: result.rows,
          top_emotion: topEmotion.emotion_value
        },
        true // action_required to show chart
      );
    } catch (error) {
      throw new Error(`Failed to fetch mood history: ${error.message}`);
    }
  }

  /**
   * Handle relaxation advice
   */
  async handleRelaxationAdvice(userId, language) {
    const advice = {
      'en': [
        "Try taking 5 deep breaths. Inhale for 4 counts, hold for 4, and exhale for 4.",
        "Take a short walk outside if possible. Fresh air can help reset your mind.",
        "Listen to calming music or nature sounds for 10 minutes.",
        "Practice progressive muscle relaxation: tense and release each muscle group."
      ],
      'es': [
        "Intenta tomar 5 respiraciones profundas. Inhala por 4 tiempos, mantén por 4, y exhala por 4.",
        "Da un paseo corto al aire libre si es posible. El aire fresco puede ayudar a resetear tu mente.",
        "Escucha música relajante o sonidos de la naturaleza por 10 minutos.",
        "Practica relajación muscular progresiva: tensa y relaja cada grupo muscular."
      ],
      'fr': [
        "Essayez de prendre 5 respirations profondes. Inspirez pendant 4 temps, retenez pendant 4, et expirez pendant 4.",
        "Faites une courte promenade à l'extérieur si possible. L'air frais peut aider à réinitialiser votre esprit.",
        "Écoutez de la musique apaisante ou des sons de la nature pendant 10 minutes.",
        "Pratiquez la relaxation musculaire progressive: contractez et relâchez chaque groupe musculaire."
      ],
      'de': [
        "Versuchen Sie 5 tiefe Atemzüge zu nehmen. Einatmen für 4 Zählzeiten, halten für 4, und ausatmen für 4.",
        "Machen Sie einen kurzen Spaziergang im Freien, wenn möglich. Frische Luft kann helfen, Ihren Geist zurückzusetzen.",
        "Hören Sie 10 Minuten lang beruhigende Musik oder Naturgeräusche.",
        "Praktizieren Sie progressive Muskelentspannung: Spannen und entspannen Sie jede Muskelgruppe."
      ]
    };

    const tips = advice[language] || advice['en'];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return IntentResult.success(
      'relaxation_advice',
      randomTip,
      { advice_type: 'breathing' }
    );
  }

  /**
   * Handle start meditation
   */
  async handleStartMeditation(userId, language) {
    const responses = {
      'en': "Starting meditation mode. Find a comfortable position and focus on your breathing.",
      'es': 'Iniciando modo de meditación. Encuentra una posición cómoda y concéntrate en tu respiración.',
      'fr': "Démarrage du mode méditation. Trouvez une position confortable et concentrez-vous sur votre respiration.",
      'de': 'Meditationsmodus wird gestartet. Finden Sie eine bequeme Position und konzentrieren Sie sich auf Ihre Atmung.'
    };

    const result = IntentResult.success(
      'start_meditation',
      responses[language] || responses['en'],
      { action: 'start_meditation' },
      true
    );
    
    // Set action_type and action_params for navigation
    result.action_type = 'start_meditation';
    result.action_params = { route: '/patient/therapy' };
    
    return result;
  }

  /**
   * Handle start breathing exercise
   */
  async handleStartBreathing(userId, language) {
    const responses = {
      'en': "Starting breathing exercise. Follow the rhythm: inhale for 4, hold for 4, exhale for 4.",
      'es': 'Iniciando ejercicio de respiración. Sigue el ritmo: inhala por 4, mantén por 4, exhala por 4.',
      'fr': "Démarrage de l'exercice de respiration. Suivez le rythme: inspirez pendant 4, retenez pendant 4, expirez pendant 4.",
      'de': 'Atemübung wird gestartet. Folgen Sie dem Rhythmus: einatmen für 4, halten für 4, ausatmen für 4.'
    };

    const result = IntentResult.success(
      'start_breathing',
      responses[language] || responses['en'],
      { action: 'start_breathing' },
      true
    );
    
    // Set action_type and action_params for navigation
    result.action_type = 'start_breathing';
    result.action_params = { route: '/patient/therapy' };
    
    return result;
  }

  /**
   * Handle start emotion analysis
   */
  async handleStartEmotionAnalysis(userId, language) {
    const responses = {
      'en': "Starting emotion analysis. I'll navigate you to the analysis page.",
      'es': 'Iniciando análisis emocional. Te llevaré a la página de análisis.',
      'fr': "Démarrage de l'analyse émotionnelle. Je vais vous naviguer vers la page d'analyse.",
      'de': 'Emotionsanalyse wird gestartet. Ich navigiere Sie zur Analyse-Seite.'
    };

    const result = IntentResult.success(
      'start_emotion_analysis',
      responses[language] || responses['en'],
      { action: 'start_emotion_analysis' },
      true
    );
    
    // Set action_type and action_params for navigation
    result.action_type = 'navigate';
    result.action_params = { route: '/patient/analyze' };
    
    return result;
  }

  /**
   * Handle navigation
   */
  async handleNavigation(entities, language) {
    const target = entities.target || 'dashboard';
    
    console.log('🧭 Navigation handler called:', { target, entities, language });
    
    // Get the actual navigation path using VoiceNavigationService
    const navigationPath = this.navigationService.getNavigationPath(target, language);
    
    console.log('🧭 Resolved navigation path:', navigationPath);
    
    if (!navigationPath) {
      console.warn('⚠️ No navigation path found for target:', target);
      const errorResponses = {
        'en': `I couldn't find the page "${target}". Please try again.`,
        'es': `No pude encontrar la página "${target}". Por favor, inténtalo de nuevo.`,
        'fr': `Je n'ai pas pu trouver la page "${target}". Veuillez réessayer.`,
        'de': `Ich konnte die Seite "${target}" nicht finden. Bitte versuchen Sie es erneut.`
      };
      return IntentResult.error(errorResponses[language] || errorResponses['en'], 'navigation');
    }
    
    const responses = {
      'en': `Navigating to ${target}.`,
      'es': `Navegando a ${target}.`,
      'fr': `Navigation vers ${target}.`,
      'de': `Navigiere zu ${target}.`
    };

    // Create result with navigation action - use constructor directly to ensure all fields are set
    const result = new IntentResult({
      success: true,
      intent: 'navigation',
      response_text: responses[language] || responses['en'],
      response_data: { target, path: navigationPath },
      action_required: true,
      action_type: 'navigate',
      action_params: { route: navigationPath },
      language: language
    });
    
    console.log('🧭 Navigation result (full):', JSON.stringify({
      action_type: result.action_type,
      action_params: result.action_params,
      action_required: result.action_required,
      response_text: result.response_text
    }, null, 2));
    
    return result;
  }

  /**
   * Handle settings
   */
  async handleSettings(entities, language) {
    const action = entities.action || 'unknown';
    const responses = {
      'en': `I've updated your settings.`,
      'es': 'He actualizado tu configuración.',
      'fr': "J'ai mis à jour vos paramètres.",
      'de': 'Ich habe Ihre Einstellungen aktualisiert.'
    };

    return IntentResult.success(
      'settings',
      responses[language] || responses['en'],
      { action },
      true
    );
  }

  /**
   * Handle help
   */
  async handleHelp(language) {
    const helpTexts = {
      'en': "I can help you with emotion queries, mood history, relaxation advice, starting meditation or breathing exercises, and navigation. What would you like to do?",
      'es': 'Puedo ayudarte con consultas emocionales, historial de estado de ánimo, consejos de relajación, iniciar meditación o ejercicios de respiración, y navegación. ¿Qué te gustaría hacer?',
      'fr': "Je peux vous aider avec les requêtes émotionnelles, l'historique de l'humeur, les conseils de relaxation, démarrer la méditation ou les exercices de respiration, et la navigation. Que souhaitez-vous faire?",
      'de': 'Ich kann Ihnen bei Emotionsabfragen, Stimmungsverlauf, Entspannungsratschlägen, dem Starten von Meditation oder Atemübungen und Navigation helfen. Was möchten Sie tun?'
    };

    return IntentResult.success(
      'help',
      helpTexts[language] || helpTexts['en'],
      {}
    );
  }
}

module.exports = VoiceCommandRouter;

