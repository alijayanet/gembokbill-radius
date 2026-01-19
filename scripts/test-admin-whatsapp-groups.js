const axios = require('axios');

console.log('🧪 Testing Admin WhatsApp Groups Management');
console.log('='.repeat(60));
console.log('Script ini akan menguji API WhatsApp Groups di admin settings');
console.log('');

const BASE_URL = 'http://localhost:3004'; // Sesuaikan dengan port aplikasi

async function testWhatsAppGroupsAPI() {
    try {
        console.log('📡 1. Testing GET /admin/settings/whatsapp-groups');

        try {
            const response = await axios.get(`${BASE_URL}/admin/settings/whatsapp-groups`);
            const data = response.data;

            console.log('   ✅ API Response:', data.success ? 'SUCCESS' : 'FAILED');
            console.log('   📊 Status:', data.status);
            console.log('   📱 Total Groups:', data.total || 0);

            if (data.success && data.groups) {
                console.log('\n   📋 Daftar Grup:');
                data.groups.forEach((group, index) => {
                    console.log(`      ${index + 1}. ${group.name} (${group.participants} anggota)`);
                    console.log(`         ID: ${group.id}`);
                    console.log(`         Admin: ${group.isAdmin ? 'Ya' : 'Tidak'}`);
                    console.log('');
                });

                // Test detail grup jika ada grup
                if (data.groups.length > 0) {
                    const firstGroup = data.groups[0];
                    console.log('\n📡 2. Testing GET /admin/settings/whatsapp-groups/:groupId');
                    console.log(`   Mengambil detail grup: ${firstGroup.name}`);

                    try {
                        const detailResponse = await axios.get(`${BASE_URL}/admin/settings/whatsapp-groups/${firstGroup.id}`);
                        const detailData = detailResponse.data;

                        console.log('   ✅ Detail API Response:', detailData.success ? 'SUCCESS' : 'FAILED');

                        if (detailData.success) {
                            const group = detailData.group;
                            console.log(`   📱 Nama: ${group.name}`);
                            console.log(`   👥 Total Anggota: ${group.totalParticipants}`);
                            console.log(`   👑 Owner: ${group.owner}`);
                            console.log(`   📅 Dibuat: ${group.created}`);
                            console.log(`   🛡️ Admin: ${group.isAdmin ? 'Ya' : 'Tidak'}`);
                        }
                    } catch (detailError) {
                        console.log('   ❌ Detail API Error:', detailError.response?.data?.message || detailError.message);
                    }
                }
            } else {
                console.log(`   ⚠️  Message: ${data.message}`);
            }

        } catch (error) {
            console.log('   ❌ API Error:', error.response?.data?.message || error.message);
            console.log('   💡 Kemungkinan: WhatsApp belum terkoneksi atau belum scan QR code');
        }

        console.log('\n📡 3. Testing POST /admin/settings/whatsapp-groups/refresh');

        try {
            const refreshResponse = await axios.post(`${BASE_URL}/admin/settings/whatsapp-groups/refresh`);
            const refreshData = refreshResponse.data;

            console.log('   ✅ Refresh API Response:', refreshData.success ? 'SUCCESS' : 'FAILED');
            console.log(`   📝 Message: ${refreshData.message}`);

        } catch (refreshError) {
            console.log('   ❌ Refresh API Error:', refreshError.response?.data?.message || refreshError.message);
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }

    console.log('\n🎯 PANDUAN PENGGUNAAN:');
    console.log('='.repeat(40));
    console.log('1. Pastikan aplikasi sudah berjalan (npm start)');
    console.log('2. Akses http://localhost:3004/admin/settings');
    console.log('3. Login dengan akun admin');
    console.log('4. Cari bagian "WhatsApp Groups Management"');
    console.log('5. Klik "Load Groups" untuk melihat daftar grup');
    console.log('6. Klik ikon mata untuk melihat detail grup');
    console.log('7. Klik ikon clipboard untuk copy Group ID');
    console.log('');
    console.log('📝 CARA MENDAPATKAN GROUP ID:');
    console.log('   1. Manual: Copy dari link undangan WhatsApp');
    console.log('   2. Otomatis: Gunakan script scripts/get-whatsapp-group-id.js');
    console.log('   3. Via Admin: Gunakan fitur di halaman settings');
    console.log('');
    console.log('🎉 Testing selesai!');
}

// Jalankan testing
testWhatsAppGroupsAPI().catch(console.error);
