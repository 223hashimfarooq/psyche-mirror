// API service for PsycheMirror backend
// Use environment variable for production, fallback to localhost for development
// IMPORTANT: REACT_APP_API_URL should be the full backend URL WITHOUT /api
// Example: https://your-backend.railway.app (NOT https://your-backend.railway.app/api)
// Railway variables may or may not include https://, so we handle both cases
const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (!envUrl) {
    return 'http://localhost:5000/api';
  }
  
  // Remove trailing slash if present
  let cleanUrl = envUrl.trim().replace(/\/$/, '');
  
  // Add https:// if protocol is missing
  if (!cleanUrl.match(/^https?:\/\//)) {
    cleanUrl = `https://${cleanUrl}`;
  }
  
  // Add /api if not already present
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`;
  }
  
  return cleanUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging
console.log('🔧 API Configuration:');
console.log('  - REACT_APP_API_URL (raw):', process.env.REACT_APP_API_URL);
console.log('  - API_BASE_URL (final):', API_BASE_URL);

class ApiService {
  constructor() {
    this.token = localStorage.getItem('psychemirror_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('psychemirror_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('psychemirror_token');
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Always get the latest token from localStorage
    const token = localStorage.getItem('psychemirror_token');
    console.log('🔑 API Service: Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 API Service: Authorization header set');
    } else {
      console.log('🔑 API Service: No token found in localStorage');
    }
    
    console.log('🔑 API Service: Final headers:', headers);
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log('🔑 API Service: Making request to:', url);
    console.log('🔑 API Service: API_BASE_URL:', API_BASE_URL);
    console.log('🔑 API Service: REACT_APP_API_URL env:', process.env.REACT_APP_API_URL);
    console.log('🔑 API Service: Request config:', config);

    try {
      const response = await fetch(url, config);
      console.log('🔑 API Service: Response status:', response.status);
      console.log('🔑 API Service: Response headers:', response.headers);
      console.log('🔑 API Service: Response Content-Type:', response.headers.get('content-type'));
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const htmlText = await response.text();
        console.error('❌ API Service: Received HTML instead of JSON!');
        console.error('❌ HTML Response (first 500 chars):', htmlText.substring(0, 500));
        
        const error = new Error('Server returned HTML instead of JSON. Check API URL configuration.');
        error.response = { 
          data: { 
            message: 'Server returned an error page. Please check that the backend API is running and the REACT_APP_API_URL is correct.',
            error: 'Invalid response format',
            html: htmlText.substring(0, 500)
          }, 
          status: response.status 
        };
        throw error;
      }
      
      // Try to parse as JSON
      let data;
      try {
        const text = await response.text();
        console.log('🔑 API Service: Response text (first 200 chars):', text.substring(0, 200));
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ API Service: Failed to parse JSON:', parseError);
        const error = new Error('Invalid JSON response from server');
        error.response = { 
          data: { 
            message: 'Server returned invalid JSON. Please check the backend API.',
            error: 'JSON parse error',
            parseError: parseError.message
          }, 
          status: response.status 
        };
        throw error;
      }
      
      console.log('🔑 API Service: Response data:', data);

      if (!response.ok) {
        console.log('🔑 API Service: Request failed with status:', response.status);
        const error = new Error(data.message || data.error || 'API request failed');
        error.response = { 
          data: data || { message: error.message, error: error.message }, 
          status: response.status 
        };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('🔑 API Service: Request error:', error);
      // If it's already an error with response, re-throw it
      if (error.response) {
        throw error;
      }
      // Otherwise, wrap it in axios-like format
      const wrappedError = new Error(error.message || 'Network error');
      wrappedError.response = { 
        data: { message: error.message || 'Network error', error: error.message || 'Network error' }, 
        status: 500 
      };
      throw wrappedError;
    }
  }

  // Convenience methods for common HTTP methods (axios-like interface)
  async get(endpoint, config = {}) {
    return this.request(endpoint, { ...config, method: 'GET' });
  }

  async post(endpoint, data, config = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, config = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, config = {}) {
    return this.request(endpoint, { ...config, method: 'DELETE' });
  }

  // Authentication endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password, mfaToken = null, backupCode = null) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, mfaToken, backupCode }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async logout() {
    this.clearToken();
  }

  // User endpoints
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async getUserProfile(id) {
    return this.request(`/users/profile/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserStats() {
    return this.request('/users/stats/overview');
  }

  // Therapy endpoints
  async checkTherapyHistory(userId) {
    return this.request(`/therapy/history/${userId}`);
  }

  // Save therapy assessment
  async saveTherapyAssessment(assessmentData) {
    return this.request('/therapy/assessment', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  }

  // Get therapy assessment history
  async getTherapyAssessments() {
    return this.request('/therapy/assessments');
  }

  // Save therapy session
  async saveTherapySession(sessionData) {
    return this.request('/therapy/session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Get therapy session history
  async getTherapySessions(limit = 50, offset = 0) {
    return this.request(`/therapy/sessions?limit=${limit}&offset=${offset}`);
  }

  // Get therapy progress summary
  async getTherapyProgress() {
    return this.request('/therapy/progress');
  }

  // Update therapy plan
  async updateTherapyPlan(assessmentId, therapyPlan) {
    return this.request(`/therapy/plan/${assessmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ therapyPlan }),
    });
  }

  // Get therapy recommendations
  async getTherapyRecommendations(emotionData) {
    return this.request('/therapy/recommendations', {
      method: 'POST',
      body: JSON.stringify(emotionData),
    });
  }

  // Get therapy tracking data
  async getTherapyTracking() {
    return this.request('/therapy/tracking');
  }

  // Emotion endpoints
  async saveEmotion(emotionData) {
    return this.request('/emotions/save', {
      method: 'POST',
      body: JSON.stringify(emotionData),
    });
  }

  async getEmotionHistory(limit = 50, offset = 0) {
    return this.request(`/emotions/history?limit=${limit}&offset=${offset}`);
  }

  async getEmotionStats(period = 7) {
    return this.request(`/emotions/stats?period=${period}`);
  }

  async getEmotionById(id) {
    return this.request(`/emotions/${id}`);
  }

  async deleteEmotion(id) {
    return this.request(`/emotions/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Privacy & Security endpoints
  async getPrivacySettings() {
    return this.request('/privacy/settings');
  }

  async updatePrivacySettings(settings) {
    return this.request('/privacy/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async requestDataDeletion(reason) {
    return this.request('/privacy/data/delete', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async requestDataAnonymization(reason) {
    return this.request('/privacy/data/anonymize', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getAuditLogs(limit = 50, offset = 0) {
    return this.request(`/privacy/audit-logs?limit=${limit}&offset=${offset}`);
  }

  // MFA endpoints
  async setupMFA() {
    return this.request('/privacy/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async verifyMFA(token, backupCode = null) {
    return this.request('/privacy/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ token, backupCode }),
    });
  }

  async disableMFA(password) {
    return this.request('/privacy/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getMFAStatus() {
    return this.request('/privacy/mfa/status');
  }

  // Reset MFA (password protected, no token required)
  async resetMFA(email, password) {
    return this.request('/auth/reset-mfa', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Doctor-specific endpoints
  async getDoctorPatients() {
    return this.request('/doctors/my/patients');
  }

  async getDoctorRequests() {
    return this.request('/doctors/my/requests');
  }

  async getDoctorPricing() {
    return this.request('/doctors/my/pricing');
  }

  async updateDoctorPricing(pricing) {
    return this.request('/doctors/my/pricing', {
      method: 'PUT',
      body: JSON.stringify(pricing),
    });
  }

  async updateRelationshipStatus(relationshipId, status, consultationFee, sessionFee, notes) {
    return this.request(`/doctors/relationships/${relationshipId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, consultationFee, sessionFee, notes }),
    });
  }

  // Emergency Alert endpoints
  async getEmergencyAlertPreferences() {
    return this.request('/emergency-alert/preferences');
  }

  async updateEmergencyAlertPreferences(preferences) {
    return this.request('/emergency-alert/preferences/update', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  async addEmergencyContact(contactData) {
    return this.request('/emergency-alert/contacts/add', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async deleteEmergencyContact(contactId) {
    return this.request('/emergency-alert/contacts/delete', {
      method: 'POST',
      body: JSON.stringify({ contactId }),
    });
  }

  async triggerEmergencyAlert(emotionData = null, manual = false) {
    return this.request('/emergency-alert/trigger', {
      method: 'POST',
      body: JSON.stringify({ emotionData, manual }),
    });
  }

  async getCrisisRecommendations(language = 'en') {
    return this.request(`/emergency-alert/recommendations?language=${language}`);
  }

  // Voice Assistant endpoints
  async processVoiceCommand(commandData) {
    return this.request('/voice/process', {
      method: 'POST',
      body: JSON.stringify(commandData),
    });
  }

  async triggerVoiceAction(actionData) {
    return this.request('/voice/trigger-action', {
      method: 'POST',
      body: JSON.stringify(actionData),
    });
  }

  async getVoiceCommandHistory(limit = 20) {
    return this.request(`/voice/history?limit=${limit}`);
  }

  async getSupportedLanguages() {
    return this.request('/voice/supported-languages');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
