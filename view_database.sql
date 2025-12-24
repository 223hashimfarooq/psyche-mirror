-- PsycheMirror Database Viewing Commands
-- Run these commands in psql to view database contents

-- 1. List all tables
\dt

-- 2. View all users
SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC;

-- 3. View all emotions (latest first)
SELECT id, user_id, emotion_type, emotion_value, confidence, created_at 
FROM emotions 
ORDER BY created_at DESC 
LIMIT 20;

-- 4. View all voice commands
SELECT id, user_id, raw_text, intent, language, status, created_at 
FROM voice_commands 
ORDER BY created_at DESC 
LIMIT 20;

-- 5. View all notifications
SELECT id, user_id, title, type, is_read, created_at 
FROM notifications_enhanced 
ORDER BY created_at DESC 
LIMIT 20;

-- 6. View all therapy sessions
SELECT id, patient_id, doctor_id, session_type, status, scheduled_at 
FROM therapy_sessions 
ORDER BY scheduled_at DESC 
LIMIT 20;

-- 7. View emergency contacts
SELECT id, user_id, name, phone, email, relationship, is_primary 
FROM emergency_contacts 
ORDER BY user_id;

-- 8. View multimodal analysis results
SELECT id, patient_id, combined_emotion, combined_confidence, created_at 
FROM multimodal_analysis 
ORDER BY created_at DESC 
LIMIT 20;

-- 9. Count records in each table
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'emotions', COUNT(*) FROM emotions
UNION ALL
SELECT 'voice_commands', COUNT(*) FROM voice_commands
UNION ALL
SELECT 'notifications_enhanced', COUNT(*) FROM notifications_enhanced
UNION ALL
SELECT 'therapy_sessions', COUNT(*) FROM therapy_sessions
UNION ALL
SELECT 'emergency_contacts', COUNT(*) FROM emergency_contacts
UNION ALL
SELECT 'multimodal_analysis', COUNT(*) FROM multimodal_analysis
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
ORDER BY table_name;

-- 10. View user notification preferences
SELECT user_id, enable_emotion_alerts, enable_emergency_alerts, preferred_channels 
FROM user_notification_preferences;

-- 11. View detailed emotion analysis with user info
SELECT 
    e.id,
    u.name as user_name,
    u.email,
    e.emotion_type,
    e.emotion_value,
    e.confidence,
    e.combined_score,
    e.created_at
FROM emotions e
JOIN users u ON e.user_id = u.id
ORDER BY e.created_at DESC
LIMIT 20;

-- 12. View table structure for a specific table (example: emotions)
\d emotions

-- 13. View all columns in users table
\d users

-- 14. Exit psql
\q










