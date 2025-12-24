/**
 * VoiceCommand Model
 * Represents a voice command from the user
 */
class VoiceCommand {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.raw_text = data.raw_text;
    this.processed_text = data.processed_text;
    this.intent = data.intent;
    this.entities = data.entities || {};
    this.confidence = data.confidence || 0.0;
    this.language = data.language || 'en';
    this.audio_file_path = data.audio_file_path;
    this.response_text = data.response_text;
    this.response_audio_path = data.response_audio_path;
    this.status = data.status || 'pending'; // 'pending', 'processing', 'completed', 'failed'
    this.created_at = data.created_at;
    this.processed_at = data.processed_at;
  }

  static async create(pool, commandData) {
    const query = `
      INSERT INTO voice_commands 
      (user_id, raw_text, processed_text, intent, entities, confidence, language, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    // Handle entities - PostgreSQL JSONB accepts objects directly via pg library
    let entitiesValue = null;
    if (commandData.entities) {
      if (typeof commandData.entities === 'string') {
        try {
          entitiesValue = JSON.parse(commandData.entities);
        } catch (e) {
          console.error('Error parsing entities string:', e);
          entitiesValue = {};
        }
      } else if (typeof commandData.entities === 'object' && commandData.entities !== null && !Array.isArray(commandData.entities)) {
        // If it's already an object, use it directly - pg library handles JSONB conversion
        entitiesValue = commandData.entities;
      } else {
        entitiesValue = {};
      }
    }
    
    // Ensure confidence is a number
    const confidence = typeof commandData.confidence === 'number' 
      ? commandData.confidence 
      : parseFloat(commandData.confidence) || 0.0;
    
    const values = [
      commandData.user_id,
      commandData.raw_text,
      commandData.processed_text || commandData.raw_text,
      commandData.intent,
      entitiesValue, // PostgreSQL JSONB accepts objects directly
      confidence,
      commandData.language || 'en',
      commandData.status || 'pending'
    ];
    
    try {
      const result = await pool.query(query, values);
      const row = result.rows[0];
      // PostgreSQL JSONB returns objects directly, not strings
      let entities = {};
      if (row.entities) {
        if (typeof row.entities === 'string') {
          try {
            entities = JSON.parse(row.entities);
          } catch (e) {
            console.error('Error parsing entities from DB:', e);
            entities = {};
          }
        } else {
          entities = row.entities;
        }
      }
      return new VoiceCommand({
        ...row,
        entities
      });
    } catch (error) {
      console.error('Error creating voice command:', error);
      console.error('Command data:', commandData);
      throw error;
    }
  }

  static async findByUserId(pool, userId, options = {}) {
    let query = `
      SELECT * FROM voice_commands 
      WHERE user_id = $1
    `;
    const values = [userId];

    if (options.limit) {
      query += ` ORDER BY created_at DESC LIMIT $2`;
      values.push(options.limit);
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => {
      // PostgreSQL JSONB returns objects directly, not strings
      let entities = {};
      if (row.entities) {
        if (typeof row.entities === 'string') {
          entities = JSON.parse(row.entities);
        } else {
          entities = row.entities;
        }
      }
      return {
        ...row,
        entities
      };
    });
  }

  static async updateStatus(pool, commandId, status, responseData = {}) {
    const query = `
      UPDATE voice_commands 
      SET status = $1, processed_at = CURRENT_TIMESTAMP,
          response_text = $2, response_audio_path = $3
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [
      status,
      responseData.response_text || null,
      responseData.response_audio_path || null,
      commandId
    ]);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      // PostgreSQL JSONB returns objects directly, not strings
      let entities = {};
      if (row.entities) {
        if (typeof row.entities === 'string') {
          entities = JSON.parse(row.entities);
        } else {
          entities = row.entities;
        }
      }
      return new VoiceCommand({
        ...row,
        entities
      });
    }
    return null;
  }
}

module.exports = VoiceCommand;

