const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Direct page content verification...');

// Check database content
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  
  console.log('\n📋 Current database prices:');
  db.all('SELECT package_name, customer_price FROM voucher_pricing ORDER BY customer_price ASC', (err, rows) => {
    if (err) {
      console.error('Error querying database:', err.message);
      db.close();
      return;
    }
    
    rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.package_name}: Rp ${row.customer_price.toLocaleString('id-ID')}`);
    });
    
    // Check page content
    checkPageContent(rows);
    
    db.close();
  });
});

function checkPageContent(dbPrices) {
  console.log('\n🌐 Fetching current voucher page...');
  
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
      
      // Extract prices from page
      const priceMatches = data.match(/Rp\s*\d{1,3}(?:\.\d{3})*/g);
      if (priceMatches) {
        console.log('\n💰 Prices found on page:');
        priceMatches.forEach((price, index) => {
          console.log(`  ${index + 1}. ${price}`);
        });
        
        // Compare with database
        console.log('\n🔄 Comparison with database:');
        let allMatch = true;
        
        dbPrices.forEach((dbPrice, index) => {
          const pagePrice = priceMatches[index];
          const dbPriceFormatted = `Rp ${dbPrice.customer_price.toLocaleString('id-ID')}`;
          
          if (pagePrice === dbPriceFormatted) {
            console.log(`  ✅ ${dbPrice.package_name}: ${pagePrice} (MATCH)`);
          } else {
            console.log(`  ❌ ${dbPrice.package_name}: DB=${dbPriceFormatted}, Page=${pagePrice} (MISMATCH)`);
            allMatch = false;
          }
        });
        
        if (allMatch) {
          console.log('\n🎉 PERFECT MATCH: All prices on page match database values!');
        } else {
          console.log('\n⚠️  Some prices do not match database values.');
        }
      } else {
        console.log('No prices found on page');
      }
      
      // Check for database-driven package structure
      const packageStructure = data.match(/pkg-\d+/g);
      if (packageStructure) {
        console.log(`\n✅ Database-driven packages detected: ${packageStructure.length} packages`);
      } else {
        console.log('\n⚠️  No database-driven packages detected');
      }
      
      console.log('\n✅ Direct page check completed.');
    });
  });

  req.on('error', (error) => {
    console.error(`❌ ERROR: ${error.message}`);
  });

  req.end();
}