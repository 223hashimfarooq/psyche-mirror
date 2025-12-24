/**
 * Voice Assistant Module Setup Verification Script
 * 
 * This script verifies that the voice assistant module is properly set up.
 * 
 * Usage: node backend/modules/voice_assistant_module/scripts/verify_setup.js
 */

const pool = require('../../../config/database');

async function verifySetup() {
  console.log('🔍 Verifying Voice Assistant Module Setup...\n');
  
  let allChecksPassed = true;

  // Check 1: Verify voice_commands table exists
  try {
    console.log('1️⃣  Checking voice_commands table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_commands'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('   ✅ voice_commands table exists\n');
    } else {
      console.log('   ❌ voice_commands table does NOT exist\n');
      allChecksPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Error checking table:', error.message, '\n');
    allChecksPassed = false;
  }

  // Check 2: Verify table structure
  try {
    console.log('2️⃣  Checking table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'voice_commands'
      ORDER BY ordinal_position;
    `);

    const requiredColumns = [
      'id', 'user_id', 'raw_text', 'processed_text', 'intent',
      'entities', 'confidence', 'language', 'status', 'created_at'
    ];

    const existingColumns = columns.rows.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log(`   ✅ All required columns exist (${columns.rows.length} total)\n`);
    } else {
      console.log(`   ❌ Missing columns: ${missingColumns.join(', ')}\n`);
      allChecksPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Error checking structure:', error.message, '\n');
    allChecksPassed = false;
  }

  // Check 3: Verify indexes
  try {
    console.log('3️⃣  Checking indexes...');
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'voice_commands';
    `);

    const requiredIndexes = [
      'idx_voice_commands_user_id',
      'idx_voice_commands_created_at',
      'idx_voice_commands_status'
    ];

    const existingIndexes = indexes.rows.map(idx => idx.indexname);
    const missingIndexes = requiredIndexes.filter(idx => !existingIndexes.includes(idx));

    if (missingIndexes.length === 0) {
      console.log(`   ✅ All required indexes exist (${indexes.rows.length} total)\n`);
    } else {
      console.log(`   ⚠️  Missing indexes: ${missingIndexes.join(', ')}\n`);
      // Indexes are not critical, so we don't fail the check
    }
  } catch (error) {
    console.log('   ⚠️  Error checking indexes:', error.message, '\n');
  }

  // Check 4: Verify foreign key constraint
  try {
    console.log('4️⃣  Checking foreign key constraint...');
    const constraints = await pool.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'voice_commands'::regclass
      AND contype = 'f';
    `);

    if (constraints.rows.length > 0) {
      console.log(`   ✅ Foreign key constraint exists: ${constraints.rows[0].conname}\n`);
    } else {
      console.log('   ⚠️  Foreign key constraint not found\n');
    }
  } catch (error) {
    console.log('   ⚠️  Error checking constraints:', error.message, '\n');
  }

  // Check 5: Test database connection
  try {
    console.log('5️⃣  Testing database connection...');
    await pool.query('SELECT 1');
    console.log('   ✅ Database connection successful\n');
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message, '\n');
    allChecksPassed = false;
  }

  // Check 6: Verify users table exists (required for foreign key)
  try {
    console.log('6️⃣  Checking users table (required for foreign key)...');
    const usersTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (usersTable.rows[0].exists) {
      console.log('   ✅ users table exists\n');
    } else {
      console.log('   ❌ users table does NOT exist (required for voice_commands)\n');
      allChecksPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Error checking users table:', error.message, '\n');
    allChecksPassed = false;
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  if (allChecksPassed) {
    console.log('✅ All critical checks passed! Voice Assistant module is ready.\n');
    console.log('📝 Next steps:');
    console.log('   1. Start your backend server: npm start');
    console.log('   2. Start your frontend: cd frontend && npm start');
    console.log('   3. Test the voice assistant in the Patient Dashboard\n');
  } else {
    console.log('❌ Some checks failed. Please review the errors above.\n');
    console.log('💡 Tip: Run the migration script to fix missing tables:');
    console.log('   node backend/modules/voice_assistant_module/migrations/run_migration.js\n');
  }

  process.exit(allChecksPassed ? 0 : 1);
}

// Run verification
verifySetup().catch(error => {
  console.error('\n❌ Verification script error:', error);
  process.exit(1);
});

