/**
 * Migration: Add password field to collectors table
 * Menambahkan field password untuk sistem authentication collector
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addPasswordToCollectors() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);

        // Check if password column already exists
        db.all("PRAGMA table_info(collectors)", (err, columns) => {
            if (err) {
                console.error('Error checking table info:', err);
                reject(err);
                return;
            }

            const hasPassword = columns.some(col => col.name === 'password');

            if (hasPassword) {
                console.log('✅ Password column already exists in collectors table');
                db.close();
                resolve();
                return;
            }

            // Add password column
            db.run(`ALTER TABLE collectors ADD COLUMN password TEXT`, (err) => {
                if (err) {
                    console.error('❌ Error adding password column:', err);
                    reject(err);
                    return;
                }

                console.log('✅ Successfully added password column to collectors table');

                // Set default password "123456" for existing collectors (for backward compatibility)
                const bcrypt = require('bcrypt');
                bcrypt.hash('123456', 10, (err, hashedPassword) => {
                    if (err) {
                        console.error('❌ Error hashing default password:', err);
                        reject(err);
                        return;
                    }

                    db.run(`UPDATE collectors SET password = ? WHERE password IS NULL`, [hashedPassword], (err) => {
                        if (err) {
                            console.error('❌ Error setting default passwords:', err);
                            reject(err);
                            return;
                        }

                        console.log('✅ Default passwords set for existing collectors');
                        db.close();
                        resolve();
                    });
                });
            });
        });
    });
}

// Run migration
addPasswordToCollectors()
    .then(() => {
        console.log('🎉 Collector password migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
