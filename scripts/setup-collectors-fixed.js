/**
 * Setup Collectors System - Fixed Version
 * Script untuk setup sistem tukang tagih dengan struktur yang sudah ada
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function setupCollectorsFixed() {
    try {
        console.log('🚀 Setting up collectors system (fixed version)...');
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Check existing structure
        console.log('📋 Checking existing collector tables...');
        
        // Check if we need to add missing columns to collector_payments
        const collectorPaymentsColumns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(collector_payments)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        const hasCustomerId = collectorPaymentsColumns.some(col => col.name === 'customer_id');
        const hasPaymentAmount = collectorPaymentsColumns.some(col => col.name === 'payment_amount');
        const hasCommissionAmount = collectorPaymentsColumns.some(col => col.name === 'commission_amount');
        
        console.log('📊 Current collector_payments columns:', collectorPaymentsColumns.map(c => c.name));
        console.log('🔍 Missing columns check:');
        console.log(`  - customer_id: ${hasCustomerId ? '✅' : '❌'}`);
        console.log(`  - payment_amount: ${hasPaymentAmount ? '✅' : '❌'}`);
        console.log(`  - commission_amount: ${hasCommissionAmount ? '✅' : '❌'}`);
        
        // Add missing columns if needed
        if (!hasCustomerId) {
            console.log('➕ Adding customer_id column...');
            await new Promise((resolve, reject) => {
                db.run('ALTER TABLE collector_payments ADD COLUMN customer_id INTEGER', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('✅ customer_id column added');
        }
        
        if (!hasPaymentAmount) {
            console.log('➕ Adding payment_amount column...');
            await new Promise((resolve, reject) => {
                db.run('ALTER TABLE collector_payments ADD COLUMN payment_amount DECIMAL(15,2)', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('✅ payment_amount column added');
        }
        
        if (!hasCommissionAmount) {
            console.log('➕ Adding commission_amount column...');
            await new Promise((resolve, reject) => {
                db.run('ALTER TABLE collector_payments ADD COLUMN commission_amount DECIMAL(15,2)', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('✅ commission_amount column added');
        }
        
        // Create indexes for new columns
        console.log('📊 Creating indexes...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_customer_id ON collector_payments(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_payment_date ON collector_payments(collected_at)'
        ];
        
        for (const indexSQL of indexes) {
            try {
                await new Promise((resolve, reject) => {
                    db.run(indexSQL, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log(`✅ Index created: ${indexSQL.split(' ')[5]}`);
            } catch (error) {
                console.log(`⚠️ Index already exists or error: ${error.message}`);
            }
        }
        
        // Insert sample collectors if not exist
        console.log('👥 Checking sample collectors...');
        const existingCollectors = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM collectors', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        if (existingCollectors === 0) {
            console.log('➕ Inserting sample collectors...');
            const sampleCollectors = [
                ['Ahmad Suryadi', '081234567890', 'ahmad@example.com', 'Jl. Merdeka No. 123, Jakarta', 5.00],
                ['Budi Santoso', '081234567891', 'budi@example.com', 'Jl. Sudirman No. 456, Jakarta', 5.00],
                ['Citra Dewi', '081234567892', 'citra@example.com', 'Jl. Thamrin No. 789, Jakarta', 5.00]
            ];
            
            for (const collector of sampleCollectors) {
                await new Promise((resolve, reject) => {
                    db.run(`
                        INSERT OR IGNORE INTO collectors (name, phone, email, address, commission_rate) 
                        VALUES (?, ?, ?, ?, ?)
                    `, collector, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            console.log('✅ Sample collectors inserted');
        } else {
            console.log(`✅ Collectors already exist (${existingCollectors} records)`);
        }
        
        // Final verification
        const finalColumns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(collector_payments)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        const finalCollectors = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM collectors', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('📊 Final collector_payments columns:', finalColumns.map(c => c.name));
        console.log(`👥 Total collectors: ${finalCollectors}`);
        
        db.close();
        
    } catch (error) {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    setupCollectorsFixed();
}

module.exports = setupCollectorsFixed;
