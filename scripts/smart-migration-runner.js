const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('Connected to the database.');
  
  // Check if migrations table exists and create if not
  initializeMigrationsTable();
});

function initializeMigrationsTable() {
  db.run(`CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating migrations table:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('Migrations table ready.');
    checkAndRunSpecificMigrations();
  });
}

function checkAndRunSpecificMigrations() {
  // Check if specific columns exist before trying to add them
  checkColumnExists('voucher_online_settings', 'digits', (exists) => {
    if (!exists) {
      console.log('Adding missing digits column...');
      runSingleMigration('add_digits_to_voucher_online_settings.sql');
    } else {
      console.log('Digits column already exists.');
    }
    
    checkColumnExists('voucher_online_settings', 'name', (exists) => {
      if (!exists) {
        console.log('Adding missing name column...');
        runSingleMigration('add_name_to_voucher_online_settings.sql');
      } else {
        console.log('Name column already exists.');
      }
      
      // Check for other potentially missing columns
      checkAndFixOtherIssues();
    });
  });
}

function checkColumnExists(tableName, columnName, callback) {
  db.get(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err) {
      console.error(`Error checking table ${tableName}:`, err.message);
      callback(false);
      return;
    }
    
    const columnExists = rows.some(row => row.name === columnName);
    callback(columnExists);
  });
}

function runSingleMigration(migrationFileName) {
  const migrationPath = path.join(__dirname, '..', 'migrations', migrationFileName);
  
  if (!fs.existsSync(migrationPath)) {
    console.log(`Migration file ${migrationFileName} not found.`);
    return;
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  db.exec(migrationSQL, (err) => {
    if (err) {
      console.error(`Error executing migration ${migrationFileName}:`, err.message);
    } else {
      console.log(`✅ Migration ${migrationFileName} executed successfully.`);
      
      // Record that this migration was executed
      db.run('INSERT OR IGNORE INTO migrations (name) VALUES (?)', [migrationFileName], (err) => {
        if (err) {
          console.error(`Error recording migration ${migrationFileName}:`, err.message);
        }
      });
    }
  });
}

function checkAndFixOtherIssues() {
  // Test a complete voucher settings update to make sure everything works
  console.log('\nTesting complete voucher settings update...');
  
  const testQuery = `
    INSERT OR REPLACE INTO voucher_online_settings
    (package_id, name, profile, digits, price, enabled, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  
  const testValues = ['test-final', 'Final Test Package', 'test-profile', 7, 20000, 1];
  
  db.run(testQuery, testValues, function(err) {
    if (err) {
      console.error('❌ Error with final test:', err.message);
      cleanupAndExit(1);
      return;
    }
    
    console.log('✅ Final test executed successfully.');
    console.log(`   Rows affected: ${this.changes}`);
    
    // Clean up test data
    db.run('DELETE FROM voucher_online_settings WHERE package_id = ?', ['test-final'], (err) => {
      if (err) {
        console.error('Warning: Could not clean up test data:', err.message);
      } else {
        console.log('✅ Test data cleaned up successfully');
      }
      
      console.log('\n🎉 Migration process completed!');
      cleanupAndExit(0);
    });
  });
}

function cleanupAndExit(code) {
  db.close();
  process.exit(code);
}