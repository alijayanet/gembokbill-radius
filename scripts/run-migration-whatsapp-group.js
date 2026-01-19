const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔧 Menjalankan migrasi WhatsApp Group untuk technicians...');

// Path database dan migration
const dbPath = path.join(__dirname, '../data/billing.db');
const migrationPath = path.join(__dirname, '../migrations/add_whatsapp_group_to_technicians.sql');

if (!fs.existsSync(migrationPath)) {
    console.error('❌ File migrasi tidak ditemukan:', migrationPath);
    process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('📋 Mengeksekusi migrasi...');

    // Split SQL commands dan execute satu per satu
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);

    let completedCommands = 0;

    commands.forEach((command, index) => {
        db.run(command.trim() + ';', (err) => {
            if (err) {
                console.error(`❌ Error executing command ${index + 1}:`, err.message);
                // Lanjutkan ke command berikutnya meskipun ada error
            } else {
                console.log(`✅ Command ${index + 1} executed successfully`);
            }
            completedCommands++;

            if (completedCommands >= commands.length) {
                // Verifikasi migrasi berhasil
                db.all("PRAGMA table_info(technicians)", (err, rows) => {
                    if (err) {
                        console.error('❌ Error checking table structure:', err);
                    } else {
                        const whatsappGroupColumn = rows.find(row => row.name === 'whatsapp_group_id');
                        if (whatsappGroupColumn) {
                            console.log('✅ Kolom whatsapp_group_id berhasil ditambahkan');
                            console.log(`   - Nama kolom: ${whatsappGroupColumn.name}`);
                            console.log(`   - Tipe data: ${whatsappGroupColumn.type}`);
                        } else {
                            console.log('❌ Kolom whatsapp_group_id tidak ditemukan');
                        }
                    }

                    // Set default group dari settings untuk teknisi yang belum punya group
                    console.log('\n🔄 Setting default WhatsApp group untuk teknisi aktif...');

                    const { getSetting } = require('../config/settingsManager');
                    const defaultGroupId = getSetting('technician_group_id', '');

                    if (defaultGroupId) {
                        db.run(
                            'UPDATE technicians SET whatsapp_group_id = ? WHERE whatsapp_group_id IS NULL OR whatsapp_group_id = ""',
                            [defaultGroupId],
                            function(err) {
                                if (err) {
                                    console.error('❌ Error setting default group:', err);
                                } else {
                                    console.log(`✅ Default group diset untuk ${this.changes} teknisi`);
                                }

                                // Tampilkan hasil akhir
                                showFinalResult();
                            }
                        );
                    } else {
                        console.log('⚠️ Tidak ada default group di settings.json');
                        showFinalResult();
                    }
                });
            }
        });
    });

    function showFinalResult() {
        // Tampilkan data teknisi dengan group WhatsApp
        db.all('SELECT id, name, phone, whatsapp_group_id FROM technicians WHERE is_active = 1 ORDER BY name', (err, rows) => {
            if (err) {
                console.error('❌ Error getting final results:', err);
            } else {
                console.log('\n📊 Hasil Migrasi - Teknisi Aktif dengan WhatsApp Group:');
                console.log('='.repeat(70));
                rows.forEach(row => {
                    const groupInfo = row.whatsapp_group_id ? row.whatsapp_group_id : 'Tidak ada';
                    console.log(`   ID: ${row.id} | ${row.name} | ${row.phone} | Group: ${groupInfo}`);
                });
            }

            db.close();

            console.log('\n🎉 Migrasi selesai!');
            console.log('💡 Sekarang Anda bisa mengelola WhatsApp Group untuk setiap teknisi melalui:');
            console.log('   http://localhost:3004/admin/technicians');
        });
    }
});
