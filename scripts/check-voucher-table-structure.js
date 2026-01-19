const sqlite3 = require('sqlite3').verbose();
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
  
  // Get table info for voucher_pricing
  db.all("PRAGMA table_info(voucher_pricing)", (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('voucher_pricing table structure:');
    rows.forEach(row => {
      console.log(`- ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? 'DEFAULT ' + row.dflt_value : ''}`);
    });
    
    // Get sample data
    db.all("SELECT * FROM voucher_pricing LIMIT 5", (err, rows) => {
      if (err) {
        console.error('Error getting sample data:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('\nSample data from voucher_pricing:');
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.package_name} - Rp ${row.customer_price} (${row.duration} ${row.duration_type})`);
      });
      
      db.close();
      process.exit(0);
    });
  });
});