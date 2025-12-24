/**
 * EmergencyContact Model
 * Manages emergency contacts for users
 */
class EmergencyContact {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.relationship = data.relationship; // 'family', 'friend', 'doctor', 'therapist', 'other'
    this.is_primary = data.is_primary || false;
    this.notify_on_critical = data.notify_on_critical !== undefined ? data.notify_on_critical : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findByUserId(pool, userId) {
    const query = `
      SELECT * FROM emergency_contacts 
      WHERE user_id = $1
      ORDER BY is_primary DESC, created_at ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => new EmergencyContact(row));
  }

  static async findPrimary(pool, userId) {
    const query = `
      SELECT * FROM emergency_contacts 
      WHERE user_id = $1 AND is_primary = true
      LIMIT 1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0 ? new EmergencyContact(result.rows[0]) : null;
  }

  static async create(pool, contactData) {
    const query = `
      INSERT INTO emergency_contacts 
      (user_id, name, phone, email, relationship, is_primary, notify_on_critical)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      contactData.user_id,
      contactData.name,
      contactData.phone,
      contactData.email,
      contactData.relationship || 'other',
      contactData.is_primary || false,
      contactData.notify_on_critical !== undefined ? contactData.notify_on_critical : true
    ];
    const result = await pool.query(query, values);
    return new EmergencyContact(result.rows[0]);
  }

  static async update(pool, contactId, userId, updateData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(updateData.phone);
    }
    if (updateData.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(updateData.email);
    }
    if (updateData.relationship !== undefined) {
      updates.push(`relationship = $${paramCount++}`);
      values.push(updateData.relationship);
    }
    if (updateData.is_primary !== undefined) {
      updates.push(`is_primary = $${paramCount++}`);
      values.push(updateData.is_primary);
    }
    if (updateData.notify_on_critical !== undefined) {
      updates.push(`notify_on_critical = $${paramCount++}`);
      values.push(updateData.notify_on_critical);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(contactId, userId);

    const query = `
      UPDATE emergency_contacts 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new EmergencyContact(result.rows[0]) : null;
  }

  static async delete(pool, contactId, userId) {
    const query = `
      DELETE FROM emergency_contacts 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [contactId, userId]);
    return result.rows.length > 0 ? new EmergencyContact(result.rows[0]) : null;
  }
}

module.exports = EmergencyContact;

