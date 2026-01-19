/**
 * Setup Collectors System - Safe Version
 * Script untuk setup sistem tukang tagih dengan pengecekan yang aman
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function setupCollectorsSafe() {
    try {
        console.log('🚀 Setting up collectors system (safe mode)...');
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Check if tables already exist
        const existingTables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%collector%'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        console.log('📋 Existing collector tables:', existingTables.map(t => t.name));
        
        // Create collectors table if not exists
        if (!existingTables.some(t => t.name === 'collectors')) {
            console.log('📝 Creating collectors table...');
            await new Promise((resolve, reject) => {
                db.run(`
                    CREATE TABLE collectors (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        phone TEXT UNIQUE NOT NULL,
                        email TEXT,
                        address TEXT,
                        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
                        commission_rate DECIMAL(5,2) DEFAULT 5.00,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('✅ Collectors table created');
        } else {
            console.log('✅ Collectors table already exists');
        }
        
        // Create collector_payments table if not exists
        if (!existingTables.some(t => t.name === 'collector_payments')) {
            console.log('📝 Creating collector_payments table...');
            await new Promise((resolve, reject) => {
                db.run(`
                    CREATE TABLE collector_payments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        collector_id INTEGER NOT NULL,
                        customer_id INTEGER NOT NULL,
                        invoice_id INTEGER,
                        payment_amount DECIMAL(15,2) NOT NULL,
                        commission_amount DECIMAL(15,2) NOT NULL,
                        payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'transfer', 'other')),
                        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                        notes TEXT,
                        status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'cancelled')),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (collector_id) REFERENCES collectors(id),
                        FOREIGN KEY (customer_id) REFERENCES customers(id),
                        FOREIGN KEY (invoice_id) REFERENCES invoices(id)
                    )
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('✅ Collector_payments table created');
        } else {
            console.log('✅ Collector_payments table already exists');
        }
        
        // Create collector_assignments table if not exists
        if (!existingTables.some(t => t.name === 'collector_assignments')) {
            console.log('📝 Creating collector_assignments table...');
            await new Promise((resolve, reject) => {
                db.run(`
                    CREATE TABLE collector_assignments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        collector_id INTEGER NOT NULL,
                        customer_id INTEGER NOT NULL,
                        assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
                        notes TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (collector_id) REFERENCES collectors(id),
                        FOREIGN KEY (customer_id) REFERENCES customers(id),
                        UNIQUE(collector_id, customer_id)
                    )
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('✅ Collector_assignments table created');
        } else {
            console.log('✅ Collector_assignments table already exists');
        }
        
        // Create indexes
        console.log('📊 Creating indexes...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_collectors_phone ON collectors(phone)',
            'CREATE INDEX IF NOT EXISTS idx_collectors_status ON collectors(status)',
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_collector_id ON collector_payments(collector_id)',
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_customer_id ON collector_payments(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_invoice_id ON collector_payments(invoice_id)',
            'CREATE INDEX IF NOT EXISTS idx_collector_payments_payment_date ON collector_payments(payment_date)',
            'CREATE INDEX IF NOT EXISTS idx_collector_assignments_collector_id ON collector_assignments(collector_id)',
            'CREATE INDEX IF NOT EXISTS idx_collector_assignments_customer_id ON collector_assignments(customer_id)'
        ];
        
        for (const indexSQL of indexes) {
            await new Promise((resolve, reject) => {
                db.run(indexSQL, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        console.log('✅ Indexes created');
        
        // Create triggers
        console.log('🔧 Creating triggers...');
        const triggers = [
            `CREATE TRIGGER IF NOT EXISTS update_collectors_updated_at
                AFTER UPDATE ON collectors
                FOR EACH ROW
            BEGIN
                UPDATE collectors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END`,
            `CREATE TRIGGER IF NOT EXISTS update_collector_payments_updated_at
                AFTER UPDATE ON collector_payments
                FOR EACH ROW
            BEGIN
                UPDATE collector_payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END`,
            `CREATE TRIGGER IF NOT EXISTS update_collector_assignments_updated_at
                AFTER UPDATE ON collector_assignments
                FOR EACH ROW
            BEGIN
                UPDATE collector_assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END`
        ];
        
        for (const triggerSQL of triggers) {
            await new Promise((resolve, reject) => {
                db.run(triggerSQL, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        console.log('✅ Triggers created');
        
        // Insert sample data
        console.log('👥 Inserting sample collectors...');
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
        
        // Verify setup
        const finalTables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%collector%'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        const collectorCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM collectors", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('📊 Final tables:', finalTables.map(t => t.name));
        console.log(`👥 Total collectors: ${collectorCount}`);
        
        db.close();
        
    } catch (error) {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    setupCollectorsSafe();
}

module.exports = setupCollectorsSafe;
