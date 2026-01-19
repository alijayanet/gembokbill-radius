/**
 * Test HTTP Request to Installations Route
 * Test the actual HTTP endpoint
 */

const http = require('http');

console.log('🌐 Testing HTTP request to /technician/installations...');

// First, let's check if the server is running
const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/technician/installations',
    method: 'GET',
    headers: {
        'User-Agent': 'Test-Script/1.0'
    }
};

const req = http.request(options, (res) => {
    console.log(`📡 Response status: ${res.statusCode}`);
    console.log(`📡 Response headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Request successful!');
            console.log('📄 Response preview:', data.substring(0, 500) + '...');
        } else {
            console.log('❌ Request failed with status:', res.statusCode);
            console.log('📄 Error response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
        console.log('💡 Server might not be running. Try starting with: npm start');
    }
});

req.setTimeout(10000, () => {
    console.log('⏰ Request timeout');
    req.destroy();
});

req.end();
