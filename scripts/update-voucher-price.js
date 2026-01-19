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
  
  // Update the 3K package price to 2000
  const newCustomerPrice = 2000;
  const newAgentPrice = 1500; // Adjusted agent price
  const newCommission = 500;   // Adjusted commission
  
  console.log(`Updating 3K package price to Rp ${newCustomerPrice.toLocaleString('id-ID')}...`);
  
  db.run(`UPDATE voucher_pricing 
          SET customer_price = ?, agent_price = ?, commission_amount = ?
          WHERE package_name = '3K'`, 
          [newCustomerPrice, newAgentPrice, newCommission], function(err) {
    if (err) {
      console.error('Error updating price:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log(`✅ Successfully updated 3K package.`);
    console.log(`   Rows affected: ${this.changes}`);
    
    // Verify the update
    db.get('SELECT id, package_name, customer_price, agent_price, commission_amount FROM voucher_pricing WHERE package_name = "3K"', (err, row) => {
      if (err) {
        console.error('Error querying database:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (row) {
        console.log('\nUpdated 3K package pricing:');
        console.log(`  ID: ${row.id}`);
        console.log(`  Package Name: ${row.package_name}`);
        console.log(`  Customer Price: Rp ${row.customer_price.toLocaleString('id-ID')}`);
        console.log(`  Agent Price: Rp ${row.agent_price.toLocaleString('id-ID')}`);
        console.log(`  Commission Amount: Rp ${row.commission_amount.toLocaleString('id-ID')}`);
      }
      
      db.close();
      console.log('\n✅ Price update completed.');
      process.exit(0);
    });
  });
});