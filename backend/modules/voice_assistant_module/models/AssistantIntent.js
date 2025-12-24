/**
 * AssistantIntent Model
 * Represents the intent classification result
 */
class AssistantIntent {
  constructor(data) {
    this.intent = data.intent; // 'emotion_query', 'navigation', 'action', 'help', 'relaxation'
    this.confidence = data.confidence || 0.0;
    this.entities = data.entities || {};
    this.time_range = data.time_range; // 'today', 'week', 'month', 'all'
    this.emotion_type = data.emotion_type; // specific emotion if queried
    this.action = data.action; // 'start_meditation', 'show_chart', etc.
    this.target = data.target; // navigation target
  }

  static createFromNLU(nluResult) {
    return new AssistantIntent({
      intent: nluResult.intent,
      confidence: nluResult.confidence,
      entities: nluResult.entities,
      time_range: nluResult.entities?.time_range,
      emotion_type: nluResult.entities?.emotion_type,
      action: nluResult.entities?.action,
      target: nluResult.entities?.target
    });
  }
}

module.exports = AssistantIntent;

