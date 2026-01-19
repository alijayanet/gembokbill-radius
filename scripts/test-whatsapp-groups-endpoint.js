const axios = require('axios');

console.log('🧪 Testing WhatsApp Groups API Endpoint');
console.log('='.repeat(50));

// Konfigurasi server
const BASE_URL = process.env.BASE_URL || 'http://localhost:3004';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

console.log(`📍 Testing server: ${BASE_URL}`);
console.log('');

async function testWhatsAppGroupsAPI() {
    try {
        // 1. Login untuk mendapatkan session
        console.log('🔐 1. Login ke admin panel...');

        try {
            const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
                username: ADMIN_USERNAME,
                password: ADMIN_PASSWORD
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // Accept 302 redirect
                }
            });

            console.log('   ✅ Login response:', loginResponse.status);

            // Get cookies for session
            const cookies = loginResponse.headers['set-cookie'];
            const cookieHeader = cookies ? cookies.join('; ') : '';

            // 2. Test WhatsApp Groups endpoint
            console.log('\n📡 2. Testing GET /admin/settings/whatsapp-groups');

            const response = await axios.get(`${BASE_URL}/admin/settings/whatsapp-groups`, {
                headers: {
                    'Cookie': cookieHeader,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            console.log('   ✅ HTTP Status:', response.status);
            console.log('   📊 Content-Type:', response.headers['content-type']);

            const data = response.data;
            console.log('   📋 Response Type:', typeof data);
            console.log('   🎯 Success:', data.success);
            console.log('   📝 Message:', data.message);
            console.log('   🔗 Status:', data.status);
            console.log('   📱 Total Groups:', data.total || 0);

            if (data.success && data.groups) {
                console.log('\n   📋 Daftar Grup:');
                data.groups.slice(0, 3).forEach((group, index) => {
                    console.log(`      ${index + 1}. ${group.name} (${group.participants} anggota)`);
                    console.log(`         ID: ${group.id}`);
                    console.log(`         Admin: ${group.isAdmin ? 'Ya' : 'Tidak'}`);
                    console.log('');
                });

                if (data.groups.length > 3) {
                    console.log(`      ... dan ${data.groups.length - 3} grup lainnya`);
                }
            }

            // 3. Test Refresh endpoint
            console.log('\n🔄 3. Testing POST /admin/settings/whatsapp-groups/refresh');

            try {
                const refreshResponse = await axios.post(`${BASE_URL}/admin/settings/whatsapp-groups/refresh`, {}, {
                    headers: {
                        'Cookie': cookieHeader,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });

                console.log('   ✅ Refresh Status:', refreshResponse.status);
                console.log('   📝 Refresh Message:', refreshResponse.data.message);

            } catch (refreshError) {
                console.log('   ⚠️  Refresh Error:', refreshError.response?.status || refreshError.code);
                console.log('   📝 Error Message:', refreshError.response?.data?.message || refreshError.message);
            }

        } catch (loginError) {
            console.log('   ❌ Login Error:', loginError.response?.status || loginError.code);
            console.log('   💡 Kemungkinan:', 'Server belum berjalan atau credentials salah');

            // Coba test endpoint tanpa login (mungkin ada bypass)
            console.log('\n🔄 3. Testing endpoint tanpa authentication...');

            try {
                const directResponse = await axios.get(`${BASE_URL}/admin/settings/whatsapp-groups`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000,
                    validateStatus: function (status) {
                        return status < 500; // Accept all except server errors
                    }
                });

                console.log('   ✅ Direct Access Status:', directResponse.status);
                console.log('   📊 Response Type:', typeof directResponse.data);
                console.log('   📝 Response:', JSON.stringify(directResponse.data).substring(0, 200) + '...');

            } catch (directError) {
                console.log('   ❌ Direct Access Error:', directError.code);
                console.log('   📝 Error Details:', directError.message);
            }
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Pastikan aplikasi berjalan: npm start');
        console.log('   2. Akses browser: http://localhost:3004');
        console.log('   3. Scan QR Code WhatsApp terlebih dahulu');
        console.log('   4. Coba lagi setelah WhatsApp connected');
    }

    console.log('\n🎯 Testing selesai!');
    console.log('\n📱 Cara menggunakan:');
    console.log('   1. Start aplikasi: npm start');
    console.log('   2. Scan QR WhatsApp di admin settings');
    console.log('   3. Akses: http://localhost:3004/admin/settings');
    console.log('   4. Klik "Load Groups" untuk melihat daftar grup');
}

// Jalankan testing
testWhatsAppGroupsAPI().catch(console.error);
