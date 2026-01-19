#!/usr/bin/env node

/**
 * Script untuk membandingkan data server dengan lokal
 * Membantu mengidentifikasi perbedaan data
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class ServerDataComparator {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/billing.db');
        this.backupPath = path.join(__dirname, '../data/backup');
    }

    async analyzeLocalData() {
        console.log('🔍 Menganalisis data lokal...');
        
        const db = new sqlite3.Database(this.dbPath);
        
        try {
            const data = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        'customers' as table_name,
                        COUNT(*) as count,
                        'customers' as description
                    FROM customers
                    UNION ALL
                    SELECT 
                        'packages' as table_name,
                        COUNT(*) as count,
                        'packages' as description
                    FROM packages
                    UNION ALL
                    SELECT 
                        'technicians' as table_name,
                        COUNT(*) as count,
                        'technicians' as description
                    FROM technicians
                    UNION ALL
                    SELECT 
                        'odps' as table_name,
                        COUNT(*) as count,
                        'odps' as description
                    FROM odps
                    UNION ALL
                    SELECT 
                        'invoices' as table_name,
                        COUNT(*) as count,
                        'invoices' as description
                    FROM invoices
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('📊 Data lokal:');
            data.forEach(row => {
                console.log(`  - ${row.description}: ${row.count}`);
            });

            return data;

        } catch (error) {
            console.error('❌ Error menganalisis data lokal:', error);
            return null;
        } finally {
            db.close();
        }
    }

    async analyzeServerData(serverBackupFile) {
        console.log(`🔍 Menganalisis data server dari ${serverBackupFile}...`);
        
        if (!fs.existsSync(serverBackupFile)) {
            console.error('❌ File backup server tidak ditemukan:', serverBackupFile);
            return null;
        }

        const db = new sqlite3.Database(serverBackupFile);
        
        try {
            const data = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        'customers' as table_name,
                        COUNT(*) as count,
                        'customers' as description
                    FROM customers
                    UNION ALL
                    SELECT 
                        'packages' as table_name,
                        COUNT(*) as count,
                        'packages' as description
                    FROM packages
                    UNION ALL
                    SELECT 
                        'technicians' as table_name,
                        COUNT(*) as count,
                        'technicians' as description
                    FROM technicians
                    UNION ALL
                    SELECT 
                        'odps' as table_name,
                        COUNT(*) as count,
                        'odps' as description
                    FROM odps
                    UNION ALL
                    SELECT 
                        'invoices' as table_name,
                        COUNT(*) as count,
                        'invoices' as description
                    FROM invoices
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('📊 Data server:');
            data.forEach(row => {
                console.log(`  - ${row.description}: ${row.count}`);
            });

            return data;

        } catch (error) {
            console.error('❌ Error menganalisis data server:', error);
            return null;
        } finally {
            db.close();
        }
    }

    async compareData(localData, serverData) {
        console.log('\n🔄 Membandingkan data...');
        
        if (!localData || !serverData) {
            console.error('❌ Data tidak lengkap untuk perbandingan');
            return;
        }

        const differences = [];
        
        localData.forEach(local => {
            const server = serverData.find(s => s.table_name === local.table_name);
            if (server) {
                if (local.count !== server.count) {
                    differences.push({
                        table: local.table_name,
                        local: local.count,
                        server: server.count,
                        difference: local.count - server.count
                    });
                }
            }
        });

        if (differences.length === 0) {
            console.log('✅ Data lokal dan server sama!');
        } else {
            console.log('⚠️  Ditemukan perbedaan data:');
            differences.forEach(diff => {
                console.log(`  - ${diff.table}:`);
                console.log(`    Lokal: ${diff.local}`);
                console.log(`    Server: ${diff.server}`);
                console.log(`    Selisih: ${diff.difference > 0 ? '+' : ''}${diff.difference}`);
                console.log('');
            });
        }

        return differences;
    }

    async generateSyncReport(localData, serverData, differences) {
        console.log('📄 Membuat laporan sinkronisasi...');
        
        const report = {
            timestamp: new Date().toISOString(),
            local: localData,
            server: serverData,
            differences: differences,
            recommendations: []
        };

        if (differences.length > 0) {
            differences.forEach(diff => {
                if (diff.difference > 0) {
                    report.recommendations.push({
                        action: 'upload',
                        table: diff.table,
                        reason: `Lokal memiliki ${diff.difference} record lebih banyak`,
                        suggestion: 'Upload data lokal ke server'
                    });
                } else {
                    report.recommendations.push({
                        action: 'download',
                        table: diff.table,
                        reason: `Server memiliki ${Math.abs(diff.difference)} record lebih banyak`,
                        suggestion: 'Download data server ke lokal'
                    });
                }
            });
        } else {
            report.recommendations.push({
                action: 'sync',
                reason: 'Data sudah sinkron',
                suggestion: 'Tidak perlu sinkronisasi'
            });
        }

        const reportFile = path.join(this.backupPath, `sync_report_${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`📄 Laporan sinkronisasi tersimpan: ${path.basename(reportFile)}`);
        
        console.log('\n📋 Rekomendasi:');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.suggestion}`);
            console.log(`   Alasan: ${rec.reason}`);
        });

        return reportFile;
    }

    async listBackupFiles() {
        console.log('📁 File backup yang tersedia:');
        
        if (!fs.existsSync(this.backupPath)) {
            console.log('  Tidak ada file backup');
            return [];
        }

        const files = fs.readdirSync(this.backupPath)
            .filter(file => file.endsWith('.db'))
            .map(file => {
                const filePath = path.join(this.backupPath, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    path: filePath
                };
            })
            .sort((a, b) => b.created - a.created);

        files.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.filename}`);
            console.log(`     Size: ${(file.size / 1024).toFixed(2)} KB`);
            console.log(`     Created: ${file.created.toLocaleString('id-ID')}`);
        });

        return files;
    }
}

// Main execution
async function main() {
    const comparator = new ServerDataComparator();
    
    console.log('🚀 Memulai perbandingan data...\n');
    
    // 1. List backup files
    const backupFiles = await comparator.listBackupFiles();
    console.log('');
    
    // 2. Analisis data lokal
    const localData = await comparator.analyzeLocalData();
    console.log('');
    
    // 3. Pilih file backup server (yang terbaru)
    let serverBackupFile = null;
    if (backupFiles.length > 0) {
        // Cari file backup server
        const serverBackup = backupFiles.find(f => f.filename.includes('server_backup'));
        if (serverBackup) {
            serverBackupFile = serverBackup.path;
            console.log(`📁 Menggunakan backup server: ${serverBackup.filename}`);
        } else {
            console.log('⚠️  Tidak ada backup server, menggunakan backup terbaru');
            serverBackupFile = backupFiles[0].path;
        }
    } else {
        console.log('❌ Tidak ada file backup untuk dianalisis');
        return;
    }
    
    // 4. Analisis data server
    const serverData = await comparator.analyzeServerData(serverBackupFile);
    console.log('');
    
    // 5. Bandingkan data
    const differences = await comparator.compareData(localData, serverData);
    console.log('');
    
    // 6. Generate laporan
    const reportFile = await comparator.generateSyncReport(localData, serverData, differences);
    console.log('');
    
    console.log('✅ Perbandingan selesai!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ServerDataComparator;
