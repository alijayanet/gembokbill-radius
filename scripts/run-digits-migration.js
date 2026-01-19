const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

// Path to the migration file
const migrationPath = path.join(__dirname, '..', 'migrations', 'add_digits_to_voucher_online_settings.sql');

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
    
    // Verify the column was added
    db.all("PRAGMA table_info(voucher_online_settings)", (err, rows) => {
      if (err) {
        console.error('Error getting table info:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('\nvoucher_online_settings table structure:');
      rows.forEach(row => {
        console.log(`- ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? 'DEFAULT ' + row.dflt_value : ''}`);
      });
      
      // Show sample data
      db.all("SELECT * FROM voucher_online_settings LIMIT 3", (err, rows) => {
        if (err) {
          console.error('Error getting sample data:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('\nSample data:');
        rows.forEach(row => {
          console.log(row);
        });
        
        db.close();
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
      });
    });
  });
});