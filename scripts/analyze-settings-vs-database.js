const { getSetting } = require('../config/settingsManager');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 ANALISIS SETTINGS.JSON vs DATABASE TEKNISI');
console.log('='.repeat(60));

// 1. Ambil data teknisi dari settings.json
console.log('\n📋 1. DATA TEKNISI DARI SETTINGS.JSON:');
const technicianNumbers = [];
let i = 0;
while (true) {
    const number = getSetting(`technician_numbers.${i}`, '');
    if (!number) break;
    technicianNumbers.push(number);
    i++;
}

if (technicianNumbers.length > 0) {
    technicianNumbers.forEach((number, index) => {
        console.log(`   ${index + 1}. technician_numbers.${index}: ${number}`);
    });
} else {
    console.log('   ❌ Tidak ada technician_numbers di settings.json');
}

// 2. Ambil data teknisi dari database
console.log('\n📊 2. DATA TEKNISI DARI DATABASE:');
const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Ambil semua teknisi
    db.all('SELECT id, name, phone, role, is_active FROM technicians ORDER BY id', (err, allRows) => {
        if (err) {
            console.error('❌ Error getting all technicians:', err);
            return;
        }

        console.log(`   Total teknisi di database: ${allRows.length}`);
        allRows.forEach(row => {
            const status = row.is_active ? 'Aktif' : 'Tidak Aktif';
            console.log(`   - ID: ${row.id} | ${row.name} | ${row.phone} | ${row.role} | ${status}`);
        });

        // Ambil teknisi aktif saja
        db.all('SELECT id, name, phone, role FROM technicians WHERE is_active = 1 ORDER BY name', (err, activeRows) => {
            if (err) {
                console.error('❌ Error getting active technicians:', err);
                db.close();
                return;
            }

            console.log(`\n✅ 3. TEKNISI AKTIF (yang akan menerima notifikasi): ${activeRows.length}`);
            if (activeRows.length > 0) {
                activeRows.forEach(row => {
                    console.log(`   ✅ ${row.name}: ${row.phone} (${row.role})`);
                });
            } else {
                console.log('   ❌ Tidak ada teknisi aktif');
            }

            // 4. Analisis perbandingan
            console.log('\n🔄 4. ANALISIS PERBANDINGAN:');

            const settingsPhones = technicianNumbers;
            const databasePhones = activeRows.map(row => row.phone);

            console.log(`   Settings.json technician_numbers: ${settingsPhones.length} nomor`);
            console.log(`   Database teknisi aktif: ${databasePhones.length} nomor`);

            // Cari yang ada di settings tapi tidak di database aktif
            const inSettingsNotInDb = settingsPhones.filter(phone => !databasePhones.includes(phone));
            if (inSettingsNotInDb.length > 0) {
                console.log(`\n⚠️  NOMOR DI SETTINGS TAPI TIDAK AKTIF DI DATABASE:`);
                inSettingsNotInDb.forEach(phone => {
                    console.log(`   - ${phone} (tidak aktif di database)`);
                });
            }

            // Cari yang aktif di database tapi tidak di settings
            const inDbNotInSettings = databasePhones.filter(phone => !settingsPhones.includes(phone));
            if (inDbNotInSettings.length > 0) {
                console.log(`\n⚠️  NOMOR AKTIF DI DATABASE TAPI TIDAK DI SETTINGS:`);
                inDbNotInSettings.forEach(phone => {
                    const tech = activeRows.find(row => row.phone === phone);
                    console.log(`   - ${phone} (${tech.name}) - TIDAK ada di settings!`);
                });
            }

            // 5. Kesimpulan
            console.log('\n🎯 5. KESIMPULAN:');
            if (inSettingsNotInDb.length === 0 && inDbNotInSettings.length === 0) {
                console.log('   ✅ SETTINGS.JSON & DATABASE SUDAH SELARAS!');
                console.log('   ✅ Semua nomor teknisi sudah sinkron');
            } else {
                console.log('   ⚠️  ADA KETIDAKSELARASAN antara settings.json dan database');
                if (inSettingsNotInDb.length > 0) {
                    console.log(`   - ${inSettingsNotInDb.length} nomor di settings belum aktif di database`);
                }
                if (inDbNotInSettings.length > 0) {
                    console.log(`   - ${inDbNotInSettings.length} nomor aktif di database tapi tidak di settings`);
                }
            }

            console.log('\n💡 6. CARA KERJA SISTEM:');
            console.log('   1. Settings.json = Konfigurasi awal/backup');
            console.log('   2. Database = Data teknisi yang AKTIF digunakan');
            console.log('   3. Notifikasi WhatsApp menggunakan data dari DATABASE');
            console.log('   4. Admin panel mengelola teknisi di DATABASE');

            db.close();
        });
    });
});
