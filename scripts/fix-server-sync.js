#!/usr/bin/env node

/**
 * Script untuk mengatasi masalah sinkronisasi data server
 * Membuat backup yang konsisten dan script untuk deploy
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class ServerSyncFixer {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/billing.db');
        this.backupPath = path.join(__dirname, '../data/backup');
    }

    async createProductionBackup() {
        console.log('🏭 Membuat backup production untuk server...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupPath, `production_backup_${timestamp}.db`);
        
        // Pastikan direktori backup ada
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }

        const db = new sqlite3.Database(this.dbPath);
        
        try {
            // 1. WAL Checkpoint untuk memastikan data konsisten
            console.log('📝 Melakukan WAL checkpoint...');
            await new Promise((resolve, reject) => {
                db.run('PRAGMA wal_checkpoint(FULL)', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 2. Optimize database
            console.log('⚡ Optimizing database...');
            await new Promise((resolve, reject) => {
                db.run('VACUUM', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 3. Close database
            await new Promise((resolve, reject) => {
                db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 4. Copy database
            console.log('📋 Menyalin database...');
            fs.copyFileSync(this.dbPath, backupFile);

            // 5. Copy WAL dan SHM files jika ada
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

            console.log(`✅ Production backup berhasil dibuat: ${path.basename(backupFile)}`);

            // 6. Verifikasi backup
            const backupDb = new sqlite3.Database(backupFile);
            const backupCustomers = await new Promise((resolve, reject) => {
                backupDb.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0].count);
                });
            });
            backupDb.close();

            console.log(`✅ Backup berisi ${backupCustomers} customers`);

            return backupFile;

        } catch (error) {
            console.error('❌ Error membuat production backup:', error);
            return null;
        }
    }

    async createDeployScript() {
        console.log('🚀 Membuat script deploy untuk server...');
        
        const deployScript = `#!/bin/bash

# Script deploy untuk server
# Generated: ${new Date().toISOString()}

echo "🚀 Memulai deploy ke server..."

# 1. Backup database server saat ini
echo "📋 Membuat backup database server..."
cp /path/to/server/data/billing.db /path/to/server/data/backup/server_backup_$(date +%Y%m%d_%H%M%S).db

# 2. Stop aplikasi (jika menggunakan PM2)
echo "⏹️  Menghentikan aplikasi..."
pm2 stop gembok-bill || true

# 3. Upload file backup baru
echo "📤 Mengupload database baru..."
# scp production_backup_*.db user@server:/path/to/server/data/billing.db

# 4. Restore database
echo "🔄 Restore database..."
# cp production_backup_*.db /path/to/server/data/billing.db

# 5. Set permissions
echo "🔐 Mengatur permissions..."
chmod 644 /path/to/server/data/billing.db
chown www-data:www-data /path/to/server/data/billing.db

# 6. Start aplikasi
echo "▶️  Menjalankan aplikasi..."
pm2 start gembok-bill

# 7. Verifikasi
echo "✅ Verifikasi deploy..."
pm2 status gembok-bill

echo "🎉 Deploy selesai!"
`;

        const deployFile = path.join(this.backupPath, `deploy_${new Date().toISOString().split('T')[0]}.sh`);
        fs.writeFileSync(deployFile, deployScript);
        fs.chmodSync(deployFile, '755');
        
        console.log(`🚀 Script deploy tersimpan: ${path.basename(deployFile)}`);
        return deployFile;
    }

    async createRestoreScript() {
        console.log('🔄 Membuat script restore untuk server...');
        
        const restoreScript = `#!/bin/bash

# Script restore database di server
# Generated: ${new Date().toISOString()}

echo "🔄 Memulai restore database di server..."

# 1. Stop aplikasi
echo "⏹️  Menghentikan aplikasi..."
pm2 stop gembok-bill || true

# 2. Backup database saat ini
echo "📋 Backup database saat ini..."
cp /path/to/server/data/billing.db /path/to/server/data/backup/pre_restore_$(date +%Y%m%d_%H%M%S).db

# 3. Restore database
echo "🔄 Restore database..."
cp production_backup_*.db /path/to/server/data/billing.db

# 4. Set permissions
echo "🔐 Mengatur permissions..."
chmod 644 /path/to/server/data/billing.db
chown www-data:www-data /path/to/server/data/billing.db

# 5. Start aplikasi
echo "▶️  Menjalankan aplikasi..."
pm2 start gembok-bill

# 6. Verifikasi
echo "✅ Verifikasi restore..."
pm2 status gembok-bill

echo "🎉 Restore selesai!"
`;

        const restoreFile = path.join(this.backupPath, `restore_${new Date().toISOString().split('T')[0]}.sh`);
        fs.writeFileSync(restoreFile, restoreScript);
        fs.chmodSync(restoreFile, '755');
        
        console.log(`🔄 Script restore tersimpan: ${path.basename(restoreFile)}`);
        return restoreFile;
    }

    async createDataValidationScript() {
        console.log('✅ Membuat script validasi data...');
        
        const validationScript = `#!/bin/bash

# Script validasi data di server
# Generated: ${new Date().toISOString()}

echo "✅ Memulai validasi data di server..."

# 1. Cek jumlah customers
echo "👥 Validasi customers..."
CUSTOMER_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM customers;")
echo "Total customers: $CUSTOMER_COUNT"

# 2. Cek jumlah packages
echo "📦 Validasi packages..."
PACKAGE_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM packages;")
echo "Total packages: $PACKAGE_COUNT"

# 3. Cek jumlah technicians
echo "👨‍💼 Validasi technicians..."
TECHNICIAN_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM technicians;")
echo "Total technicians: $TECHNICIAN_COUNT"

# 4. Cek jumlah ODPs
echo "🏗️ Validasi ODPs..."
ODP_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM odps;")
echo "Total ODPs: $ODP_COUNT"

# 5. Cek status aplikasi
echo "🔍 Cek status aplikasi..."
pm2 status gembok-bill

echo "✅ Validasi selesai!"
`;

        const validationFile = path.join(this.backupPath, `validate_${new Date().toISOString().split('T')[0]}.sh`);
        fs.writeFileSync(validationFile, validationScript);
        fs.chmodSync(validationFile, '755');
        
        console.log(`✅ Script validasi tersimpan: ${path.basename(validationFile)}`);
        return validationFile;
    }

    async generateDeployInstructions() {
        console.log('📋 Membuat instruksi deploy...');
        
        const instructions = `
# 📋 INSTRUKSI DEPLOY KE SERVER

## 🚀 Langkah-langkah Deploy

### 1. Persiapan
- Pastikan aplikasi lokal sudah berjalan dengan baik
- Backup database lokal sudah dibuat
- File backup sudah siap untuk di-upload

### 2. Upload ke Server
\`\`\`bash
# Upload file backup ke server
scp production_backup_*.db user@server:/path/to/server/data/

# Upload script deploy
scp deploy_*.sh user@server:/path/to/server/scripts/
scp restore_*.sh user@server:/path/to/server/scripts/
scp validate_*.sh user@server:/path/to/server/scripts/
\`\`\`

### 3. Deploy di Server
\`\`\`bash
# SSH ke server
ssh user@server

# Jalankan script deploy
cd /path/to/server/scripts/
chmod +x *.sh
./deploy_*.sh
\`\`\`

### 4. Verifikasi
\`\`\`bash
# Jalankan script validasi
./validate_*.sh

# Cek log aplikasi
pm2 logs gembok-bill

# Test aplikasi
curl http://localhost:3003/admin
\`\`\`

### 5. Rollback (jika diperlukan)
\`\`\`bash
# Restore dari backup sebelumnya
./restore_*.sh
\`\`\`

## ⚠️ Catatan Penting

1. **Backup Database**: Selalu backup database server sebelum deploy
2. **Test di Staging**: Test dulu di environment staging jika ada
3. **Monitoring**: Monitor aplikasi setelah deploy
4. **Rollback Plan**: Siapkan plan rollback jika ada masalah

## 🔧 Troubleshooting

### Database tidak sinkron
- Cek WAL files di server
- Jalankan WAL checkpoint
- Restore dari backup yang benar

### Aplikasi tidak start
- Cek permissions database
- Cek log aplikasi
- Restart aplikasi

### Data hilang
- Restore dari backup terakhir
- Cek apakah ada transaksi yang belum di-commit
`;

        const instructionsFile = path.join(this.backupPath, `DEPLOY_INSTRUCTIONS.md`);
        fs.writeFileSync(instructionsFile, instructions);
        
        console.log(`📋 Instruksi deploy tersimpan: ${path.basename(instructionsFile)}`);
        return instructionsFile;
    }
}

// Main execution
async function main() {
    const fixer = new ServerSyncFixer();
    
    console.log('🚀 Memulai persiapan deploy ke server...\n');
    
    // 1. Buat backup production
    const backupFile = await fixer.createProductionBackup();
    console.log('');
    
    // 2. Buat script deploy
    const deployFile = await fixer.createDeployScript();
    console.log('');
    
    // 3. Buat script restore
    const restoreFile = await fixer.createRestoreScript();
    console.log('');
    
    // 4. Buat script validasi
    const validationFile = await fixer.createDataValidationScript();
    console.log('');
    
    // 5. Generate instruksi deploy
    const instructionsFile = await fixer.generateDeployInstructions();
    console.log('');
    
    console.log('✅ Persiapan deploy selesai!');
    console.log('');
    console.log('📁 File yang dibuat:');
    console.log(`  - Backup: ${path.basename(backupFile)}`);
    console.log(`  - Deploy Script: ${path.basename(deployFile)}`);
    console.log(`  - Restore Script: ${path.basename(restoreFile)}`);
    console.log(`  - Validation Script: ${path.basename(validationFile)}`);
    console.log(`  - Instructions: ${path.basename(instructionsFile)}`);
    console.log('');
    console.log('📝 Langkah selanjutnya:');
    console.log('1. Upload file backup ke server');
    console.log('2. Upload script ke server');
    console.log('3. Jalankan script deploy di server');
    console.log('4. Verifikasi data di server');
    console.log('5. Test aplikasi di server');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ServerSyncFixer;
