const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get all doctors with filters
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { specialization, experience, location, name, sortBy } = req.query;
    const userId = req.user.userId;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.specialization, u.experience,
        u.profile_picture, u.last_active,
        ds.specialization as detailed_specialization,
        ds.experience_years, ds.certification,
        COUNT(dpr.id) as patient_count,
        AVG(dpr.session_fee) as avg_session_fee,
        dp.consultation_fee as default_consultation_fee,
        dp.session_fee as default_session_fee
      FROM users u
      LEFT JOIN doctor_specializations ds ON u.id = ds.doctor_id
      LEFT JOIN doctor_patient_relationships dpr ON u.id = dpr.doctor_id AND dpr.status = 'active'
      LEFT JOIN doctor_pricing dp ON u.id = dp.doctor_id
      WHERE u.role = 'doctor'
    `;

    const queryParams = [];
    let paramCount = 0;

    // Add filters
    if (specialization) {
      paramCount++;
      query += ` AND (u.specialization ILIKE $${paramCount} OR ds.specialization ILIKE $${paramCount})`;
      queryParams.push(`%${specialization}%`);
    }

    if (experience) {
      paramCount++;
      query += ` AND u.experience >= $${paramCount}`;
      queryParams.push(parseInt(experience));
    }

    if (location) {
      paramCount++;
      query += ` AND u.address ILIKE $${paramCount}`;
      queryParams.push(`%${location}%`);
    }

    if (name) {
      paramCount++;
      query += ` AND u.name ILIKE $${paramCount}`;
      queryParams.push(`%${name}%`);
    }

    // Add sorting
    let orderBy = 'u.last_active DESC, patient_count DESC';
    if (sortBy === 'experience') {
      orderBy = 'u.experience DESC, u.name ASC';
    } else if (sortBy === 'name') {
      orderBy = 'u.name ASC';
    } else if (sortBy === 'patients') {
      orderBy = 'patient_count DESC, u.name ASC';
    }

    query += `
      GROUP BY u.id, u.name, u.email, u.phone, u.specialization, u.experience,
               u.profile_picture, u.last_active, ds.specialization, ds.experience_years, ds.certification,
               dp.consultation_fee, dp.session_fee
      ORDER BY ${orderBy}
    `;

    const result = await pool.query(query, queryParams);

    // Check if patient already has a relationship with any doctor
    const existingRelationship = await pool.query(
      `SELECT doctor_id, status FROM doctor_patient_relationships WHERE patient_id = $1`,
      [userId]
    );

    // Filter out doctors with pending relationships and map relationship status
    const doctors = result.rows
      .filter(doctor => {
        const relationship = existingRelationship.rows.find(rel => rel.doctor_id === doctor.id);
        // Exclude doctors with pending relationships
        return !relationship || relationship.status !== 'pending';
      })
      .map(doctor => ({
        ...doctor,
        has_existing_relationship: existingRelationship.rows.some(rel => 
          rel.doctor_id === doctor.id && rel.status !== 'rejected'
        ),
        relationship_status: existingRelationship.rows.find(rel => 
          rel.doctor_id === doctor.id
        )?.status || null
      }));

    res.json({
      success: true,
      doctors,
      total: doctors.length
    });

  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search doctors',
      message: error.message
    });
  }
});

// Get doctor details
router.get('/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user.userId;

    const doctorResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.specialization, u.experience,
        u.profile_picture, u.last_active, u.address,
        ds.specialization as detailed_specialization,
        ds.experience_years, ds.certification,
        COUNT(dpr.id) as patient_count,
        AVG(dpr.session_fee) as avg_session_fee
      FROM users u
      LEFT JOIN doctor_specializations ds ON u.id = ds.doctor_id
      LEFT JOIN doctor_patient_relationships dpr ON u.id = dpr.doctor_id AND dpr.status = 'active'
      WHERE u.id = $1 AND u.role = 'doctor'
      GROUP BY u.id, u.name, u.email, u.phone, u.specialization, u.experience,
               u.profile_picture, u.last_active, u.address, ds.specialization, ds.experience_years, ds.certification
    `, [doctorId]);

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const doctor = doctorResult.rows[0];

    // Check existing relationship
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE doctor_id = $1 AND patient_id = $2`,
      [doctorId, userId]
    );

    doctor.existing_relationship = relationshipResult.rows[0] || null;

    res.json({
      success: true,
      doctor
    });

  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor details',
      message: error.message
    });
  }
});

// Send contact request to doctor
router.post('/contact', verifyToken, async (req, res) => {
  try {
    const { doctorId, message } = req.body;
    const patientId = req.user.userId;

    // Check if relationship already exists
    const existingRelationship = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE doctor_id = $1 AND patient_id = $2`,
      [doctorId, patientId]
    );

    // Get doctor's default pricing
    const pricingResult = await pool.query(
      `SELECT consultation_fee, session_fee FROM doctor_pricing WHERE doctor_id = $1`,
      [doctorId]
    );

    // Use doctor's pricing or defaults
    const consultationFee = pricingResult.rows[0]?.consultation_fee || 100;
    const sessionFee = pricingResult.rows[0]?.session_fee || 150;

    let relationship;

    if (existingRelationship.rows.length > 0) {
      const existing = existingRelationship.rows[0];
      
      // If relationship is rejected, update it to pending (allow new request)
      if (existing.status === 'rejected') {
        const updateResult = await pool.query(`
          UPDATE doctor_patient_relationships 
          SET status = 'pending', consultation_fee = $1, session_fee = $2, special_notes = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING *
        `, [consultationFee, sessionFee, message, existing.id]);
        relationship = updateResult.rows[0];
      } else {
        // Relationship exists and is not rejected (pending, accepted, or active)
        return res.status(400).json({
          success: false,
          error: 'Relationship already exists',
          message: 'You already have a relationship with this doctor'
        });
      }
    } else {
      // Create new relationship
      const relationshipResult = await pool.query(`
        INSERT INTO doctor_patient_relationships 
        (doctor_id, patient_id, status, consultation_fee, session_fee, special_notes)
        VALUES ($1, $2, 'pending', $3, $4, $5)
        RETURNING *
      `, [doctorId, patientId, consultationFee, sessionFee, message]);
      relationship = relationshipResult.rows[0];
    }

    // Create system message (optional - don't fail if chat_messages table doesn't exist)
    try {
      await pool.query(`
        INSERT INTO chat_messages 
        (sender_id, receiver_id, relationship_id, message, message_type)
        VALUES ($1, $2, $3, $4, 'system')
      `, [patientId, doctorId, relationship.id, `Contact request sent: ${message}`]);
    } catch (chatError) {
      console.log('Chat message creation failed (non-critical):', chatError.message);
    }

    // Create notification for doctor (optional - don't fail if notifications table doesn't exist)
    try {
      // Use enhanced notifications table
      await pool.query(`
        INSERT INTO notifications_enhanced 
        (user_id, title, message, type, channel, severity, is_read, is_delivered)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [doctorId, 'New Contact Request', `You have received a contact request from a patient.`, 'contact_request', 'in_app', 'medium', false, false]);
      
      // Also insert into old table for backward compatibility
      await pool.query(`
        INSERT INTO notifications 
        (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [doctorId, 'New Contact Request', `You have received a contact request from a patient.`, 'contact_request']);
    } catch (notificationError) {
      console.log('Notification creation failed (non-critical):', notificationError.message);
    }

    res.json({
      success: true,
      relationship,
      message: 'Contact request sent successfully'
    });

  } catch (error) {
    console.error('Error sending contact request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send contact request',
      message: error.message
    });
  }
});

// Get patient's relationships with doctors
router.get('/relationships/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const relationshipsResult = await pool.query(`
      SELECT 
        dpr.*,
        u.name as doctor_name,
        u.email as doctor_email,
        u.phone as doctor_phone,
        u.profile_picture as doctor_profile_picture,
        u.specialization as doctor_specialization,
        u.experience as doctor_experience,
        u.last_active as doctor_last_active
      FROM doctor_patient_relationships dpr
      JOIN users u ON dpr.doctor_id = u.id
      WHERE dpr.patient_id = $1
      ORDER BY dpr.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      relationships: relationshipsResult.rows
    });

  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relationships',
      message: error.message
    });
  }
});

// Update relationship status (for doctors)
router.put('/relationships/:relationshipId/status', verifyToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { status, consultationFee, sessionFee, notes } = req.body;
    const userId = req.user.userId;

    // Verify the user is the doctor in this relationship
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships WHERE id = $1 AND doctor_id = $2`,
      [relationshipId, userId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Relationship not found or unauthorized'
      });
    }

    // For rejections, keep existing fees; for acceptances, update fees if provided
    const existingRelationship = relationshipResult.rows[0];
    const finalConsultationFee = status === 'rejected' 
      ? existingRelationship.consultation_fee 
      : (consultationFee !== null && consultationFee !== undefined ? consultationFee : existingRelationship.consultation_fee);
    const finalSessionFee = status === 'rejected' 
      ? existingRelationship.session_fee 
      : (sessionFee !== null && sessionFee !== undefined ? sessionFee : existingRelationship.session_fee);

    // When accepting, set status to 'active' to enable chat immediately
    const finalStatus = status === 'accepted' ? 'active' : status;

    console.log(`[PUT /doctors/relationships/${relationshipId}/status] Updating relationship:`, {
      relationshipId,
      requestedStatus: status,
      finalStatus,
      doctorId: userId,
      patientId: existingRelationship.patient_id,
      consultationFee: finalConsultationFee,
      sessionFee: finalSessionFee
    });

    const updateResult = await pool.query(`
      UPDATE doctor_patient_relationships 
      SET status = $1, consultation_fee = $2, session_fee = $3, special_notes = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [finalStatus, finalConsultationFee, finalSessionFee, notes || null, relationshipId]);

    const relationship = updateResult.rows[0];
    
    console.log('[PUT /doctors/relationships/:relationshipId/status] Relationship updated successfully:', {
      relationshipId: relationship.id,
      status: relationship.status,
      doctorId: relationship.doctor_id,
      patientId: relationship.patient_id,
      updated_at: relationship.updated_at
    });

    // Verify the update was successful by querying the database again
    const verifyResult = await pool.query(
      `SELECT id, status, doctor_id, patient_id, updated_at FROM doctor_patient_relationships WHERE id = $1`,
      [relationshipId]
    );
    if (verifyResult.rows.length > 0) {
      console.log('[PUT /doctors/relationships/:relationshipId/status] Verified relationship in database:', verifyResult.rows[0]);
    } else {
      console.error('[PUT /doctors/relationships/:relationshipId/status] WARNING: Relationship not found after update!');
    }

    // Get doctor's name for the notification
    const doctorResult = await pool.query(
      `SELECT name FROM users WHERE id = $1`,
      [userId]
    );
    const doctorName = doctorResult.rows[0]?.name || 'The doctor';

    // Create system message (optional - don't fail if chat_messages table doesn't exist)
    const message = (status === 'accepted' || finalStatus === 'active') ? 
      'Doctor has accepted your contact request. You can now start chatting!' : 
      'Doctor has rejected your contact request';

    try {
      await pool.query(`
        INSERT INTO chat_messages 
        (sender_id, receiver_id, relationship_id, message, message_type)
        VALUES ($1, $2, $3, $4, 'system')
      `, [userId, relationship.patient_id, relationshipId, message]);
    } catch (chatError) {
      console.log('Chat message creation failed (non-critical):', chatError.message);
    }

    // Create notification for patient
    try {
      const notificationTitle = (status === 'accepted' || finalStatus === 'active') 
        ? 'Request Accepted' 
        : 'Request Rejected';
      
      const notificationMessage = (status === 'accepted' || finalStatus === 'active')
        ? `Dr. ${doctorName} has accepted your contact request. You can now start chatting and schedule sessions.`
        : `Dr. ${doctorName} has rejected your contact request. You can send a new request to another doctor.`;
      
      // Use enhanced notifications table
      const notificationResult = await pool.query(`
        INSERT INTO notifications_enhanced 
        (user_id, title, message, type, channel, severity, is_read, is_delivered)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [relationship.patient_id, notificationTitle, notificationMessage, 'relationship_update', 'in_app', 'medium', false, false]);
      
      // Also insert into old table for backward compatibility
      await pool.query(`
        INSERT INTO notifications 
        (user_id, title, message, type, is_read)
        VALUES ($1, $2, $3, $4, $5)
      `, [relationship.patient_id, notificationTitle, notificationMessage, 'relationship_update', false]);
      
      const createdNotification = notificationResult.rows[0];
      console.log('✅ Notification created successfully:', {
        id: createdNotification.id,
        user_id: createdNotification.user_id,
        title: createdNotification.title,
        message: createdNotification.message,
        type: createdNotification.type,
        is_read: createdNotification.is_read,
        created_at: createdNotification.created_at
      });
      
      // Verify the notification was actually saved
      const verifyResult = await pool.query(
        `SELECT * FROM notifications WHERE id = $1`,
        [createdNotification.id]
      );
      
      if (verifyResult.rows.length === 0) {
        console.error('❌ WARNING: Notification was created but not found in database!');
      } else {
        console.log('✅ Notification verified in database:', verifyResult.rows[0]);
      }
    } catch (notificationError) {
      console.error('Notification creation failed:', notificationError);
      console.error('Error details:', {
        message: notificationError.message,
        code: notificationError.code,
        detail: notificationError.detail,
        patient_id: relationship.patient_id,
        doctor_id: userId,
        doctor_name: doctorName
      });
      // Don't fail the request if notification creation fails, but log it
    }

    res.json({
      success: true,
      relationship,
      message: 'Relationship status updated successfully'
    });

  } catch (error) {
    console.error('Error updating relationship status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update relationship status',
      message: error.message
    });
  }
});

// Get doctor's active patients
router.get('/my/patients', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.userId;
    console.log(`[GET /doctors/my/patients] Request received for doctorId: ${doctorId}`);

    // Verify user is a doctor
    const doctorCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [doctorId]
    );

    if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].role !== 'doctor') {
      console.log(`[GET /doctors/my/patients] Access denied for userId: ${doctorId}, role: ${doctorCheck.rows[0]?.role || 'not found'}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Doctor role required.'
      });
    }

    // First, let's check ALL relationships for this doctor (for debugging)
    const allRelationshipsResult = await pool.query(`
      SELECT 
        dpr.id as relationship_id,
        dpr.status,
        dpr.doctor_id,
        dpr.patient_id,
        dpr.created_at,
        dpr.updated_at,
        u.name as patient_name
      FROM doctor_patient_relationships dpr
      LEFT JOIN users u ON dpr.patient_id = u.id
      WHERE dpr.doctor_id = $1
      ORDER BY dpr.created_at DESC
    `, [doctorId]);

    console.log(`[GET /doctors/my/patients] Doctor ${doctorId} has ${allRelationshipsResult.rows.length} total relationships:`);
    allRelationshipsResult.rows.forEach(rel => {
      console.log(`  - Relationship ID: ${rel.relationship_id}, Status: ${rel.status}, Patient: ${rel.patient_name} (${rel.patient_id}), Created: ${rel.created_at}, Updated: ${rel.updated_at}`);
    });

    // Now query for active patients only
    const patientsResult = await pool.query(`
      SELECT 
        dpr.id as relationship_id,
        dpr.status,
        dpr.consultation_fee,
        dpr.session_fee,
        dpr.created_at as relationship_created_at,
        u.id as patient_id,
        u.name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone,
        u.profile_picture as patient_profile_picture,
        u.last_active as patient_last_active
      FROM doctor_patient_relationships dpr
      JOIN users u ON dpr.patient_id = u.id
      WHERE dpr.doctor_id = $1 AND dpr.status = 'active'
      ORDER BY dpr.created_at DESC
    `, [doctorId]);

    console.log(`[GET /doctors/my/patients] Doctor ${doctorId} has ${patientsResult.rows.length} active patients`);
    if (patientsResult.rows.length > 0) {
      console.log('[GET /doctors/my/patients] Active patients:', patientsResult.rows.map(p => ({ id: p.patient_id, name: p.patient_name, status: p.status })));
    } else {
      console.log('[GET /doctors/my/patients] No active patients found. Checking if any relationships exist with different statuses...');
      const statusCounts = {};
      allRelationshipsResult.rows.forEach(rel => {
        statusCounts[rel.status] = (statusCounts[rel.status] || 0) + 1;
      });
      console.log('[GET /doctors/my/patients] Relationship status breakdown:', statusCounts);
    }

    res.json({
      success: true,
      patients: patientsResult.rows
    });

  } catch (error) {
    console.error('[GET /doctors/my/patients] Error fetching doctor patients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patients',
      message: error.message
    });
  }
});

// Get doctor's pending patient requests
router.get('/my/requests', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.userId;

    // Verify user is a doctor
    const doctorCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [doctorId]
    );

    if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Doctor role required.'
      });
    }

    const requestsResult = await pool.query(`
      SELECT 
        dpr.id as relationship_id,
        dpr.status,
        dpr.consultation_fee,
        dpr.session_fee,
        dpr.special_notes,
        dpr.created_at as request_created_at,
        u.id as patient_id,
        u.name as patient_name,
        u.email as patient_email,
        u.phone as patient_phone,
        u.profile_picture as patient_profile_picture
      FROM doctor_patient_relationships dpr
      JOIN users u ON dpr.patient_id = u.id
      WHERE dpr.doctor_id = $1 AND dpr.status = 'pending'
      ORDER BY dpr.created_at DESC
    `, [doctorId]);

    res.json({
      success: true,
      requests: requestsResult.rows
    });

  } catch (error) {
    console.error('Error fetching doctor requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests',
      message: error.message
    });
  }
});

// Get comprehensive patient details for doctor
router.get('/my/patients/:patientId/details', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { patientId } = req.params;

    // Verify user is a doctor
    const doctorCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [doctorId]
    );

    if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Doctor role required.'
      });
    }

    // Verify the patient has an active relationship with this doctor
    const relationshipResult = await pool.query(
      `SELECT * FROM doctor_patient_relationships 
       WHERE doctor_id = $1 AND patient_id = $2 AND status = 'active'`,
      [doctorId, patientId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'No active relationship with this patient'
      });
    }

    // Get patient profile
    const patientResult = await pool.query(
      `SELECT id, name, email, phone, profile_picture, date_of_birth, 
              gender, address, emergency_contact, medical_history, 
              created_at, last_active, last_mood
       FROM users WHERE id = $1`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const patient = patientResult.rows[0];

    // Get patient emotions history
    const emotionsResult = await pool.query(
      `SELECT id, emotion_type, emotion_value, confidence, 
              facial_data, voice_data, text_data, combined_score, created_at
       FROM emotions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [patientId]
    );

    // Get therapy sessions
    const therapySessionsResult = await pool.query(
      `SELECT id, activity_id, activity_name, duration, completed, 
              progress, notes, created_at
       FROM therapy_activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [patientId]
    );

    // Get scheduled sessions with this doctor
    const scheduledSessionsResult = await pool.query(
      `SELECT tss.*, dpr.id as relationship_id
       FROM therapy_sessions_scheduled tss
       JOIN doctor_patient_relationships dpr ON tss.relationship_id = dpr.id
       WHERE dpr.doctor_id = $1 AND dpr.patient_id = $2
       ORDER BY tss.session_date DESC, tss.session_time DESC
       LIMIT 20`,
      [doctorId, patientId]
    );

    // Get therapy assessments
    const assessmentsResult = await pool.query(
      `SELECT id, interview_answers, psychological_assessment, 
              disorder_detected, therapy_plan, analysis_result, created_at
       FROM therapy_assessments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [patientId]
    );

    // Get multimodal analysis data (if table exists)
    let multimodalResult = { rows: [] };
    try {
      multimodalResult = await pool.query(
        `SELECT id, facial_emotion, facial_confidence, voice_emotion, 
                voice_confidence, text_emotion, text_confidence, 
                combined_emotion, combined_confidence, analysis_data, created_at
         FROM multimodal_analysis 
         WHERE patient_id = $1 
         ORDER BY created_at DESC 
         LIMIT 30`,
        [patientId]
      );
    } catch (error) {
      console.log('Multimodal analysis table not found, skipping:', error.message);
      // Table might not exist, that's okay
    }

    // Calculate statistics
    const totalEmotions = emotionsResult.rows.length;
    const totalSessions = therapySessionsResult.rows.length;
    const completedSessions = therapySessionsResult.rows.filter(s => s.completed).length;
    const avgConfidence = emotionsResult.rows.length > 0
      ? emotionsResult.rows.reduce((sum, e) => sum + (parseFloat(e.combined_score) || parseFloat(e.confidence) || 0), 0) / emotionsResult.rows.length
      : 0;

    // Get emotion distribution
    const emotionCounts = {};
    emotionsResult.rows.forEach(e => {
      const emotion = e.emotion_value || e.combined_emotion || 'unknown';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    res.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        profile_picture: patient.profile_picture,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        address: patient.address,
        emergency_contact: patient.emergency_contact,
        medical_history: patient.medical_history,
        created_at: patient.created_at,
        last_active: patient.last_active,
        last_mood: patient.last_mood
      },
      emotions: emotionsResult.rows,
      therapySessions: therapySessionsResult.rows,
      scheduledSessions: scheduledSessionsResult.rows,
      assessments: assessmentsResult.rows,
      multimodalAnalysis: multimodalResult.rows,
      statistics: {
        totalEmotions,
        totalSessions,
        completedSessions,
        avgConfidence: parseFloat(avgConfidence.toFixed(2)),
        emotionDistribution: emotionCounts
      },
      relationship: relationshipResult.rows[0]
    });

  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient details',
      message: error.message
    });
  }
});

// Get doctor's pricing settings
router.get('/my/pricing', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.userId;

    // Verify user is a doctor
    const doctorCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [doctorId]
    );

    if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Doctor role required.'
      });
    }

    // Get pricing from doctor_pricing table
    const pricingResult = await pool.query(`
      SELECT consultation_fee, session_fee
      FROM doctor_pricing
      WHERE doctor_id = $1
    `, [doctorId]);

    // Get default pricing or return defaults
    const defaultPricing = {
      consultation_fee: pricingResult.rows[0]?.consultation_fee || 100,
      session_fee: pricingResult.rows[0]?.session_fee || 150
    };

    res.json({
      success: true,
      pricing: defaultPricing
    });

  } catch (error) {
    console.error('Error fetching doctor pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing',
      message: error.message
    });
  }
});

// Update doctor's default pricing
router.put('/my/pricing', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { consultation_fee, session_fee } = req.body;

    // Verify user is a doctor
    const doctorCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [doctorId]
    );

    if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Doctor role required.'
      });
    }

    // Store pricing in doctor_pricing table
    const upsertResult = await pool.query(`
      INSERT INTO doctor_pricing (doctor_id, consultation_fee, session_fee, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (doctor_id) 
      DO UPDATE SET 
        consultation_fee = EXCLUDED.consultation_fee,
        session_fee = EXCLUDED.session_fee,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [doctorId, consultation_fee || 100, session_fee || 150]);

    res.json({
      success: true,
      message: 'Pricing updated successfully',
      pricing: {
        consultation_fee: upsertResult.rows[0].consultation_fee,
        session_fee: upsertResult.rows[0].session_fee
      }
    });

  } catch (error) {
    console.error('Error updating doctor pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pricing',
      message: error.message
    });
  }
});

module.exports = router;
