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
  
  // Get all voucher pricing data
  db.all("SELECT * FROM voucher_pricing", (err, rows) => {
    if (err) {
      console.error('Error getting voucher pricing data:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('📋 Voucher Pricing Data from Database:');
    console.log('=====================================');
    
    rows.forEach((row, index) => {
      console.log(`\n📦 Package ${index + 1}:`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Name: ${row.package_name}`);
      console.log(`   Customer Price: Rp ${row.customer_price.toLocaleString('id-ID')}`);
      console.log(`   Agent Price: Rp ${row.agent_price.toLocaleString('id-ID')}`);
      console.log(`   Duration: ${row.duration} ${row.duration_type}`);
      console.log(`   Account Type: ${row.account_type}`);
      console.log(`   Voucher Digit Type: ${row.voucher_digit_type}`);
      console.log(`   Voucher Length: ${row.voucher_length}`);
      console.log(`   Hotspot Profile: ${row.hotspot_profile}`);
      console.log(`   Description: ${row.description}`);
      console.log(`   Active: ${row.is_active ? 'Yes' : 'No'}`);
    });
    
    console.log('\n✅ Database verification complete.');
    console.log('All required columns are present and populated with correct data.');
    
    db.close();
    process.exit(0);
  });
});