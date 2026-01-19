#!/usr/bin/env node

/**
 * Script untuk sinkronisasi data antara lokal dan server
 * Membandingkan data customer dan membuat backup yang konsisten
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class ServerDataSync {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/billing.db');
        this.backupPath = path.join(__dirname, '../data/backup');
    }

    async analyzeCurrentData() {
        console.log('🔍 Menganalisis data saat ini...');
        
        const db = new sqlite3.Database(this.dbPath);
        
        try {
            // 1. Cek total customers
            const totalCustomers = await new Promise((resolve, reject) => {
                db.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0].count);
                });
            });

            console.log(`👥 Total customers: ${totalCustomers}`);

            // 2. Detail customers
            const customers = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT c.id, c.username, c.name, c.status, c.package_id, p.name as package_name,
                           c.latitude, c.longitude, c.created_by_technician_id
                    FROM customers c 
                    LEFT JOIN packages p ON c.package_id = p.id 
                    ORDER BY c.id
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('📋 Detail customers:');
            customers.forEach(c => {
                console.log(`  - ID: ${c.id}, Username: ${c.username}, Name: ${c.name}`);
                console.log(`    Status: ${c.status}, Package: ${c.package_name || 'N/A'}`);
                console.log(`    Coordinates: ${c.latitude || 'N/A'}, ${c.longitude || 'N/A'}`);
                console.log(`    Created by: ${c.created_by_technician_id || 'N/A'}`);
                console.log('');
            });

            // 3. Cek packages
            const packages = await new Promise((resolve, reject) => {
                db.all('SELECT id, name, price FROM packages ORDER BY id', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('📦 Packages:');
            packages.forEach(p => {
                console.log(`  - ID: ${p.id}, Name: ${p.name}, Price: ${p.price}`);
            });

            // 4. Cek technicians
            const technicians = await new Promise((resolve, reject) => {
                db.all('SELECT id, name, phone FROM technicians ORDER BY id', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('👨‍💼 Technicians:');
            technicians.forEach(t => {
                console.log(`  - ID: ${t.id}, Name: ${t.name}, Phone: ${t.phone}`);
            });

            // 5. Cek ODPs
            const odps = await new Promise((resolve, reject) => {
                db.all('SELECT id, name, code, capacity, used_ports, status FROM odps ORDER BY id', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('🏗️ ODPs:');
            odps.forEach(o => {
                console.log(`  - ID: ${o.id}, Name: ${o.name}, Code: ${o.code}`);
                console.log(`    Capacity: ${o.capacity}, Used: ${o.used_ports}, Status: ${o.status}`);
            });

            return {
                totalCustomers,
                customers,
                packages,
                technicians,
                odps
            };

        } catch (error) {
            console.error('❌ Error menganalisis data:', error);
            return null;
        } finally {
            db.close();
        }
    }

    async createServerBackup() {
        console.log('💾 Membuat backup untuk server...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupPath, `server_backup_${timestamp}.db`);
        
        // Pastikan direktori backup ada
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }

        const db = new sqlite3.Database(this.dbPath);
        
        try {
            // 1. WAL Checkpoint
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

            // 3. Copy database
            console.log('📋 Menyalin database...');
            fs.copyFileSync(this.dbPath, backupFile);

            // 4. Copy WAL dan SHM files
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

            console.log(`✅ Server backup berhasil dibuat: ${path.basename(backupFile)}`);

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

            return backupFile;

        } catch (error) {
            console.error('❌ Error membuat server backup:', error);
            return null;
        }
    }

    async generateDataReport() {
        console.log('📊 Membuat laporan data...');
        
        const data = await this.analyzeCurrentData();
        if (!data) return;

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalCustomers: data.totalCustomers,
                totalPackages: data.packages.length,
                totalTechnicians: data.technicians.length,
                totalODPs: data.odps.length
            },
            customers: data.customers.map(c => ({
                id: c.id,
                username: c.username,
                name: c.name,
                status: c.status,
                package: c.package_name,
                hasCoordinates: !!(c.latitude && c.longitude)
            })),
            packages: data.packages,
            technicians: data.technicians,
            odps: data.odps
        };

        const reportFile = path.join(this.backupPath, `data_report_${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`📄 Laporan data tersimpan: ${path.basename(reportFile)}`);
        return reportFile;
    }

    async createMigrationScript() {
        console.log('🔧 Membuat script migrasi...');
        
        const data = await this.analyzeCurrentData();
        if (!data) return;

        const migrationScript = `
-- Migration script untuk server
-- Generated: ${new Date().toISOString()}

-- 1. Backup database saat ini
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- 2. Insert customers jika belum ada
${data.customers.map(c => `
INSERT OR IGNORE INTO customers (
    id, username, name, phone, email, address, package_id, status,
    pppoe_username, latitude, longitude, auto_suspension, billing_day, join_date
) VALUES (
    ${c.id}, '${c.username}', '${c.name}', '', '', '', ${c.package_id || 'NULL'}, '${c.status}',
    '${c.username}', ${c.latitude || 'NULL'}, ${c.longitude || 'NULL'}, 1, 15, '${new Date().toISOString().split('T')[0]}'
);`).join('\n')}

-- 3. Update packages jika perlu
${data.packages.map(p => `
INSERT OR IGNORE INTO packages (id, name, price) VALUES (${p.id}, '${p.name}', ${p.price});`).join('\n')}

-- 4. Update technicians jika perlu
${data.technicians.map(t => `
INSERT OR IGNORE INTO technicians (id, name, phone) VALUES (${t.id}, '${t.name}', '${t.phone}');`).join('\n')}

-- 5. Update ODPs jika perlu
${data.odps.map(o => `
INSERT OR IGNORE INTO odps (id, name, code, capacity, used_ports, status) VALUES (${o.id}, '${o.name}', '${o.code}', ${o.capacity}, ${o.used_ports}, '${o.status}');`).join('\n')}
`;

        const migrationFile = path.join(this.backupPath, `migration_${new Date().toISOString().split('T')[0]}.sql`);
        fs.writeFileSync(migrationFile, migrationScript);
        
        console.log(`🔧 Script migrasi tersimpan: ${path.basename(migrationFile)}`);
        return migrationFile;
    }

    async compareWithServer(serverData) {
        console.log('🔄 Membandingkan dengan data server...');
        
        const localData = await this.analyzeCurrentData();
        if (!localData) return;

        console.log('\n📊 PERBANDINGAN DATA:');
        console.log(`Lokal - Customers: ${localData.totalCustomers}`);
        console.log(`Server - Customers: ${serverData.totalCustomers || 'Unknown'}`);
        
        if (localData.totalCustomers !== serverData.totalCustomers) {
            console.log('⚠️  JUMLAH CUSTOMER BERBEDA!');
            console.log('📋 Rekomendasi:');
            console.log('1. Upload backup lokal ke server');
            console.log('2. Atau download data server ke lokal');
            console.log('3. Merge data jika diperlukan');
        } else {
            console.log('✅ Jumlah customer sama');
        }

        return {
            local: localData,
            server: serverData,
            differences: localData.totalCustomers !== serverData.totalCustomers
        };
    }
}

// Main execution
async function main() {
    const sync = new ServerDataSync();
    
    console.log('🚀 Memulai sinkronisasi data server...\n');
    
    // 1. Analisis data saat ini
    await sync.analyzeCurrentData();
    console.log('');
    
    // 2. Buat backup untuk server
    const backupFile = await sync.createServerBackup();
    console.log('');
    
    // 3. Generate laporan data
    const reportFile = await sync.generateDataReport();
    console.log('');
    
    // 4. Buat script migrasi
    const migrationFile = await sync.createMigrationScript();
    console.log('');
    
    console.log('✅ Sinkronisasi selesai!');
    console.log('');
    console.log('📁 File yang dibuat:');
    console.log(`  - Backup: ${path.basename(backupFile)}`);
    console.log(`  - Report: ${path.basename(reportFile)}`);
    console.log(`  - Migration: ${path.basename(migrationFile)}`);
    console.log('');
    console.log('📝 Langkah selanjutnya:');
    console.log('1. Upload backup file ke server');
    console.log('2. Restore database di server');
    console.log('3. Verifikasi data di server');
    console.log('4. Jika ada perbedaan, gunakan migration script');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ServerDataSync;
