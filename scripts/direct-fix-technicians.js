const sqlite3 = require('sqlite3').verbose();
const { getSetting } = require('../config/settingsManager');
const path = require('path');

console.log('🔧 Perbaikan Langsung Data Teknisi...');

// Data teknisi dari settings.json
const techniciansFromSettings = [
    { phone: '6283807665111', name: 'Teknisi 1' },
    { phone: '6282218094111', name: 'Teknisi 2' }
];

console.log('📋 Target teknisi dari settings:');
techniciansFromSettings.forEach((tech, index) => {
    console.log(`   ${index + 1}. ${tech.name}: ${tech.phone}`);
});

// Path database
const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🔄 Mulai perbaikan...');

// Langkah 1: Nonaktifkan semua teknisi
db.run('UPDATE technicians SET is_active = 0', (err) => {
    if (err) {
        console.error('❌ Error deactivating all technicians:', err);
        db.close();
        return;
    }

    console.log('✅ Semua teknisi dinonaktifkan');

    // Langkah 2: Aktifkan teknisi yang sesuai dengan settings
    let processedCount = 0;

    techniciansFromSettings.forEach((targetTech, index) => {
        // Cari teknisi dengan nomor yang sama atau mirip
        const searchPatterns = [
            targetTech.phone,
            targetTech.phone.replace(/^62/, ''),
            targetTech.phone.replace(/^628/, '08')
        ];

        let found = false;

        searchPatterns.forEach(pattern => {
            if (found) return;

            db.get('SELECT id, name, phone FROM technicians WHERE phone LIKE ?', [`%${pattern}%`], (err, row) => {
                if (err) {
                    console.error(`❌ Error searching for ${pattern}:`, err);
                    return;
                }

                if (row) {
                    found = true;
                    // Update teknisi yang ditemukan
                    db.run(
                        'UPDATE technicians SET name = ?, phone = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [targetTech.name, targetTech.phone, row.id],
                        (err) => {
                            if (err) {
                                console.error(`❌ Error updating technician ${targetTech.phone}:`, err);
                            } else {
                                console.log(`✅ Updated existing technician: ${targetTech.name} (${targetTech.phone}) - dari ${row.phone}`);
                            }
                            checkComplete();
                        }
                    );
                } else {
                    // Jika tidak ada yang cocok di iterasi terakhir, buat baru
                    if (pattern === searchPatterns[searchPatterns.length - 1] && !found) {
                        db.run(
                            'INSERT INTO technicians (name, phone, role, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                            [targetTech.name, targetTech.phone, 'technician'],
                            function(err) {
                                if (err) {
                                    console.error(`❌ Error inserting technician ${targetTech.phone}:`, err);
                                } else {
                                    console.log(`✅ Added new technician: ${targetTech.name} (${targetTech.phone}) - ID: ${this.lastID}`);
                                }
                                checkComplete();
                            }
                        );
                    }
                }
            });
        });
    });

    function checkComplete() {
        processedCount++;
        if (processedCount >= techniciansFromSettings.length) {
            // Tampilkan hasil akhir
            db.all('SELECT * FROM technicians WHERE is_active = 1 ORDER BY name', (err, rows) => {
                if (err) {
                    console.error('❌ Error getting final results:', err);
                } else {
                    console.log('\n📊 Hasil Perbaikan:');
                    console.log(`   Total teknisi aktif: ${rows.length}`);
                    rows.forEach(row => {
                        console.log(`   - ${row.name}: ${row.phone} (${row.role}) - Status: ${row.is_active ? 'Aktif' : 'Tidak Aktif'}`);
                    });
                }

                db.close();
                console.log('\n🎉 Perbaikan selesai!');
                console.log('💡 Teknisi aktif sekarang akan menerima notifikasi WhatsApp untuk laporan gangguan');
            });
        }
    }
});
