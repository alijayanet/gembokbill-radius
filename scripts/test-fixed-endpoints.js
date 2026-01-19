const axios = require('axios');

console.log('🧪 Testing Fixed Endpoints');
console.log('='.repeat(50));

const BASE_URL = 'http://localhost:3004';

async function testEndpoints() {
    try {
        console.log('🔐 1. Testing Login Endpoint...');

        const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
            username: 'admin',
            password: 'admin'
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400; // Accept redirects
            }
        });

        console.log(`   ✅ Login Status: ${loginResponse.status}`);

        // Extract cookies from response
        const cookies = loginResponse.headers['set-cookie'];
        if (cookies) {
            console.log('   🍪 Cookies received:', cookies.length, 'cookies');
        }

        console.log('\n📡 2. Testing WhatsApp Groups Endpoint...');

        const groupsResponse = await axios.get(`${BASE_URL}/admin/settings/whatsapp-groups`, {
            headers: {
                'Accept': 'application/json',
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            timeout: 5000
        });

        console.log(`   ✅ Groups API Status: ${groupsResponse.status}`);
        console.log(`   📊 Response Type: ${typeof groupsResponse.data}`);

        if (groupsResponse.data && typeof groupsResponse.data === 'object') {
            console.log(`   🎯 Success: ${groupsResponse.data.success}`);
            console.log(`   📝 Message: ${groupsResponse.data.message}`);
            console.log(`   🔗 Status: ${groupsResponse.data.status}`);
            console.log(`   📱 Total Groups: ${groupsResponse.data.total || 0}`);
        } else {
            console.log(`   📋 Raw Response:`, groupsResponse.data);
        }

        console.log('\n✅ All endpoints working correctly!');
        console.log('\n📱 Cara menggunakan:');
        console.log('   1. Akses: http://localhost:3004/admin/settings');
        console.log('   2. Login: admin/admin');
        console.log('   3. Klik "Load Groups" untuk melihat grup WhatsApp');

    } catch (error) {
        console.error('❌ Test Error:', error.message);

        if (error.response) {
            console.log(`   📊 Error Status: ${error.response.status}`);
            console.log(`   📝 Error Data:`, error.response.data);
        } else if (error.code) {
            console.log(`   🔌 Connection Error: ${error.code}`);
        }

        console.log('\n💡 Troubleshooting:');
        console.log('   1. Pastikan aplikasi berjalan: npm start');
        console.log('   2. Scan QR Code WhatsApp jika belum terkoneksi');
        console.log('   3. Restart aplikasi jika masih error');
    }

    console.log('\n🎯 Testing selesai!');
}

// Jalankan test
testEndpoints().catch(console.error);
