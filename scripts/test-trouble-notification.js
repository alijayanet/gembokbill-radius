const { createTroubleReport } = require('../config/troubleReport');

console.log('🧪 Testing Trouble Report Notification System...');
console.log('==================================================');

// Test data untuk laporan gangguan
const testReports = [
    {
        phone: '081321960111',
        name: 'Testing Customer',
        location: 'Jl. Test No. 123, Kota Test',
        category: 'Internet Lambat',
        description: 'TEST NOTIFICATION: Internet sangat lambat sejak pagi ini. Sudah restart modem tapi belum ada perbaikan.'
    },
    {
        phone: '081234567890',
        name: 'Admin Test Customer',
        location: 'Admin Test Location',
        category: 'Tidak Bisa Browsing',
        description: 'TEST NOTIFICATION: Tidak bisa mengakses website apapun. Connection timeout terus.'
    }
];

console.log('📋 Test akan membuat 2 laporan gangguan dummy');
console.log('📱 Notifikasi akan dikirim ke:');
console.log('   - Grup teknisi (jika ada)');
console.log('   - Nomor teknisi individual');
console.log('   - Admin (backup)');
console.log('');

async function runTests() {
    for (let i = 0; i < testReports.length; i++) {
        const reportData = testReports[i];

        console.log(`\n🔧 Membuat laporan ${i + 1}/${testReports.length}...`);
        console.log(`   📱 Customer: ${reportData.name} (${reportData.phone})`);
        console.log(`   🔧 Masalah: ${reportData.category}`);
        console.log(`   📝 Deskripsi: ${reportData.description.substring(0, 50)}...`);

        try {
            const report = createTroubleReport(reportData);

            if (report) {
                console.log(`   ✅ Laporan berhasil dibuat dengan ID: ${report.id}`);
                console.log(`   📅 Waktu: ${new Date(report.createdAt).toLocaleString('id-ID')}`);
            } else {
                console.log(`   ❌ Gagal membuat laporan`);
            }
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }

        // Delay 2 detik antara test
        if (i < testReports.length - 1) {
            console.log('⏳ Menunggu 2 detik sebelum test berikutnya...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n🎉 Test selesai!');
    console.log('💡 Cek WhatsApp untuk melihat apakah notifikasi diterima');
    console.log('📊 Cek logs/info.log untuk status pengiriman notifikasi');
    console.log('🔍 Cek logs/trouble_reports.json untuk data laporan');
}

// Jalankan test
runTests().catch(console.error);
