-- Create voice_commands table for voice assistant module
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
  processed_at TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_voice_commands_created_at ON voice_commands(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_voice_commands_status ON voice_commands(status);

COMMENT ON TABLE voice_commands IS 'Stores voice commands and their processing results';
COMMENT ON COLUMN voice_commands.intent IS 'Intent classification: emotion_query, mood_history, relaxation_advice, start_meditation, navigation, settings, help';
COMMENT ON COLUMN voice_commands.status IS 'Command status: pending, processing, completed, failed';

