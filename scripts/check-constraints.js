const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

console.log('🔍 Memeriksa constraints tabel technicians...');

db.serialize(() => {
    // Cek foreign key constraints
    db.all("PRAGMA foreign_key_list(technicians)", (err, fkRows) => {
        if (err) {
            console.error('❌ Error checking foreign keys:', err);
        } else {
            console.log('🔗 Foreign Key Constraints:');
            if (fkRows.length === 0) {
                console.log('   - Tidak ada foreign key constraints');
            } else {
                fkRows.forEach(row => {
                    console.log(`   - ${row.from} -> ${row.table}.${row.to}`);
                });
            }
        }

        // Cek table info lengkap
        db.all("PRAGMA table_info(technicians)", (err, infoRows) => {
            if (err) {
                console.error('❌ Error getting table info:', err);
            } else {
                console.log('\n📋 Table Info Lengkap:');
                infoRows.forEach(row => {
                    console.log(`   - ${row.name}: ${row.type} ${row.pk ? '(PRIMARY KEY)' : ''} ${row.notnull ? '(NOT NULL)' : ''} ${row.dflt_value ? '(default: ' + row.dflt_value + ')' : ''}`);
                });
            }

            // Cek index
            db.all("PRAGMA index_list(technicians)", (err, indexRows) => {
                if (err) {
                    console.error('❌ Error getting indexes:', err);
                } else {
                    console.log('\n🔍 Indexes:');
                    if (indexRows.length === 0) {
                        console.log('   - Tidak ada index');
                    } else {
                        indexRows.forEach(row => {
                            console.log(`   - ${row.name} (${row.unique ? 'UNIQUE' : 'INDEX'})`);
                        });
                    }
                }

                // Coba insert data dengan role yang berbeda untuk melihat constraint
                console.log('\n🧪 Testing role constraints...');

                const testRoles = ['technician', 'collector', 'field_officer', 'admin', 'user'];

                let testCount = 0;
                testRoles.forEach(role => {
                    db.run(
                        'INSERT INTO technicians (name, phone, role, is_active) VALUES (?, ?, ?, 0)',
                        [`Test ${role}`, `0812345678${testCount}`, role, 0],
                        function(err) {
                            testCount++;
                            if (err) {
                                console.log(`   ❌ Role '${role}': ${err.message}`);
                            } else {
                                console.log(`   ✅ Role '${role}': OK (ID: ${this.lastID})`);
                                // Hapus data test
                                db.run('DELETE FROM technicians WHERE id = ?', [this.lastID]);
                            }

                            if (testCount >= testRoles.length) {
                                // Tampilkan data teknisi yang ada
                                db.all("SELECT * FROM technicians WHERE is_active = 1", (err, activeRows) => {
                                    console.log('\n📊 Teknisi Aktif Saat Ini:');
                                    if (activeRows.length === 0) {
                                        console.log('   - Tidak ada teknisi aktif');
                                    } else {
                                        activeRows.forEach(row => {
                                            console.log(`   - ID: ${row.id} | ${row.name}: ${row.phone} (${row.role})`);
                                        });
                                    }

                                    db.close();
                                });
                            }
                        }
                    );
                });
            });
        });
    });
});
