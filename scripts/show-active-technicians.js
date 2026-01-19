const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

console.log('📊 TEKNISI AKTIF SAAT INI (Database):');
console.log('='.repeat(60));

db.all('SELECT id, name, phone, role, is_active FROM technicians WHERE is_active = 1 ORDER BY name', (err, rows) => {
    if (err) {
        console.error('❌ Error:', err);
    } else {
        if (rows.length === 0) {
            console.log('   Tidak ada teknisi aktif saat ini');
        } else {
            rows.forEach(row => {
                console.log(`   ID: ${row.id} | ${row.name} | ${row.phone} | ${row.role} | Status: ${row.is_active ? 'Aktif' : 'Tidak Aktif'}`);
            });
        }

        console.log('\n💡 Teknisi aktif ini akan menerima notifikasi WhatsApp untuk:');
        console.log('   - Laporan gangguan baru');
        console.log('   - Update status laporan');
        console.log('   - Notifikasi instalasi baru');
        console.log('   - Update status instalasi');
    }
    db.close();
});
