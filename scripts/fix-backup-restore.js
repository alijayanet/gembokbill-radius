#!/usr/bin/env node

/**
 * Script untuk memperbaiki masalah backup dan restore database
 * Masalah: WAL file tidak di-backup/restore dengan benar
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class BackupRestoreFixer {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/billing.db');
        this.backupPath = path.join(__dirname, '../data/backup');
    }

    async fixCurrentDatabase() {
        console.log('🔧 Memperbaiki database saat ini...');
        
        const db = new sqlite3.Database(this.dbPath);
        
        try {
            // 1. Checkpoint WAL file untuk memastikan semua data tersimpan
            console.log('📝 Melakukan WAL checkpoint...');
            await new Promise((resolve, reject) => {
                db.run('PRAGMA wal_checkpoint(FULL)', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 2. Cek jumlah customer
            const customers = await new Promise((resolve, reject) => {
                db.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0].count);
                });
            });

            console.log(`👥 Total customers: ${customers}`);

            // 3. Cek detail customers
            const customerDetails = await new Promise((resolve, reject) => {
                db.all('SELECT id, username, name, status FROM customers ORDER BY id', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('📋 Detail customers:');
            customerDetails.forEach(c => {
                console.log(`  - ID: ${c.id}, Username: ${c.username}, Name: ${c.name}, Status: ${c.status}`);
            });

            // 4. Optimize database
            console.log('⚡ Optimizing database...');
            await new Promise((resolve, reject) => {
                db.run('VACUUM', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log('✅ Database berhasil diperbaiki!');

        } catch (error) {
            console.error('❌ Error memperbaiki database:', error);
        } finally {
            db.close();
        }
    }

    async createProperBackup() {
        console.log('💾 Membuat backup yang proper...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupPath, `billing_backup_fixed_${timestamp}.db`);
        
        // Pastikan direktori backup ada
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }

        const db = new sqlite3.Database(this.dbPath);
        
        try {
            // 1. Checkpoint WAL file
            console.log('📝 Melakukan WAL checkpoint...');
            await new Promise((resolve, reject) => {
                db.run('PRAGMA wal_checkpoint(FULL)', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 2. Close database
            await new Promise((resolve, reject) => {
                db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 3. Copy database file
            console.log('📋 Menyalin database file...');
            fs.copyFileSync(this.dbPath, backupFile);

            // 4. Copy WAL dan SHM files jika ada
            const walFile = this.dbPath + '-wal';
            const shmFile = this.dbPath + '-shm';
            const backupWalFile = backupFile + '-wal';
            const backupShmFile = backupFile + '-shm';

            if (fs.existsSync(walFile)) {
                console.log('📋 Menyalin WAL file...');
                fs.copyFileSync(walFile, backupWalFile);
            }
            if (fs.existsSync(shmFile)) {
                console.log('📋 Menyalin SHM file...');
                fs.copyFileSync(shmFile, backupShmFile);
            }

            console.log(`✅ Backup berhasil dibuat: ${path.basename(backupFile)}`);

            // 5. Verifikasi backup
            const backupDb = new sqlite3.Database(backupFile);
            const backupCustomers = await new Promise((resolve, reject) => {
                backupDb.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0].count);
                });
            });
            backupDb.close();

            console.log(`✅ Backup berisi ${backupCustomers} customers`);

        } catch (error) {
            console.error('❌ Error membuat backup:', error);
        }
    }

    async testRestore(backupFileName) {
        console.log(`🔄 Testing restore dari ${backupFileName}...`);
        
        const backupFile = path.join(this.backupPath, backupFileName);
        
        if (!fs.existsSync(backupFile)) {
            console.error('❌ File backup tidak ditemukan:', backupFile);
            return;
        }

        // Backup database saat ini
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const currentBackup = path.join(this.backupPath, `pre_test_restore_${timestamp}.db`);
        fs.copyFileSync(this.dbPath, currentBackup);

        try {
            // Restore database
            console.log('📋 Restoring database...');
            fs.copyFileSync(backupFile, this.dbPath);

            // Restore WAL dan SHM files jika ada
            const backupWalFile = backupFile + '-wal';
            const backupShmFile = backupFile + '-shm';
            const walFile = this.dbPath + '-wal';
            const shmFile = this.dbPath + '-shm';

            if (fs.existsSync(backupWalFile)) {
                console.log('📋 Restoring WAL file...');
                fs.copyFileSync(backupWalFile, walFile);
            }
            if (fs.existsSync(backupShmFile)) {
                console.log('📋 Restoring SHM file...');
                fs.copyFileSync(backupShmFile, shmFile);
            }

            // Verifikasi restore
            const db = new sqlite3.Database(this.dbPath);
            const restoredCustomers = await new Promise((resolve, reject) => {
                db.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0].count);
                });
            });
            db.close();

            console.log(`✅ Restore berhasil! Database berisi ${restoredCustomers} customers`);

            // Restore database asli
            console.log('🔄 Mengembalikan database asli...');
            fs.copyFileSync(currentBackup, this.dbPath);

        } catch (error) {
            console.error('❌ Error testing restore:', error);
            
            // Restore database asli jika ada error
            if (fs.existsSync(currentBackup)) {
                fs.copyFileSync(currentBackup, this.dbPath);
            }
        }
    }

    async listBackups() {
        console.log('📋 Daftar file backup:');
        
        if (!fs.existsSync(this.backupPath)) {
            console.log('  Tidak ada file backup');
            return;
        }

        const files = fs.readdirSync(this.backupPath)
            .filter(file => file.endsWith('.db'))
            .map(file => {
                const filePath = path.join(this.backupPath, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime
                };
            })
            .sort((a, b) => b.created - a.created);

        files.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.filename}`);
            console.log(`     Size: ${(file.size / 1024).toFixed(2)} KB`);
            console.log(`     Created: ${file.created.toLocaleString('id-ID')}`);
        });
    }
}

// Main execution
async function main() {
    const fixer = new BackupRestoreFixer();
    
    console.log('🚀 Memulai perbaikan backup dan restore...\n');
    
    // 1. Perbaiki database saat ini
    await fixer.fixCurrentDatabase();
    console.log('');
    
    // 2. Buat backup yang proper
    await fixer.createProperBackup();
    console.log('');
    
    // 3. List semua backup
    await fixer.listBackups();
    console.log('');
    
    console.log('✅ Perbaikan selesai!');
    console.log('');
    console.log('📝 Langkah selanjutnya:');
    console.log('1. Test backup baru di halaman admin settings');
    console.log('2. Test restore dengan file backup yang baru');
    console.log('3. Jika masih ada masalah, jalankan script ini lagi');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = BackupRestoreFixer;
