const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get scheduled sessions for a relationship
router.get('/sessions/:relationshipId', verifyToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to this relationship
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE id = $1 AND (doctor_id = $2 OR patient_id = $2)`,
      [relationshipId, userId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Relationship not found or unauthorized'
      });
    }

    const sessionsResult = await pool.query(`
      SELECT 
        tss.*,
        doctor.name as doctor_name,
        patient.name as patient_name
      FROM therapy_sessions_scheduled tss
      JOIN users doctor ON tss.doctor_id = doctor.id
      JOIN users patient ON tss.patient_id = patient.id
      WHERE tss.relationship_id = $1
      ORDER BY tss.session_date DESC, tss.session_time DESC
    `, [relationshipId]);

    res.json({
      success: true,
      sessions: sessionsResult.rows
    });

  } catch (error) {
    console.error('Error fetching scheduled sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled sessions',
      message: error.message
    });
  }
});

// Schedule a new session
router.post('/sessions', verifyToken, async (req, res) => {
  try {
    const { 
      relationshipId, 
      sessionDate, 
      sessionTime, 
      durationMinutes = 60, 
      sessionType = 'consultation',
      notes,
      fee 
    } = req.body;
    const userId = req.user.userId;

    // Verify user has access to this relationship
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE id = $1 AND (doctor_id = $2 OR patient_id = $2)`,
      [relationshipId, userId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Relationship not found or unauthorized'
      });
    }

    const relationship = relationshipResult.rows[0];

    // Check for time conflicts
    const conflictResult = await pool.query(`
      SELECT * FROM therapy_sessions_scheduled 
      WHERE doctor_id = $1 AND session_date = $2 AND session_time = $3 AND status IN ('scheduled', 'confirmed')
    `, [relationship.doctor_id, sessionDate, sessionTime]);

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Time conflict',
        message: 'Doctor already has a session scheduled at this time'
      });
    }

    // Insert new session
    // Convert fee to number if provided, otherwise use null
    const sessionFee = fee ? (typeof fee === 'string' ? parseFloat(fee) : fee) : null;
    
    const sessionResult = await pool.query(`
      INSERT INTO therapy_sessions_scheduled 
      (relationship_id, doctor_id, patient_id, session_date, session_time, duration_minutes, session_type, notes, fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      relationshipId, 
      relationship.doctor_id, 
      relationship.patient_id, 
      sessionDate, 
      sessionTime, 
      durationMinutes || 60, 
      sessionType || 'consultation', 
      notes || null, 
      sessionFee
    ]);

    const newSession = sessionResult.rows[0];

    // Get doctor and patient names
    const namesResult = await pool.query(`
      SELECT 
        doctor.name as doctor_name,
        patient.name as patient_name
      FROM users doctor, users patient
      WHERE doctor.id = $1 AND patient.id = $2
    `, [relationship.doctor_id, relationship.patient_id]);

    const names = namesResult.rows[0];

    // Create system message (non-critical - don't fail if this errors)
    const message = `New session scheduled for ${sessionDate} at ${sessionTime}`;
    try {
      await pool.query(`
        INSERT INTO chat_messages 
        (sender_id, receiver_id, relationship_id, message, message_type)
        VALUES ($1, $2, $3, $4, 'system')
      `, [userId, relationship.doctor_id === userId ? relationship.patient_id : relationship.doctor_id, relationshipId, message]);
    } catch (chatError) {
      console.log('Chat message creation failed (non-critical):', chatError.message);
    }

    // Create notification (non-critical - don't fail if this errors)
    const receiverId = relationship.doctor_id === userId ? relationship.patient_id : relationship.doctor_id;
    try {
      // Use enhanced notifications table
      await pool.query(`
        INSERT INTO notifications_enhanced 
        (user_id, title, message, type, channel, severity, is_read, is_delivered)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [receiverId, 'Session Scheduled', message, 'session_scheduled', 'in_app', 'medium', false, false]);
      
      // Also insert into old table for backward compatibility
      await pool.query(`
        INSERT INTO notifications 
        (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [receiverId, 'Session Scheduled', message, 'session_scheduled']);
    } catch (notificationError) {
      console.log('Notification creation failed (non-critical):', notificationError.message);
    }

    res.json({
      success: true,
      session: {
        ...newSession,
        doctor_name: names.doctor_name,
        patient_name: names.patient_name
      },
      message: 'Session scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule session',
      message: error.message
    });
  }
});

// Update session status
router.put('/sessions/:sessionId/status', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.userId;

    // Get session details
    const sessionResult = await pool.query(`
      SELECT tss.*, dpr.doctor_id, dpr.patient_id
      FROM therapy_sessions_scheduled tss
      JOIN doctor_patient_relationships dpr ON tss.relationship_id = dpr.id
      WHERE tss.id = $1 AND (dpr.doctor_id = $2 OR dpr.patient_id = $2)
    `, [sessionId, userId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or unauthorized'
      });
    }

    const session = sessionResult.rows[0];

    // Update session
    const updateResult = await pool.query(`
      UPDATE therapy_sessions_scheduled 
      SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, notes, sessionId]);

    const updatedSession = updateResult.rows[0];

    // Create system message
    const message = `Session status updated to: ${status}`;
    await pool.query(`
      INSERT INTO chat_messages 
      (sender_id, receiver_id, relationship_id, message, message_type)
      VALUES ($1, $2, $3, $4, 'system')
    `, [userId, session.doctor_id === userId ? session.patient_id : session.doctor_id, session.relationship_id, message]);

    res.json({
      success: true,
      session: updatedSession,
      message: 'Session status updated successfully'
    });

  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session status',
      message: error.message
    });
  }
});

// Get upcoming sessions for user
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const sessionsResult = await pool.query(`
      SELECT 
        tss.*,
        doctor.name as doctor_name,
        patient.name as patient_name,
        dpr.status as relationship_status
      FROM therapy_sessions_scheduled tss
      JOIN doctor_patient_relationships dpr ON tss.relationship_id = dpr.id
      JOIN users doctor ON tss.doctor_id = doctor.id
      JOIN users patient ON tss.patient_id = patient.id
      WHERE (tss.doctor_id = $1 OR tss.patient_id = $1) 
        AND tss.session_date >= CURRENT_DATE
        AND tss.status IN ('scheduled', 'confirmed')
      ORDER BY tss.session_date ASC, tss.session_time ASC
    `, [userId]);

    res.json({
      success: true,
      sessions: sessionsResult.rows
    });

  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming sessions',
      message: error.message
    });
  }
});

module.exports = router;
