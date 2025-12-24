/**
 * IntentResult Model
 * Represents the complete result of intent processing
 */
class IntentResult {
  constructor(data) {
    this.success = data.success || false;
    this.intent = data.intent;
    this.response_text = data.response_text;
    this.response_data = data.response_data || {};
    this.action_required = data.action_required || false;
    this.action_type = data.action_type; // 'navigate', 'trigger', 'display'
    this.action_params = data.action_params || {};
    this.error = data.error;
    this.language = data.language || 'en';
  }

  static success(intent, responseText, responseData = {}, actionRequired = false) {
    return new IntentResult({
      success: true,
      intent,
      response_text: responseText,
      response_data: responseData,
      action_required: actionRequired
    });
  }

  static error(errorMessage, intent = null) {
    return new IntentResult({
      success: false,
      intent,
      error: errorMessage
    });
  }
}

module.exports = IntentResult;

