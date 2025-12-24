/**
 * AssistantResponseService
 * Generates natural language responses for the assistant
 */
class AssistantResponseService {
  constructor() {
    // Response templates for different scenarios
    this.responseTemplates = {
      'en': {
        'listening': "I'm listening...",
        'processing': "Let me think about that...",
        'error': "I'm sorry, I didn't understand that. Could you please repeat?",
        'no_data': "I don't have that information available right now.",
        'success': "Done!",
        'confirm': "Got it!"
      },
      'es': {
        'listening': 'Estoy escuchando...',
        'processing': 'Déjame pensar en eso...',
        'error': 'Lo siento, no entendí eso. ¿Podrías repetirlo?',
        'no_data': 'No tengo esa información disponible en este momento.',
        'success': '¡Hecho!',
        'confirm': '¡Entendido!'
      },
      'fr': {
        'listening': "J'écoute...",
        'processing': 'Laissez-moi réfléchir à cela...',
        'error': "Je suis désolé, je n'ai pas compris. Pourriez-vous répéter?",
        'no_data': "Je n'ai pas ces informations disponibles pour le moment.",
        'success': 'Terminé!',
        'confirm': 'Compris!'
      },
      'de': {
        'listening': 'Ich höre zu...',
        'processing': 'Lassen Sie mich darüber nachdenken...',
        'error': 'Entschuldigung, das habe ich nicht verstanden. Könnten Sie das bitte wiederholen?',
        'no_data': 'Ich habe diese Informationen derzeit nicht verfügbar.',
        'success': 'Fertig!',
        'confirm': 'Verstanden!'
      }
    };
  }

  /**
   * Get response for a specific scenario
   */
  getResponse(scenario, language = 'en') {
    const templates = this.responseTemplates[language] || this.responseTemplates['en'];
    return templates[scenario] || templates['error'];
  }

  /**
   * Format emotion data into natural language
   */
  formatEmotionResponse(emotionData, language = 'en') {
    if (!emotionData || !emotionData.emotion) {
      return this.getResponse('no_data', language);
    }

    const templates = {
      'en': `You're feeling ${emotionData.emotion} with ${Math.round(emotionData.confidence * 100)}% confidence.`,
      'es': `Te sientes ${emotionData.emotion} con ${Math.round(emotionData.confidence * 100)}% de confianza.`,
      'fr': `Vous vous sentez ${emotionData.emotion} avec ${Math.round(emotionData.confidence * 100)}% de confiance.`,
      'de': `Sie fühlen sich ${emotionData.emotion} mit ${Math.round(emotionData.confidence * 100)}% Vertrauen.`
    };

    return templates[language] || templates['en'];
  }

  /**
   * Format mood history into natural language
   */
  formatMoodHistoryResponse(historyData, language = 'en') {
    if (!historyData || !historyData.top_emotion) {
      return this.getResponse('no_data', language);
    }

    const templates = {
      'en': `Your most common mood was ${historyData.top_emotion}.`,
      'es': `Tu estado de ánimo más común fue ${historyData.top_emotion}.`,
      'fr': `Votre humeur la plus courante était ${historyData.top_emotion}.`,
      'de': `Ihre häufigste Stimmung war ${historyData.top_emotion}.`
    };

    return templates[language] || templates['en'];
  }
}

module.exports = AssistantResponseService;

