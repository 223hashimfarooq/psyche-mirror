/**
 * IntentClassificationService
 * Classifies user intent from voice commands
 */
class IntentClassificationService {
  constructor() {
    // Intent patterns for each language
    this.intentPatterns = {
      'en': {
        'emotion_query': [
          /\b(how|what).*(am|are|is).*(feeling|feeling like|mood|emotion)/i,
          /\b(what|tell me).*(my|current).*(mood|emotion|feeling)/i,
          /\b(show|tell).*(me|my).*(emotional|feeling|mood)/i
        ],
        'mood_history': [
          /\b(what|how).*(was|were).*(my|this).*(mood|feeling|emotion).*(week|month|today)/i,
          /\b(show|tell|give).*(me|my).*(mood|emotional).*(history|trends|pattern)/i,
          /\b(weekly|monthly|daily).*(mood|emotion|feeling)/i
        ],
        'relaxation_advice': [
          /\b(give|tell|provide).*(me|some).*(relaxation|relax|calm|advice|suggestion)/i,
          /\b(how|what).*(can|should).*(i|I).*(do|relax|calm)/i,
          /\b(need|want).*(relaxation|to relax|calm down)/i
        ],
        'start_meditation': [
          /\b(start|begin|launch|open).*(meditation|meditate)/i,
          /\b(meditation|meditate).*(mode|session|now)/i
        ],
        'start_breathing': [
          /\b(start|begin|do).*(breathing|breath)/i,
          /\b(breathing|breath).*(exercise|session|now)/i
        ],
        'navigation': [
          // More flexible patterns - any navigation keyword + any page name
          /\b(open|go to|navigate|show|display|view|take me to|switch to|go|navigate to|bring me to).*(therapy|dashboard|settings|chart|graph|notifications|privacy|emergency|analysis|analyze|recommendation|contact|hotline|scheduled)/i,
          /\b(show|display|view).*(weekly|monthly|mood|emotional).*(chart|graph|trend)/i,
          /\b(go|navigate|open).*(home|main|dashboard|therapy|analysis|settings|notifications|privacy|emergency|contact)/i,
          // Also match if page name comes first
          /\b(therapy|dashboard|settings|notifications|privacy|emergency|analysis|analyze|recommendation|contact).*(open|go|show|display|view)/i,
          // Match page names directly with navigation context
          /\b(open|go to|show|display|view)\s+(therapy|dashboard|settings|notifications|privacy|emergency|analysis|analyze|recommendation|contact|hotline|scheduled)/i
        ],
        'start_emotion_analysis': [
          /\b(start|begin|launch|open|go to).*(emotion|emotion analysis|analysis|analyze|analyzing)/i,
          /\b(analyze|analyzing|check|check my).*(emotion|emotions|mood|feeling|feelings)/i,
          /\b(do|run|perform).*(emotion|emotion analysis|analysis)/i,
          /\b(emotion|emotion analysis|analysis).*(now|please|start)/i,
          /\b(how|what).*(am i|are you).*(feeling|feeling like)/i
        ],
        'settings': [
          // Only match settings actions, not navigation to settings
          /\b(mute|unmute|enable|disable|turn).*(notification|notifications)/i,
          /\b(change|set|update|modify|adjust).*(setting|settings|preference|preferences)/i,
          // Don't match "go to settings" or "open settings" - those are navigation
          /\b(configure|configuration)/i
        ],
        'help': [
          /\b(help|what can|what do|how do|assist)/i,
          /\b(what|which).*(can|do).*(you|i).*(do|help)/i
        ]
      },
      'es': {
        'emotion_query': [
          /\b(como|qué).*(estoy|está|son).*(sintiendo|siento|emoción|estado)/i,
          /\b(cuál|qué).*(es|son).*(mi|mi actual).*(estado|emoción|sentimiento)/i
        ],
        'mood_history': [
          /\b(qué|cómo).*(fue|fueron).*(mi|esta).*(estado|emoción|sentimiento).*(semana|mes|hoy)/i,
          /\b(mostrar|decir|dar).*(mi|mis).*(estados|emociones|tendencias)/i
        ],
        'relaxation_advice': [
          /\b(dar|decir|proporcionar).*(relajación|relajarme|calma|consejo)/i,
          /\b(cómo|qué).*(puedo|debo).*(hacer|relajarme|calmarme)/i
        ],
        'start_meditation': [
          /\b(iniciar|empezar|comenzar|abrir).*(meditación|meditar)/i
        ],
        'start_breathing': [
          /\b(iniciar|hacer).*(respiración|respirar)/i
        ],
        'start_emotion_analysis': [
          /\b(iniciar|empezar|comenzar|abrir|ir a).*(análisis|análisis emocional|emoción|emociones)/i,
          /\b(analizar|analizando|revisar).*(emoción|emociones|estado de ánimo|sentimientos)/i,
          /\b(hacer|realizar).*(análisis|análisis emocional)/i
        ],
        'navigation': [
          /\b(abrir|ir a|mostrar|ver|navegar|ir|mostrar|ver).*(terapia|panel|configuración|gráfico|notificaciones|privacidad|emergencia|análisis|recomendación|contacto)/i,
          /\b(abrir|ir a|mostrar|ver)\s+(terapia|panel|configuración|notificaciones|privacidad|emergencia|análisis|recomendación|contacto)/i
        ],
        'settings': [
          /\b(silenciar|activar|desactivar).*(notificación|notificaciones)/i
        ],
        'help': [
          /\b(ayuda|qué puedo|qué hago|asistir)/i
        ]
      },
      'fr': {
        'emotion_query': [
          /\b(comment|qu'est-ce que).*(je|suis|est).*(ressentir|sentir|émotion|humeur)/i,
          /\b(quelle|quel).*(est|sont).*(mon|ma).*(humeur|émotion|sentiment)/i
        ],
        'mood_history': [
          /\b(quelle|comment).*(était|étaient).*(mon|ma).*(humeur|émotion).*(semaine|mois|aujourd'hui)/i,
          /\b(afficher|montrer|dire).*(mon|ma).*(historique|tendances|humeur)/i
        ],
        'relaxation_advice': [
          /\b(donner|dire|fournir).*(relaxation|détente|calme|conseil)/i,
          /\b(comment|quoi).*(puis|dois).*(je|faire|me détendre)/i
        ],
        'start_meditation': [
          /\b(démarrer|commencer|lancer|ouvrir).*(méditation|méditer)/i
        ],
        'start_breathing': [
          /\b(démarrer|faire).*(respiration|respirer)/i
        ],
        'start_emotion_analysis': [
          /\b(démarrer|commencer|lancer|ouvrir|aller).*(analyse|analyse émotionnelle|émotion|émotions)/i,
          /\b(analyser|analysant|vérifier).*(émotion|émotions|humeur|sentiments)/i,
          /\b(faire|effectuer).*(analyse|analyse émotionnelle)/i
        ],
        'navigation': [
          /\b(ouvrir|aller|afficher|voir|naviguer|aller à).*(thérapie|tableau|paramètres|graphique|notifications|confidentialité|urgence|analyse|recommandation|contact)/i,
          /\b(ouvrir|aller|afficher|voir)\s+(thérapie|tableau|paramètres|notifications|confidentialité|urgence|analyse|recommandation|contact)/i
        ],
        'settings': [
          /\b(couper|activer|désactiver).*(notification|notifications)/i
        ],
        'help': [
          /\b(aide|que puis|que faire|assister)/i
        ]
      },
      'de': {
        'emotion_query': [
          /\b(wie|was).*(bin|ist|sind).*(ich|fühlen|emotion|gefühl)/i,
          /\b(welche|was).*(ist|sind).*(meine|mein).*(stimmung|emotion|gefühl)/i
        ],
        'mood_history': [
          /\b(wie|was).*(war|waren).*(meine|mein).*(stimmung|emotion).*(woche|monat|heute)/i,
          /\b(zeigen|sagen|geben).*(meine|mein).*(verlauf|trends|stimmung)/i
        ],
        'relaxation_advice': [
          /\b(geben|sagen|bereitstellen).*(entspannung|beruhigung|rat)/i,
          /\b(wie|was).*(kann|soll).*(ich|tun|entspannen)/i
        ],
        'start_meditation': [
          /\b(starten|beginnen|öffnen).*(meditation|meditieren)/i
        ],
        'start_breathing': [
          /\b(starten|machen).*(atmung|atmen)/i
        ],
        'start_emotion_analysis': [
          /\b(starten|beginnen|öffnen|gehen).*(analyse|emotionsanalyse|emotion|emotionen)/i,
          /\b(analysieren|analysierend|überprüfen).*(emotion|emotionen|stimmung|gefühle)/i,
          /\b(machen|durchführen).*(analyse|emotionsanalyse)/i
        ],
        'navigation': [
          /\b(öffnen|gehen|zeigen|anzeigen|navigieren|gehen zu).*(therapie|dashboard|einstellungen|diagramm|benachrichtigungen|datenschutz|notfall|analyse|empfehlung|kontakt)/i,
          /\b(öffnen|gehen|zeigen|anzeigen)\s+(therapie|dashboard|einstellungen|benachrichtigungen|datenschutz|notfall|analyse|empfehlung|kontakt)/i
        ],
        'settings': [
          /\b(stumm|aktivieren|deaktivieren).*(benachrichtigung|benachrichtigungen)/i
        ],
        'help': [
          /\b(hilfe|was kann|was tun|assistieren)/i
        ]
      }
    };
  }

  /**
   * Classify intent from text
   */
  async classify(text, language = 'en') {
    const patterns = this.intentPatterns[language] || this.intentPatterns['en'];
    const scores = {};

    // Check for navigation keywords first - navigation should have priority
    const navigationKeywords = ['open', 'go to', 'navigate', 'show', 'display', 'view', 'take me to', 'switch to'];
    const pageNames = ['therapy', 'dashboard', 'settings', 'notifications', 'privacy', 'emergency', 'analysis', 'analyze', 'recommendation', 'contact', 'hotline'];
    const textLower = text.toLowerCase();
    
    // If text contains navigation keyword + page name, prioritize navigation
    const hasNavigationKeyword = navigationKeywords.some(kw => textLower.includes(kw));
    const hasPageName = pageNames.some(pn => textLower.includes(pn));
    
    if (hasNavigationKeyword && hasPageName) {
      // Navigation intent gets a boost
      scores['navigation'] = 10; // High priority
    }

    // Score each intent
    for (const [intent, intentPatterns] of Object.entries(patterns)) {
      if (!scores[intent]) {
        scores[intent] = 0;
      }
      for (const pattern of intentPatterns) {
        if (pattern.test(text)) {
          scores[intent] += 1;
        }
      }
    }

    // Find intent with highest score
    let maxScore = 0;
    let detectedIntent = 'help'; // default fallback

    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    }

    // Calculate confidence
    const totalPatterns = patterns[detectedIntent]?.length || 1;
    const confidence = maxScore > 0 
      ? Math.min(0.95, 0.5 + (maxScore / totalPatterns) * 0.45)
      : 0.3;

    console.log('🎯 Intent classification:', {
      text,
      detectedIntent,
      confidence,
      scores,
      hasNavigationKeyword,
      hasPageName
    });

    return {
      intent: detectedIntent,
      confidence,
      entities: {}
    };
  }
}

module.exports = IntentClassificationService;

