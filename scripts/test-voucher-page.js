const http = require('http');

// Make a request to the voucher page
const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/voucher',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    // Check if the response contains database-driven content
    const responseStr = chunk.toString();
    
    // Look for indicators that show database data is being used
    if (responseStr.includes('Voucher 3K') || responseStr.includes('Voucher 5K') || responseStr.includes('Voucher 10K')) {
      console.log('✅ SUCCESS: Voucher page is displaying data from the database');
      console.log('   - Found database-driven content in the response');
    } else {
      console.log('❌ ISSUE: Voucher page may not be displaying database data');
    }
    
    // Show a snippet of the response
    console.log('\nResponse snippet (first 500 characters):');
    console.log(responseStr.substring(0, 500) + '...');
  });
});

req.on('error', (error) => {
  console.error(`❌ ERROR: ${error.message}`);
  console.log('Make sure the server is running on port 3005');
});

req.end();