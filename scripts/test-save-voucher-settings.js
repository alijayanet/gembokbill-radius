#!/usr/bin/env node

/**
 * Test script to simulate saving voucher online settings via API
 */

const http = require('http');
const querystring = require('querystring');

// Test data to send
const testData = {
  settings: {
    '3k': {
      name: '3rb - 1 Hari',
      profile: 'default',
      digits: 5,
      enabled: true
    },
    '5k': {
      name: '5rb - 2 Hari',
      profile: 'default',
      digits: 5,
      enabled: true
    }
  }
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/admin/hotspot/save-voucher-online-settings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔍 Testing save voucher online settings API...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('✅ Voucher online settings saved successfully!');
      } else {
        console.log('❌ Failed to save voucher online settings:', response.message);
      }
    } catch (err) {
      console.log('Response body:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
});

req.write(postData);
req.end();