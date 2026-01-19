const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node update-voucher-pricing.js <package_name> <customer_price> [agent_price] [commission_amount]');
  console.log('Example: node update-voucher-pricing.js 3K 2000 1500 500');
  console.log('If agent_price and commission_amount are not provided, they will be calculated automatically');
  process.exit(1);
}

const packageName = args[0];
const customerPrice = parseInt(args[1]);
let agentPrice = args[2] ? parseInt(args[2]) : Math.round(customerPrice * 0.75);
let commissionAmount = args[3] ? parseInt(args[3]) : customerPrice - agentPrice;

// Validate inputs
if (isNaN(customerPrice) || customerPrice <= 0) {
  console.error('Invalid customer price. Please provide a positive number.');
  process.exit(1);
}

if (isNaN(agentPrice) || agentPrice < 0) {
  console.error('Invalid agent price. Please provide a non-negative number.');
  process.exit(1);
}

if (isNaN(commissionAmount) || commissionAmount < 0) {
  console.error('Invalid commission amount. Please provide a non-negative number.');
  process.exit(1);
}

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log(`Updating ${packageName} package pricing...`);
  console.log(`  Customer Price: Rp ${customerPrice.toLocaleString('id-ID')}`);
  console.log(`  Agent Price: Rp ${agentPrice.toLocaleString('id-ID')}`);
  console.log(`  Commission Amount: Rp ${commissionAmount.toLocaleString('id-ID')}`);
  
  // Check if package exists
  db.get('SELECT id, package_name FROM voucher_pricing WHERE package_name = ?', [packageName], (err, row) => {
    if (err) {
      console.error('Error querying database:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (!row) {
      console.log(`Package ${packageName} not found. Creating new package...`);
      createNewPackage(packageName, customerPrice, agentPrice, commissionAmount);
    } else {
      console.log(`Found package ${packageName} (ID: ${row.id}). Updating...`);
      updateExistingPackage(row.id, packageName, customerPrice, agentPrice, commissionAmount);
    }
  });
});

function updateExistingPackage(id, packageName, customerPrice, agentPrice, commissionAmount) {
  const db = new sqlite3.Database(dbPath);
  
  db.run(`UPDATE voucher_pricing 
          SET customer_price = ?, agent_price = ?, commission_amount = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`, 
          [customerPrice, agentPrice, commissionAmount, id], function(err) {
    if (err) {
      console.error('Error updating package:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log(`✅ Successfully updated ${packageName} package.`);
    console.log(`   Rows affected: ${this.changes}`);
    
    // Verify the update
    db.get('SELECT id, package_name, customer_price, agent_price, commission_amount FROM voucher_pricing WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error verifying update:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (row) {
        console.log('\nUpdated package details:');
        console.log(`  ID: ${row.id}`);
        console.log(`  Package Name: ${row.package_name}`);
        console.log(`  Customer Price: Rp ${row.customer_price.toLocaleString('id-ID')}`);
        console.log(`  Agent Price: Rp ${row.agent_price.toLocaleString('id-ID')}`);
        console.log(`  Commission Amount: Rp ${row.commission_amount.toLocaleString('id-ID')}`);
      }
      
      db.close();
      console.log('\n✅ Package update completed successfully!');
      process.exit(0);
    });
  });
}

function createNewPackage(packageName, customerPrice, agentPrice, commissionAmount) {
  const db = new sqlite3.Database(dbPath);
  
  // Default values for new package
  const duration = 1;
  const durationType = 'days';
  const description = `Voucher ${packageName} - ${duration} ${durationType}`;
  const isActive = 1;
  const hotspotProfile = packageName.toLowerCase();
  const voucherDigitType = 'numbers';
  const voucherLength = packageName.includes('K') && parseInt(packageName) <= 10 ? 4 : 5;
  const accountType = 'voucher';
  
  db.run(`INSERT INTO voucher_pricing 
          (package_name, customer_price, agent_price, commission_amount, duration, duration_type, description, is_active, hotspot_profile, voucher_digit_type, voucher_length, account_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, 
          [packageName, customerPrice, agentPrice, commissionAmount, duration, durationType, description, isActive, hotspotProfile, voucherDigitType, voucherLength, accountType], function(err) {
    if (err) {
      console.error('Error creating package:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log(`✅ Successfully created new ${packageName} package.`);
    console.log(`   New package ID: ${this.lastID}`);
    
    db.close();
    console.log('\n✅ New package creation completed successfully!');
    process.exit(0);
  });
}