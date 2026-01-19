const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🔍 Detailed voucher page testing...');

// First, let's get the exact data from the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  
  console.log('\n📋 Exact database voucher_pricing data:');
  db.all('SELECT id, package_name, customer_price, duration, duration_type, description FROM voucher_pricing WHERE is_active = 1 ORDER BY customer_price ASC', (err, rows) => {
    if (err) {
      console.error('Error querying database:', err.message);
      db.close();
      return;
    }
    
    const dbPackages = [];
    rows.forEach((row, index) => {
      const durationText = row.duration_type === 'days' ? `${row.duration} hari` : `${row.duration} jam`;
      console.log(`  ${index + 1}. ID: ${row.id} | ${row.package_name} | Rp ${row.customer_price.toLocaleString('id-ID')} | ${durationText} | ${row.description}`);
      dbPackages.push({
        id: row.id,
        name: row.package_name,
        price: row.customer_price,
        duration: durationText,
        description: row.description
      });
    });
    
    // Now test the actual voucher page
    testVoucherPage(dbPackages);
    
    db.close();
  });
});

function testVoucherPage(dbPackages) {
  console.log('\n🌐 Fetching voucher page content...');
  
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
      
      // Parse the HTML to extract package information
      console.log('\n📄 Analyzing page content...');
      
      // Extract package cards
      const packageMatches = data.match(/<div class="voucher-card">[\s\S]*?<\/div>\s*<\/div>/g);
      if (packageMatches) {
        console.log(`Found ${packageMatches.length} voucher packages on page:`);
        
        packageMatches.forEach((packageHtml, index) => {
          // Extract package name
          const nameMatch = packageHtml.match(/<div class="voucher-duration">([^<]+)<\/div>/);
          const priceMatch = packageHtml.match(/<div class="voucher-price">Rp ([^<]+)<\/div>/);
          const descMatch = packageHtml.match(/<div class="voucher-description">([^<]+)<\/div>/);
          
          const packageName = nameMatch ? nameMatch[1].trim() : 'Unknown';
          const packagePrice = priceMatch ? priceMatch[1].trim() : 'Unknown';
          const packageDesc = descMatch ? descMatch[1].trim() : 'Unknown';
          
          console.log(`  ${index + 1}. ${packageName} - Rp ${packagePrice} - ${packageDesc}`);
          
          // Check if this matches database data
          const dbMatch = dbPackages.find(pkg => 
            pkg.name === packageName || 
            pkg.price.toString() === packagePrice.replace(/\./g, '') ||
            pkg.description === packageDesc
          );
          
          if (dbMatch) {
            console.log(`     ✅ Matches database package: ${dbMatch.name} (ID: ${dbMatch.id})`);
          } else {
            console.log(`     ⚠️  No exact database match found`);
          }
        });
      } else {
        console.log('No voucher packages found in page HTML');
      }
      
      // Check for database-driven indicators
      if (data.includes('pkg-')) {
        console.log('\n✅ CONFIRMED: Page is using database-driven package IDs');
      } else {
        console.log('\n⚠️  Page may be using hardcoded package IDs');
      }
      
      // Check for dynamic content
      const dynamicIndicators = [
        {pattern: /Voucher \d+K - \d+ (hari|jam)/, description: 'Dynamic package descriptions'},
        {pattern: /Rp \d{1,3}(\.\d{3})*/, description: 'Dynamic pricing'},
        {pattern: /pkg-\d+/, description: 'Database package IDs'}
      ];
      
      console.log('\n🔍 Dynamic Content Verification:');
      dynamicIndicators.forEach(indicator => {
        if (indicator.pattern.test(data)) {
          console.log(`  ✅ FOUND: ${indicator.description}`);
        } else {
          console.log(`  ❌ MISSING: ${indicator.description}`);
        }
      });
      
      console.log('\n✅ Detailed voucher page testing completed.');
    });
  });

  req.on('error', (error) => {
    console.error(`❌ ERROR: ${error.message}`);
  });

  req.end();
}