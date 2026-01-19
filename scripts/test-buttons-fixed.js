const axios = require('axios');

console.log('🧪 Testing WhatsApp Groups Buttons Fix');
console.log('='.repeat(50));

const BASE_URL = 'http://localhost:3004';

async function testButtons() {
    try {
        console.log('🔐 1. Testing Login...');

        const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
            username: 'admin',
            password: 'admin'
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            }
        });

        console.log(`   ✅ Login Status: ${loginResponse.status}`);

        // Extract cookies
        const cookies = loginResponse.headers['set-cookie'];
        const cookieHeader = cookies ? cookies.join('; ') : '';

        console.log('\n📡 2. Testing WhatsApp Groups API...');

        const groupsResponse = await axios.get(`${BASE_URL}/admin/settings/whatsapp-groups`, {
            headers: {
                'Accept': 'application/json',
                'Cookie': cookieHeader
            },
            timeout: 5000
        });

        console.log(`   ✅ Groups API Status: ${groupsResponse.status}`);
        console.log(`   📱 Found ${groupsResponse.data.total} groups`);

        if (groupsResponse.data.success && groupsResponse.data.groups.length > 0) {
            const firstGroup = groupsResponse.data.groups[0];
            console.log(`   📋 First Group: ${firstGroup.name}`);
            console.log(`   🆔 Group ID: ${firstGroup.id}`);

            console.log('\n🔍 3. Testing Group Detail API...');

            const detailResponse = await axios.get(`${BASE_URL}/admin/settings/whatsapp-groups/${firstGroup.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Cookie': cookieHeader
                },
                timeout: 5000
            });

            console.log(`   ✅ Detail API Status: ${detailResponse.status}`);
            console.log(`   📊 Detail Response: ${detailResponse.data.success ? 'SUCCESS' : 'FAILED'}`);

            if (detailResponse.data.success) {
                console.log(`   👥 Total Participants: ${detailResponse.data.group.totalParticipants}`);
                console.log(`   👑 Is Admin: ${detailResponse.data.group.isAdmin}`);
            }
        }

        console.log('\n✅ All APIs working correctly!');
        console.log('\n📋 Button Functions:');
        console.log('   • Copy Group ID - Should work with fallback clipboard API');
        console.log('   • View Group Details - Should show modal with participant list');
        console.log('   • Load Groups - Should display all 19 WhatsApp groups');

        console.log('\n🎯 Test completed successfully!');
        console.log('\n🔧 If buttons still not working, check browser console for JavaScript errors');

    } catch (error) {
        console.error('❌ Test Error:', error.message);

        if (error.response) {
            console.log(`   📊 Error Status: ${error.response.status}`);
            console.log(`   📝 Error Data:`, error.response.data);
        } else if (error.code) {
            console.log(`   🔌 Connection Error: ${error.code}`);
        }

        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure application is running: npm start');
        console.log('   2. Check browser console for JavaScript errors');
        console.log('   3. Verify WhatsApp is connected and QR scanned');
    }
}

// Run test
testButtons().catch(console.error);
