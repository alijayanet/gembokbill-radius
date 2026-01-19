const http = require('http');

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
        name: 'Voucher 3K with 1 hari duration', 
        pattern: /Voucher 3K.*1 hari/s,
        found: false
      },
      { 
        name: 'Voucher 5K with 2 hari duration', 
        pattern: /Voucher 5K.*2 hari/s,
        found: false
      },
      { 
        name: 'Voucher 10K with 5 hari duration', 
        pattern: /Voucher 10K.*5 hari/s,
        found: false
      },
      { 
        name: 'Correct pricing (3K = 3000)', 
        pattern: /3K.*Rp\s*3\.?000/s,
        found: false
      },
      { 
        name: 'Correct pricing (5K = 5000)', 
        pattern: /5K.*Rp\s*5\.?000/s,
        found: false
      },
      { 
        name: 'Correct pricing (10K = 10000)', 
        pattern: /10K.*Rp\s*10\.?000/s,
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
    console.log('\n🔍 Database Content Verification:');
    let allFound = true;
    checks.forEach(check => {
      const status = check.found ? '✅ FOUND' : '❌ MISSING';
      console.log(`  ${status}: ${check.name}`);
      if (!check.found) allFound = false;
    });
    
    if (allFound) {
      console.log('\n🎉 SUCCESS: All database-driven content is correctly displayed!');
    } else {
      console.log('\n⚠️  WARNING: Some database-driven content is missing or incorrect.');
      console.log('   The page may be falling back to hardcoded values.');
    }
    
    // Additional check for database-specific fields
    if (data.includes('pkg-')) {
      console.log('\n✅ CONFIRMED: Database-driven package IDs detected (pkg- prefix)');
    } else {
      console.log('\n⚠️  NOTE: No database-driven package IDs detected (pkg- prefix)');
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ ERROR: ${error.message}`);
  console.log('Make sure the server is running on port 3005');
});

req.end();