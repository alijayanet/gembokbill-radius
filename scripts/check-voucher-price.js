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
  
  // Check the current price of 3K package
  db.get('SELECT id, package_name, customer_price, agent_price, commission_amount FROM voucher_pricing WHERE package_name = "3K"', (err, row) => {
    if (err) {
      console.error('Error querying database:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (row) {
      console.log('Current 3K package pricing:');
      console.log(`  ID: ${row.id}`);
      console.log(`  Package Name: ${row.package_name}`);
      console.log(`  Customer Price: Rp ${row.customer_price.toLocaleString('id-ID')}`);
      console.log(`  Agent Price: Rp ${row.agent_price.toLocaleString('id-ID')}`);
      console.log(`  Commission Amount: Rp ${row.commission_amount.toLocaleString('id-ID')}`);
    } else {
      console.log('3K package not found in database.');
    }
    
    // Check all voucher packages
    console.log('\nAll voucher packages:');
    db.all('SELECT id, package_name, customer_price FROM voucher_pricing ORDER BY customer_price ASC', (err, rows) => {
      if (err) {
        console.error('Error querying database:', err.message);
        db.close();
        process.exit(1);
      }
      
      rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.package_name}: Rp ${row.customer_price.toLocaleString('id-ID')} (ID: ${row.id})`);
      });
      
      db.close();
      process.exit(0);
    });
  });
});