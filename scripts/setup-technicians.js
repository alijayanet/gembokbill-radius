const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up technicians database...');

// Path database
const dbPath = path.join(__dirname, '../data/billing.db');

// Baca migration file
const migrationPath = path.join(__dirname, '../migrations/create_technicians_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('📋 Executing technicians table migration...');

    // Split SQL commands dan execute satu per satu
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);

    commands.forEach((command, index) => {
        db.run(command.trim() + ';', (err) => {
            if (err) {
                console.error(`❌ Error executing command ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Command ${index + 1} executed successfully`);
            }
        });
    });

    // Verifikasi tabel technicians sudah dibuat
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='technicians';", (err, rows) => {
        if (err) {
            console.error('❌ Error checking tables:', err.message);
        } else if (rows.length > 0) {
            console.log('✅ Technicians table created successfully');

            // Cek data teknisi yang ada
            db.all("SELECT * FROM technicians WHERE is_active = 1;", (err, technicians) => {
                if (err) {
                    console.error('❌ Error querying technicians:', err.message);
                } else {
                    console.log(`📊 Found ${technicians.length} active technicians:`);
                    technicians.forEach(tech => {
                        console.log(`   - ${tech.name} (${tech.phone}) - ${tech.role}`);
                    });
                }
                db.close();
            });
        } else {
            console.log('❌ Technicians table not found');
            db.close();
        }
    });
});

console.log('🎉 Technicians setup completed!');
console.log('💡 Next steps:');
console.log('   1. Restart aplikasi untuk memuat konfigurasi baru');
console.log('   2. Test notifikasi dengan membuat laporan gangguan baru');
console.log('   3. Pastikan nomor teknisi sudah terdaftar di WhatsApp');
