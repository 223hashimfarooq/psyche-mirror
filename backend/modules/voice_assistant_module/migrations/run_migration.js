/**
 * Voice Assistant Module Database Migration Script
 * 
 * This script creates the voice_commands table for the voice assistant module.
 * Run this script if you need to manually create the table.
 * 
 * Usage: node backend/modules/voice_assistant_module/migrations/run_migration.js
 */

const pool = require('../../../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Starting voice_commands table migration...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_voice_commands_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  Already exists:', statement.substring(0, 50) + '...');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Voice commands table is ready to use.\n');

    // Verify table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_commands'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ Verification: voice_commands table exists');
      
      // Get table info
      const tableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'voice_commands'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Table structure:');
      tableInfo.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
runMigration();

