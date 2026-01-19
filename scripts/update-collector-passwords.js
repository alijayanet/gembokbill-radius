/**
 * Script untuk memperbarui password collector yang sudah ada
 * Mengubah sistem dari hardcoded password ke hashed password
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

async function updateExistingCollectorsPassword() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);

        // Check if password column exists and has null values
        db.all("SELECT id, phone, password FROM collectors WHERE password IS NULL OR password = ''", async (err, collectors) => {
            if (err) {
                console.error('Error checking collectors:', err);
                reject(err);
                return;
            }

            if (collectors.length === 0) {
                console.log('✅ Semua collector sudah memiliki password');
                db.close();
                resolve();
                return;
            }

            console.log(`📋 Ditemukan ${collectors.length} collector tanpa password. Mengupdate...`);

            for (const collector of collectors) {
                try {
                    const hashedPassword = await bcrypt.hash('123456', 10);

                    await new Promise((resolveUpdate, rejectUpdate) => {
                        db.run('UPDATE collectors SET password = ? WHERE id = ?',
                            [hashedPassword, collector.id], (err) => {
                            if (err) {
                                rejectUpdate(err);
                            } else {
                                console.log(`✅ Updated password for collector: ${collector.phone}`);
                                resolveUpdate();
                            }
                        });
                    });
                } catch (error) {
                    console.error(`❌ Error updating password for collector ${collector.phone}:`, error);
                }
            }

            console.log('🎉 Semua password collector berhasil diupdate!');
            db.close();
            resolve();
        });
    });
}

// Run the update
updateExistingCollectorsPassword()
    .then(() => {
        console.log('🎉 Update password collector selesai!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Update gagal:', error);
        process.exit(1);
    });
