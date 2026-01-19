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
  
  // Check if migrations table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'", (err, row) => {
    if (err) {
      console.error('Error checking migrations table:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (!row) {
      console.log('No migrations table found. Creating one...');
      
      // Create migrations table
      db.run(`CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating migrations table:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('Migrations table created.');
        checkAndRunMigrations();
      });
    } else {
      console.log('Migrations table exists.');
      checkAndRunMigrations();
    }
  });
  
  function checkAndRunMigrations() {
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`\nFound ${migrationFiles.length} migration files.`);
    
    // Get executed migrations
    db.all('SELECT name FROM migrations', (err, rows) => {
      if (err) {
        console.error('Error getting executed migrations:', err.message);
        db.close();
        process.exit(1);
      }
      
      const executedMigrations = rows.map(row => row.name);
      console.log(`Executed ${executedMigrations.length} migrations.`);
      
      // Check which migrations need to be run
      const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));
      console.log(`Pending ${pendingMigrations.length} migrations.`);
      
      if (pendingMigrations.length === 0) {
        console.log('✅ All migrations have been executed.');
        db.close();
        process.exit(0);
      }
      
      // For now, just list pending migrations
      console.log('\nPending migrations:');
      pendingMigrations.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      
      db.close();
      process.exit(0);
    });
  }
});