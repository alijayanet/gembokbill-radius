#!/usr/bin/env node

/**
 * Script untuk validasi data dashboard kolektor
 * Memastikan data yang ditampilkan sesuai dengan transaksi real
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/billing.db');

async function validateCollectorDashboard() {
    console.log('🔍 Memulai validasi dashboard kolektor...');
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        // 1. Validasi data kolektor
        console.log('📊 Validasi data kolektor...');
        const collectors = await new Promise((resolve, reject) => {
            db.all(`
                SELECT id, name, commission_rate, status,
                       COUNT(cp.id) as total_payments,
                       COALESCE(SUM(cp.payment_amount), 0) as total_collected,
                       COALESCE(SUM(cp.commission_amount), 0) as total_commission
                FROM collectors c
                LEFT JOIN collector_payments cp ON c.id = cp.collector_id 
                    AND cp.status = 'completed'
                GROUP BY c.id
                ORDER BY c.name
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        console.log(`✅ Ditemukan ${collectors.length} kolektor:`);
        
        for (const collector of collectors) {
            console.log(`\n📋 Kolektor: ${collector.name} (ID: ${collector.id})`);
            console.log(`   - Rate Komisi: ${collector.commission_rate}%`);
            console.log(`   - Status: ${collector.status}`);
            console.log(`   - Total Pembayaran: ${collector.total_payments}`);
            console.log(`   - Total Terkumpul: Rp ${parseInt(collector.total_collected).toLocaleString('id-ID')}`);
            console.log(`   - Total Komisi: Rp ${parseInt(collector.total_commission).toLocaleString('id-ID')}`);
            
            // Validasi commission rate
            if (collector.commission_rate < 0 || collector.commission_rate > 100) {
                console.log(`   ⚠️  WARNING: Rate komisi tidak valid (${collector.commission_rate}%)`);
            }
            
            // Validasi perhitungan komisi
            if (collector.total_payments > 0) {
                const expectedCommission = (collector.total_collected * collector.commission_rate) / 100;
                const actualCommission = collector.total_commission;
                const difference = Math.abs(expectedCommission - actualCommission);
                
                if (difference > 1) { // Toleransi 1 rupiah untuk rounding
                    console.log(`   ⚠️  WARNING: Perhitungan komisi tidak sesuai`);
                    console.log(`       Expected: Rp ${Math.round(expectedCommission).toLocaleString('id-ID')}`);
                    console.log(`       Actual: Rp ${Math.round(actualCommission).toLocaleString('id-ID')}`);
                    console.log(`       Difference: Rp ${Math.round(difference).toLocaleString('id-ID')}`);
                } else {
                    console.log(`   ✅ Perhitungan komisi sesuai`);
                }
            }
        }
        
        // 2. Validasi data pembayaran hari ini
        console.log('\n📅 Validasi pembayaran hari ini...');
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const todayPayments = await new Promise((resolve, reject) => {
            db.all(`
                SELECT cp.*, c.name as collector_name, cust.name as customer_name
                FROM collector_payments cp
                LEFT JOIN collectors c ON cp.collector_id = c.id
                LEFT JOIN customers cust ON cp.customer_id = cust.id
                WHERE cp.collected_at >= ? AND cp.collected_at < ? AND cp.status = 'completed'
                ORDER BY cp.collected_at DESC
            `, [startOfDay.toISOString(), endOfDay.toISOString()], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        console.log(`✅ Pembayaran hari ini: ${todayPayments.length} transaksi`);
        
        if (todayPayments.length > 0) {
            const totalToday = todayPayments.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0);
            const totalCommissionToday = todayPayments.reduce((sum, p) => sum + (parseFloat(p.commission_amount) || 0), 0);
            
            console.log(`   - Total Pembayaran: Rp ${Math.round(totalToday).toLocaleString('id-ID')}`);
            console.log(`   - Total Komisi: Rp ${Math.round(totalCommissionToday).toLocaleString('id-ID')}`);
            
            // Detail per kolektor
            const byCollector = {};
            todayPayments.forEach(p => {
                const collectorId = p.collector_id;
                if (!byCollector[collectorId]) {
                    byCollector[collectorId] = {
                        name: p.collector_name,
                        count: 0,
                        total: 0,
                        commission: 0
                    };
                }
                byCollector[collectorId].count++;
                byCollector[collectorId].total += parseFloat(p.payment_amount) || 0;
                byCollector[collectorId].commission += parseFloat(p.commission_amount) || 0;
            });
            
            console.log('\n   📊 Detail per kolektor:');
            Object.values(byCollector).forEach(collector => {
                console.log(`   - ${collector.name}: ${collector.count} transaksi, Rp ${Math.round(collector.total).toLocaleString('id-ID')}, Komisi Rp ${Math.round(collector.commission).toLocaleString('id-ID')}`);
            });
        }
        
        // 3. Validasi konsistensi data
        console.log('\n🔍 Validasi konsistensi data...');
        
        const inconsistencies = await new Promise((resolve, reject) => {
            db.all(`
                SELECT cp.*, c.commission_rate
                FROM collector_payments cp
                LEFT JOIN collectors c ON cp.collector_id = c.id
                WHERE cp.status = 'completed'
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        let inconsistentCount = 0;
        for (const payment of inconsistencies) {
            const expectedCommission = (payment.payment_amount * payment.commission_rate) / 100;
            const actualCommission = payment.commission_amount;
            const difference = Math.abs(expectedCommission - actualCommission);
            
            if (difference > 1) { // Toleransi 1 rupiah
                inconsistentCount++;
                if (inconsistentCount <= 5) { // Tampilkan maksimal 5 contoh
                    console.log(`   ⚠️  Payment ID ${payment.id}: Expected ${Math.round(expectedCommission)}, Actual ${Math.round(actualCommission)}`);
                }
            }
        }
        
        if (inconsistentCount > 0) {
            console.log(`   ⚠️  Total ${inconsistentCount} pembayaran dengan perhitungan komisi tidak konsisten`);
        } else {
            console.log(`   ✅ Semua perhitungan komisi konsisten`);
        }
        
        // 4. Summary
        console.log('\n📊 SUMMARY VALIDASI:');
        console.log(`✅ Total Kolektor: ${collectors.length}`);
        console.log(`✅ Total Pembayaran Hari Ini: ${todayPayments.length}`);
        console.log(`✅ Data Konsisten: ${inconsistentCount === 0 ? 'YA' : 'TIDAK'}`);
        
        if (inconsistentCount > 0) {
            console.log(`⚠️  Ditemukan ${inconsistentCount} data tidak konsisten`);
            console.log('   Rekomendasi: Jalankan script cleanup untuk memperbaiki data');
        }
        
        console.log('\n🎉 Validasi dashboard kolektor selesai!');
        
    } catch (error) {
        console.error('❌ Error selama validasi:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Run validation if called directly
if (require.main === module) {
    validateCollectorDashboard()
        .then(() => {
            console.log('✅ Script validasi selesai');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script validasi gagal:', error);
            process.exit(1);
        });
}

module.exports = { validateCollectorDashboard };
