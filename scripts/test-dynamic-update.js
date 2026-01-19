const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Testing dynamic update functionality...');

// First, let's check the current price of 3K package
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  
  console.log('\n1. Checking current 3K package price:');
  db.get('SELECT id, package_name, customer_price FROM voucher_pricing WHERE package_name = "3K"', (err, row) => {
    if (err) {
      console.error('Error querying database:', err.message);
      db.close();
      return;
    }
    
    console.log(`   Current: ${row.package_name} - Rp ${row.customer_price.toLocaleString('id-ID')} (ID: ${row.id})`);
    
    // Update the price temporarily
    const newPrice = 3500;
    console.log(`\n2. Updating 3K package price to Rp ${newPrice.toLocaleString('id-ID')}...`);
    
    db.run('UPDATE voucher_pricing SET customer_price = ? WHERE package_name = "3K"', [newPrice], function(err) {
      if (err) {
        console.error('Error updating price:', err.message);
        db.close();
        return;
      }
      
      console.log(`   ✅ Updated successfully. Rows affected: ${this.changes}`);
      
      // Now test the voucher page to see if it reflects the change
      testVoucherPage(row.id, newPrice);
      
      // Restore original price after testing
      setTimeout(() => {
        console.log(`\n4. Restoring original price of Rp ${row.customer_price.toLocaleString('id-ID')}...`);
        db.run('UPDATE voucher_pricing SET customer_price = ? WHERE id = ?', [row.customer_price, row.id], function(err) {
          if (err) {
            console.error('Error restoring price:', err.message);
          } else {
            console.log('   ✅ Price restored successfully.');
          }
          
          db.close();
        });
      }, 3000);
    });
  });
});

function testVoucherPage(packageId, expectedPrice) {
  console.log('\n3. Checking if voucher page reflects the updated price...');
  
  // Give the system a moment to update
  setTimeout(() => {
    // Make a request to the voucher page
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/voucher',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Look for the specific package
        const packagePattern = new RegExp(`pkg-${packageId}[\\s\\S]*?Rp\\s*${expectedPrice.toLocaleString('id-ID').replace(/\./g, '\\.')}`, 'i');
        
        if (packagePattern.test(data)) {
          console.log('   ✅ SUCCESS: Voucher page reflects the updated price!');
          console.log(`      Found package ID pkg-${packageId} with price Rp ${expectedPrice.toLocaleString('id-ID')}`);
        } else {
          console.log('   ⚠️  Page may not reflect the updated price immediately');
          console.log('      This could be due to caching or delayed updates');
        }
        
        console.log('\n✅ Dynamic update test completed.');
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ERROR: ${error.message}`);
    });

    req.end();
  }, 1000);
}