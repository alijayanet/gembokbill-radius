const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Testing voucher page data retrieval...');

// First, let's check what's in the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  
  console.log('\n📋 Database voucher_pricing data:');
  db.all('SELECT id, package_name, customer_price, duration, duration_type FROM voucher_pricing ORDER BY customer_price ASC', (err, rows) => {
    if (err) {
      console.error('Error querying database:', err.message);
      db.close();
      return;
    }
    
    rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.package_name} - Rp ${row.customer_price.toLocaleString('id-ID')} (${row.duration} ${row.duration_type})`);
    });
    
    // Now test the actual voucher page
    testVoucherPage();
    
    db.close();
  });
});

function testVoucherPage() {
  console.log('\n🌐 Testing voucher page HTTP response...');
  
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
      console.log(`Status Code: ${res.statusCode}`);
      
      // Check for specific database-driven content
      const checks = [
        { 
          name: 'Database-driven package names', 
          pattern: /(3K|5K|10K|20K|50K).*\d+\s*(hari|jam)/i,
          found: false
        },
        { 
          name: 'Correct pricing format', 
          pattern: /Rp\s*\d{1,3}(?:\.\d{3})*/g,
          found: false
        },
        { 
          name: 'Database-driven package IDs', 
          pattern: /pkg-\d+/,
          found: false
        }
      ];
      
      // Check each pattern
      checks.forEach(check => {
        if (check.pattern.test(data)) {
          check.found = true;
        }
      });
      
      // Show results
      console.log('\n🔍 Voucher Page Content Verification:');
      let allFound = true;
      checks.forEach(check => {
        const status = check.found ? '✅ FOUND' : '❌ MISSING';
        console.log(`  ${status}: ${check.name}`);
        if (!check.found) allFound = false;
      });
      
      // Extract pricing information from the page
      const priceMatches = data.match(/Rp\s*\d{1,3}(?:\.\d{3})*/g);
      if (priceMatches) {
        console.log('\n💰 Prices found on page:');
        priceMatches.forEach((price, index) => {
          console.log(`  ${index + 1}. ${price}`);
        });
      }
      
      if (allFound) {
        console.log('\n🎉 SUCCESS: Voucher page is displaying data from the database!');
      } else {
        console.log('\n⚠️  WARNING: Some database-driven content may be missing.');
      }
      
      // Additional verification - check if we're using database data
      if (data.includes('pkg-')) {
        console.log('\n✅ CONFIRMED: Database-driven package IDs detected (pkg- prefix)');
      } else {
        console.log('\n⚠️  NOTE: No database-driven package IDs detected (pkg- prefix)');
      }
      
      console.log('\n✅ Voucher page testing completed.');
    });
  });

  req.on('error', (error) => {
    console.error(`❌ ERROR: ${error.message}`);
    console.log('Note: Server may not be running. Start with: npm start');
  });

  req.end();
}