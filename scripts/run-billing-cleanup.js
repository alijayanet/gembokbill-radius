#!/usr/bin/env node

/**
 * Script untuk menjalankan cleanup database billing
 * Menjalankan migrasi untuk meningkatkan integritas data
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/billing.db');

async function runBillingCleanup() {
    console.log('🔧 Memulai cleanup database billing...');
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        // 1. Check for data inconsistencies
        console.log('📊 Mengecek inkonsistensi data...');
        const inconsistencies = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    id, 
                    amount, 
                    payment_amount,
                    (amount - payment_amount) as difference
                FROM collector_payments 
                WHERE amount != payment_amount
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (inconsistencies.length > 0) {
            console.log(`⚠️  Ditemukan ${inconsistencies.length} data tidak konsisten:`);
            inconsistencies.forEach(row => {
                console.log(`   ID ${row.id}: amount=${row.amount}, payment_amount=${row.payment_amount}, diff=${row.difference}`);
            });
            
            // Fix inconsistencies
            console.log('🔧 Memperbaiki data tidak konsisten...');
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE collector_payments 
                    SET amount = payment_amount 
                    WHERE amount != payment_amount
                `, function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`✅ Memperbaiki ${this.changes} records`);
                        resolve();
                    }
                });
            });
        } else {
            console.log('✅ Tidak ada data tidak konsisten');
        }
        
        // 2. Add constraints
        console.log('🔒 Menambahkan constraints...');
        
        const constraints = [
            {
                name: 'chk_commission_rate',
                table: 'collectors',
                check: 'commission_rate >= 0 AND commission_rate <= 100'
            },
            {
                name: 'chk_payment_amount',
                table: 'collector_payments',
                check: 'payment_amount > 0'
            },
            {
                name: 'chk_commission_amount',
                table: 'collector_payments',
                check: 'commission_amount >= 0'
            },
            {
                name: 'chk_invoice_amount',
                table: 'invoices',
                check: 'amount > 0'
            },
            {
                name: 'chk_base_amount',
                table: 'invoices',
                check: 'base_amount > 0'
            },
            {
                name: 'chk_tax_rate',
                table: 'invoices',
                check: 'tax_rate >= 0 AND tax_rate <= 100'
            }
        ];
        
        for (const constraint of constraints) {
            try {
                await new Promise((resolve, reject) => {
                    db.run(`
                        ALTER TABLE ${constraint.table} 
                        ADD CONSTRAINT ${constraint.name} 
                        CHECK (${constraint.check})
                    `, function(err) {
                        if (err) {
                            // Constraint mungkin sudah ada, skip
                            console.log(`   ⏭️  Constraint ${constraint.name} sudah ada atau tidak bisa ditambahkan`);
                            resolve();
                        } else {
                            console.log(`   ✅ Constraint ${constraint.name} ditambahkan`);
                            resolve();
                        }
                    });
                });
            } catch (error) {
                console.log(`   ⚠️  Gagal menambahkan constraint ${constraint.name}: ${error.message}`);
            }
        }
        
        // 3. Add indexes
        console.log('📈 Menambahkan indexes...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_collector_id ON collector_payments(collector_id)',
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_customer_id ON collector_payments(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_payment_date ON collector_payments(collected_at)'
        ];
        
        for (const indexSql of indexes) {
            try {
                await new Promise((resolve, reject) => {
                    db.run(indexSql, function(err) {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log('   ✅ Index ditambahkan');
            } catch (error) {
                console.log(`   ⚠️  Gagal menambahkan index: ${error.message}`);
            }
        }
        
        // 4. Validate data integrity
        console.log('🔍 Validasi integritas data...');
        
        const validations = [
            {
                name: 'Negative payment amounts',
                query: 'SELECT COUNT(*) as count FROM collector_payments WHERE payment_amount <= 0'
            },
            {
                name: 'Invalid commission rates',
                query: 'SELECT COUNT(*) as count FROM collectors WHERE commission_rate < 0 OR commission_rate > 100'
            },
            {
                name: 'Negative invoice amounts',
                query: 'SELECT COUNT(*) as count FROM invoices WHERE amount <= 0'
            }
        ];
        
        for (const validation of validations) {
            const result = await new Promise((resolve, reject) => {
                db.get(validation.query, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (result.count > 0) {
                console.log(`   ⚠️  ${validation.name}: ${result.count} records bermasalah`);
            } else {
                console.log(`   ✅ ${validation.name}: OK`);
            }
        }
        
        console.log('🎉 Cleanup database billing selesai!');
        
    } catch (error) {
        console.error('❌ Error selama cleanup:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Run cleanup if called directly
if (require.main === module) {
    runBillingCleanup()
        .then(() => {
            console.log('✅ Script selesai');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script gagal:', error);
            process.exit(1);
        });
}

module.exports = { runBillingCleanup };
