const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

// Path to the migration file
const migrationPath = path.join(__dirname, '..', 'migrations', 'add_price_to_voucher_online_settings.sql');

// Read the migration file
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('Connected to the database.');
  
  // Run the migration
  db.exec(migrationSQL, (err) => {
    if (err) {
      console.error('Error executing migration:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('Migration executed successfully.');
    db.close();
    process.exit(0);
  });
});