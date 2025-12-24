const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'openpg',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'psychemirror',
  password: process.env.DB_PASSWORD || 'openpgpwd',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor')),
        specialization VARCHAR(100),
        experience INTEGER,
        profile_picture TEXT,
        date_of_birth DATE,
        gender VARCHAR(20),
        address TEXT,
        emergency_contact VARCHAR(20),
        medical_history TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_mood VARCHAR(50) DEFAULT 'neutral'
      )
    `);

    // Create emotions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emotions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        emotion_type VARCHAR(50) NOT NULL,
        emotion_value VARCHAR(50) NOT NULL,
        confidence DECIMAL(5,2),
        facial_data JSONB,
        voice_data JSONB,
        text_data JSONB,
        combined_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create therapy_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapy_sessions (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_type VARCHAR(100) NOT NULL,
        duration INTEGER,
        notes TEXT,
        mood_before VARCHAR(50),
        mood_after VARCHAR(50),
        status VARCHAR(20) DEFAULT 'scheduled',
        scheduled_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create therapy_tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapy_tracking (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        therapy_type VARCHAR(100) NOT NULL,
        therapy_status VARCHAR(50) DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE,
        progress_score DECIMAL(5,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create emotional_progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emotional_progress (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_date DATE NOT NULL,
        emotional_score DECIMAL(5,2) NOT NULL,
        therapy_session_id INTEGER REFERENCES therapy_sessions(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create multimodal_analysis table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS multimodal_analysis (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        facial_emotion VARCHAR(50),
        facial_confidence DECIMAL(5,2),
        voice_emotion VARCHAR(50),
        voice_confidence DECIMAL(5,2),
        text_emotion VARCHAR(50),
        text_confidence DECIMAL(5,2),
        combined_emotion VARCHAR(50),
        combined_confidence DECIMAL(5,2),
        analysis_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create therapy_assessments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapy_assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        interview_answers JSONB NOT NULL,
        psychological_assessment JSONB NOT NULL,
        disorder_detected JSONB,
        therapy_plan JSONB NOT NULL,
        analysis_result JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create therapy_activities table (for individual activities)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapy_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_id VARCHAR(100) NOT NULL,
        activity_name VARCHAR(255) NOT NULL,
        duration INTEGER NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        progress INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create doctor_patient_relationships table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_patient_relationships (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'active', 'completed')),
        consultation_fee DECIMAL(10,2),
        session_fee DECIMAL(10,2),
        special_notes TEXT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id, patient_id)
      )
    `);

    // Create doctor_specializations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_specializations (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        specialization VARCHAR(100) NOT NULL,
        experience_years INTEGER DEFAULT 0,
        certification TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create doctor_pricing table for storing default pricing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_pricing (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        consultation_fee DECIMAL(10,2) DEFAULT 100,
        session_fee DECIMAL(10,2) DEFAULT 150,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chat_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        relationship_id INTEGER REFERENCES doctor_patient_relationships(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create therapy_sessions_scheduled table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapy_sessions_scheduled (
        id SERIAL PRIMARY KEY,
        relationship_id INTEGER REFERENCES doctor_patient_relationships(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_date DATE NOT NULL,
        session_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        session_type VARCHAR(50) DEFAULT 'consultation',
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
        notes TEXT,
        fee DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create privacy_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS privacy_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        data_retention_days INTEGER DEFAULT 365,
        allow_data_sharing BOOLEAN DEFAULT FALSE,
        allow_analytics BOOLEAN DEFAULT FALSE,
        encryption_enabled BOOLEAN DEFAULT TRUE,
        anonymize_data BOOLEAN DEFAULT FALSE,
        gdpr_consent BOOLEAN DEFAULT FALSE,
        gdpr_consent_date TIMESTAMP,
        hipaa_compliant BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create mfa_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mfa_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret TEXT,
        backup_codes TEXT, -- JSON array of backup codes
        backup_codes_used TEXT, -- JSON array of used backup codes
        last_mfa_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure mfa_secret column can store long encrypted strings
    await pool.query(`
      ALTER TABLE mfa_settings
      ALTER COLUMN mfa_secret TYPE TEXT
      USING mfa_secret::TEXT
    `);

    // Create audit_logs table for compliance tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create data_deletion_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_deletion_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('delete', 'anonymize')),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by INTEGER REFERENCES users(id),
        notes TEXT
      )
    `);

    // Create notifications_enhanced table (extended notifications)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications_enhanced (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        channel VARCHAR(20) DEFAULT 'in_app',
        severity VARCHAR(20) DEFAULT 'medium',
        emotion_data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        is_delivered BOOLEAN DEFAULT FALSE,
        delivery_attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP
      )
    `);

    // Create user_notification_preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        enable_emotion_alerts BOOLEAN DEFAULT TRUE,
        enable_scheduled_reminders BOOLEAN DEFAULT TRUE,
        enable_motivational_messages BOOLEAN DEFAULT TRUE,
        enable_self_care_reminders BOOLEAN DEFAULT TRUE,
        enable_emergency_alerts BOOLEAN DEFAULT TRUE,
        preferred_channels JSONB DEFAULT '["in_app"]',
        frequency VARCHAR(20) DEFAULT 'instant',
        quiet_hours_start VARCHAR(5) DEFAULT '22:00',
        quiet_hours_end VARCHAR(5) DEFAULT '08:00',
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create emergency_contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        relationship VARCHAR(50) DEFAULT 'other',
        is_primary BOOLEAN DEFAULT FALSE,
        notify_on_critical BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create scheduled_notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        notification_data JSONB NOT NULL,
        schedule_type VARCHAR(20) NOT NULL,
        schedule_config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        next_run_at TIMESTAMP NOT NULL,
        last_run_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create emergency_alert_preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_alert_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        enable_detection BOOLEAN DEFAULT TRUE,
        alert_methods JSONB DEFAULT '["sms", "email"]',
        require_consent BOOLEAN DEFAULT TRUE,
        allow_manual_override BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create voice_commands table for voice assistant module
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_commands (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        raw_text TEXT NOT NULL,
        processed_text TEXT,
        intent VARCHAR(100),
        entities JSONB,
        confidence DECIMAL(3, 2) DEFAULT 0.0,
        language VARCHAR(10) DEFAULT 'en',
        audio_file_path TEXT,
        response_text TEXT,
        response_audio_path TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      )
    `);

    // Create indexes for voice_commands table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_commands_created_at ON voice_commands(created_at DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_commands_status ON voice_commands(status)
    `);

    // Add missing columns if they don't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture TEXT,
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20),
      ADD COLUMN IF NOT EXISTS medical_history TEXT,
      ADD COLUMN IF NOT EXISTS encrypted_data TEXT
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};

// Initialize database on startup (with error handling)
initializeDatabase().catch(error => {
  console.error('❌ Database initialization failed:', error);
});

module.exports = pool;
