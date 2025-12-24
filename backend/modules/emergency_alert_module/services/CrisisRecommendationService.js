/**
 * CrisisRecommendationService
 * Provides local mental health resources, helplines, and crisis support
 */
const pool = require('../../../config/database');

class CrisisRecommendationService {
  constructor() {
    // Default helplines by country (can be expanded)
    this.helplines = {
      'US': {
        'suicide_prevention': { name: 'National Suicide Prevention Lifeline', number: '988', text: '988' },
        'crisis_text': { name: 'Crisis Text Line', number: '741741', text: 'Text HOME to 741741' },
        'mental_health': { name: 'SAMHSA National Helpline', number: '1-800-662-4357' }
      },
      'CA': {
        'suicide_prevention': { name: 'Crisis Services Canada', number: '1-833-456-4566', text: '45645' },
        'mental_health': { name: 'Mental Health Helpline', number: '1-866-531-2600' }
      },
      'UK': {
        'suicide_prevention': { name: 'Samaritans', number: '116 123', text: 'SHOUT to 85258' },
        'mental_health': { name: 'Mind Infoline', number: '0300 123 3393' }
      },
      'AU': {
        'suicide_prevention': { name: 'Lifeline Australia', number: '13 11 14', text: '0477 13 11 14' },
        'mental_health': { name: 'Beyond Blue', number: '1300 22 4636' }
      },
      'DE': {
        'suicide_prevention': { name: 'Telefonseelsorge', number: '0800 111 0 111' },
        'mental_health': { name: 'Nummer gegen Kummer', number: '116 111' }
      },
      'FR': {
        'suicide_prevention': { name: 'SOS Amitié', number: '09 72 39 40 50' },
        'mental_health': { name: 'Fil Santé Jeunes', number: '0 800 235 236' }
      },
      'ES': {
        'suicide_prevention': { name: 'Teléfono de la Esperanza', number: '717 003 717' },
        'mental_health': { name: 'Salud Mental', number: '024' }
      },
      'default': {
        'suicide_prevention': { name: 'International Suicide Prevention', number: '988', text: '988' },
        'mental_health': { name: 'Mental Health Support', number: '116 123' }
      }
    };
  }

  /**
   * Get crisis recommendations for user based on location and language
   * @param {number} userId - User ID
   * @param {string} language - User's language preference
   * @returns {Object} Crisis recommendations
   */
  async getRecommendations(userId, language = 'en') {
    try {
      // Get user location (if available)
      const userLocation = await this.getUserLocation(userId);
      const country = userLocation?.country || 'default';

      // Get helplines for user's country
      const helplines = this.helplines[country] || this.helplines['default'];

      // Get local therapist directories (if available)
      const therapistResources = await this.getTherapistResources(userId, country, language);

      return {
        helplines: Object.values(helplines),
        therapistResources,
        emergencyNumber: this.getEmergencyNumber(country),
        selfHelpResources: this.getSelfHelpResources(language),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting crisis recommendations:', error);
      return {
        helplines: Object.values(this.helplines['default']),
        therapistResources: [],
        emergencyNumber: '911',
        selfHelpResources: this.getSelfHelpResources(language),
        error: error.message
      };
    }
  }

  /**
   * Get user location from profile
   */
  async getUserLocation(userId) {
    try {
      const query = `
        SELECT address, country FROM users WHERE id = $1
      `;
      const result = await pool.query(query, [userId]);
      if (result.rows.length > 0) {
        const address = result.rows[0].address || '';
        // Simple country extraction (can be enhanced)
        const countryMatch = address.match(/\b(US|CA|UK|AU|DE|FR|ES|MX|BR|IN|CN|JP|KR)\b/i);
        return {
          country: countryMatch ? countryMatch[1].toUpperCase() : null,
          address
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user location:', error);
      return null;
    }
  }

  /**
   * Get therapist resources
   */
  async getTherapistResources(userId, country, language) {
    try {
      // Check if user has existing therapist relationships
      const query = `
        SELECT 
          d.id,
          d.name,
          d.specialization,
          d.email,
          d.phone
        FROM doctor_patient_relationships r
        JOIN users d ON r.doctor_id = d.id
        WHERE r.patient_id = $1 AND r.status = 'accepted'
        LIMIT 5
      `;
      const result = await pool.query(query, [userId]);
      
      const therapists = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        specialization: row.specialization,
        contact: {
          email: row.email,
          phone: row.phone
        },
        type: 'existing_therapist'
      }));

      // Add general therapist directory links
      const directoryLinks = this.getTherapistDirectories(country, language);
      
      return [...therapists, ...directoryLinks];
    } catch (error) {
      console.error('Error fetching therapist resources:', error);
      return [];
    }
  }

  /**
   * Get therapist directory links by country
   */
  getTherapistDirectories(country, language) {
    const directories = {
      'US': [
        { name: 'Psychology Today', url: 'https://www.psychologytoday.com', type: 'directory' },
        { name: 'BetterHelp', url: 'https://www.betterhelp.com', type: 'online_therapy' }
      ],
      'CA': [
        { name: 'Canadian Psychological Association', url: 'https://cpa.ca', type: 'directory' }
      ],
      'UK': [
        { name: 'BACP', url: 'https://www.bacp.co.uk', type: 'directory' }
      ],
      'default': [
        { name: 'International Therapist Directory', url: 'https://www.psychologytoday.com', type: 'directory' }
      ]
    };

    return directories[country] || directories['default'];
  }

  /**
   * Get emergency number for country
   */
  getEmergencyNumber(country) {
    const emergencyNumbers = {
      'US': '911',
      'CA': '911',
      'UK': '999',
      'AU': '000',
      'DE': '112',
      'FR': '112',
      'ES': '112',
      'default': '911'
    };
    return emergencyNumbers[country] || emergencyNumbers['default'];
  }

  /**
   * Get self-help resources
   */
  getSelfHelpResources(language) {
    return {
      breathing_exercise: {
        title: 'breathing_exercise_title',
        description: 'breathing_exercise_description',
        steps: ['breathing_step_1', 'breathing_step_2', 'breathing_step_3', 'breathing_step_4']
      },
      grounding_technique: {
        title: 'grounding_technique_title',
        description: 'grounding_technique_description',
        steps: ['grounding_step_1', 'grounding_step_2', 'grounding_step_3']
      },
      safety_plan: {
        title: 'safety_plan_title',
        description: 'safety_plan_description',
        steps: ['safety_plan_step_1', 'safety_plan_step_2', 'safety_plan_step_3']
      }
    };
  }
}

module.exports = CrisisRecommendationService;

