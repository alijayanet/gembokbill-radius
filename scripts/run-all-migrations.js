const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runPendingMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📋 Found ${migrationFiles.length} migration files`);
    
    // Create migrations table if not exists
    const dbType = require('../config/settingsManager').getSetting('db_type', 'sqlite');
    
    if (dbType === 'sqlite') {
      await db.execute(`CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    } else {
      await db.execute(`CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    }
    
    console.log('✅ Migrations table ready');
    
    // Get executed migrations
    const executedMigrations = await db.query('SELECT name FROM migrations');
    const executedNames = executedMigrations.map(row => row.name);
    const pendingMigrations = migrationFiles.filter(file => !executedNames.includes(file));
    
    console.log(`⏳ Pending ${pendingMigrations.length} migrations`);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations have been executed.');
      return;
    }
    
    // Run pending migrations one by one
    for (let i = 0; i < pendingMigrations.length; i++) {
      const migrationFile = pendingMigrations[i];
      const migrationPath = path.join(migrationsDir, migrationFile);
      
      console.log(`\n🚀 Running migration ${i + 1}/${pendingMigrations.length}: ${migrationFile}`);
      
      // Read migration file
      let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Convert SQLite syntax to MySQL if needed
      if (dbType === 'mysql') {
        migrationSQL = convertSQLiteToMySQL(migrationSQL);
      }
      
      // Execute migration
      try {
        await db.execute(migrationSQL);
        console.log(`✅ Migration ${migrationFile} executed successfully`);
      } catch (err) {
        if (err.message.includes('duplicate') || 
            err.message.includes('already exists') ||
            err.message.includes('Duplicate column') ||
            err.message.includes('Duplicate entry')) {
          console.log(`⚠️  Warning (non-critical): ${err.message}`);
          console.log('   Continuing with next migration...');
        } else {
          console.error(`❌ Error executing migration ${migrationFile}:`, err.message);
          throw err;
        }
      }
      
      // Record that this migration was executed
      try {
        await db.execute('INSERT OR IGNORE INTO migrations (name) VALUES (?)', [migrationFile]);
      } catch (err) {
        if (dbType === 'mysql') {
          await db.execute('INSERT IGNORE INTO migrations (name) VALUES (?)', [migrationFile]);
        }
      }
    }
    
    console.log('\n✅ All pending migrations executed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

function convertSQLiteToMySQL(sql) {
  // Convert SQLite specific syntax to MySQL
  let converted = sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
    .replace(/INTEGER PRIMARY KEY/gi, 'INT PRIMARY KEY')
    .replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT')
    .replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE')
    .replace(/INSERT OR REPLACE/gi, 'REPLACE')
    .replace(/BOOLEAN/gi, 'TINYINT(1)')
    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    .replace(/REAL/gi, 'DOUBLE');
  
  // Remove SQLite-specific indexes and recreate for MySQL
  converted = converted.replace(/CREATE UNIQUE INDEX IF NOT EXISTS/gi, 'CREATE UNIQUE INDEX');
  converted = converted.replace(/CREATE INDEX IF NOT EXISTS/gi, 'CREATE INDEX');
  
  return converted;
}

// Run if called directly
if (require.main === module) {
  runPendingMigrations()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runPendingMigrations };