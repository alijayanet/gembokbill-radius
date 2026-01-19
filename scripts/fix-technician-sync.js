const sqlite3 = require('sqlite3').verbose();
const { getSetting } = require('../config/settingsManager');
const path = require('path');

console.log('🔧 Sinkronisasi Data Teknisi dengan Settings...');

// Data teknisi dari settings.json
const technicianNumbers = [];
let i = 0;
while (true) {
    const number = getSetting(`technician_numbers.${i}`, '');
    if (!number) break;
    technicianNumbers.push({
        phone: number,
        name: `Teknisi ${i + 1}`,
        role: 'technician', // Role sudah benar sesuai struktur tabel
        is_active: 1
    });
    i++;
}

console.log('📋 Data teknisi dari settings.json:');
technicianNumbers.forEach((tech, index) => {
    console.log(`   ${index + 1}. ${tech.name}: ${tech.phone}`);
});

// Path database
const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

async function syncTechnicians() {
    return new Promise((resolve, reject) => {
        console.log('\n🔄 Memulai sinkronisasi...');

        // Langkah 1: Nonaktifkan semua teknisi yang ada
        db.run('UPDATE technicians SET is_active = 0 WHERE is_active = 1', (err) => {
            if (err) {
                console.error('❌ Error deactivating technicians:', err);
                reject(err);
                return;
            }

            console.log('✅ Semua teknisi lama dinonaktifkan');

            // Langkah 2: Sinkronisasi teknisi satu per satu
            let currentIndex = 0;

            function processNext() {
                if (currentIndex >= technicianNumbers.length) {
                    // Selesai, tampilkan hasil
                    showResults();
                    return;
                }

                const tech = technicianNumbers[currentIndex];
                currentIndex++;

                // Cek apakah nomor sudah ada
                db.get('SELECT id FROM technicians WHERE phone = ?', [tech.phone], (err, row) => {
                    if (err) {
                        console.error(`❌ Error checking technician ${tech.phone}:`, err);
                        processNext(); // Lanjutkan ke yang berikutnya
                        return;
                    }

                    if (row) {
                        // Update yang sudah ada
                        db.run(
                            'UPDATE technicians SET name = ?, role = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ?',
                            [tech.name, tech.role, tech.phone],
                            (err) => {
                                if (err) {
                                    console.error(`❌ Error updating technician ${tech.phone}:`, err);
                                } else {
                                    console.log(`✅ Updated technician: ${tech.name} (${tech.phone})`);
                                }
                                processNext();
                            }
                        );
                    } else {
                        // Tambah yang baru
                        db.run(
                            'INSERT INTO technicians (name, phone, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                            [tech.name, tech.role, tech.phone, tech.is_active],
                            function(err) {
                                if (err) {
                                    console.error(`❌ Error inserting technician ${tech.phone}:`, err);
                                } else {
                                    console.log(`✅ Added new technician: ${tech.name} (${tech.phone}) - ID: ${this.lastID}`);
                                }
                                processNext();
                            }
                        );
                    }
                });
            }

            function showResults() {
                // Tampilkan hasil akhir
                db.all('SELECT * FROM technicians WHERE is_active = 1 ORDER BY name', (err, rows) => {
                    if (err) {
                        console.error('❌ Error getting final results:', err);
                        reject(err);
                        return;
                    }

                    console.log('\n📊 Hasil Sinkronisasi:');
                    console.log(`   Total teknisi aktif: ${rows.length}`);
                    rows.forEach(row => {
                        console.log(`   - ${row.name}: ${row.phone} (${row.role})`);
                    });

                    db.close();
                    resolve();
                });
            }

            // Mulai proses
            processNext();
        });
    });
}

// Jalankan sinkronisasi
syncTechnicians()
    .then(() => {
        console.log('\n🎉 Sinkronisasi selesai!');
        console.log('💡 Notifikasi WhatsApp untuk laporan gangguan akan menggunakan data teknisi yang telah disinkronisasi');
    })
    .catch(err => {
        console.error('❌ Sinkronisasi gagal:', err);
        db.close();
    });
