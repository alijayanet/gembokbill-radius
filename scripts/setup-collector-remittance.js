const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Setting up collector remittance system...');

// Create collector_remittances table
db.run(`
    CREATE TABLE IF NOT EXISTS collector_remittances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collector_id INTEGER NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        notes TEXT,
        received_at DATETIME NOT NULL,
        received_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collector_id) REFERENCES collectors(id),
        FOREIGN KEY (received_by) REFERENCES admins(id)
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating collector_remittances table:', err.message);
    } else {
        console.log('✅ collector_remittances table created successfully');
    }
});

// Add remittance_status and remittance_id columns to collector_payments if they don't exist
db.run(`
    ALTER TABLE collector_payments ADD COLUMN remittance_status VARCHAR(20) DEFAULT NULL
`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
        console.error('❌ Error adding remittance_status column:', err.message);
    } else {
        console.log('✅ remittance_status column added to collector_payments');
    }
});

db.run(`
    ALTER TABLE collector_payments ADD COLUMN remittance_id INTEGER DEFAULT NULL
`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
        console.error('❌ Error adding remittance_id column:', err.message);
    } else {
        console.log('✅ remittance_id column added to collector_payments');
    }
});

// Create indexes for better performance
db.run(`
    CREATE INDEX IF NOT EXISTS idx_collector_remittances_collector_id 
    ON collector_remittances(collector_id)
`, (err) => {
    if (err) {
        console.error('❌ Error creating index on collector_remittances:', err.message);
    } else {
        console.log('✅ Index created on collector_remittances');
    }
});

db.run(`
    CREATE INDEX IF NOT EXISTS idx_collector_remittances_received_at 
    ON collector_remittances(received_at)
`, (err) => {
    if (err) {
        console.error('❌ Error creating index on collector_remittances:', err.message);
    } else {
        console.log('✅ Index created on collector_remittances');
    }
});

db.run(`
    CREATE INDEX IF NOT EXISTS idx_collector_payments_remittance_status 
    ON collector_payments(remittance_status)
`, (err) => {
    if (err) {
        console.error('❌ Error creating index on collector_payments:', err.message);
    } else {
        console.log('✅ Index created on collector_payments');
    }
});

db.close((err) => {
    if (err) {
        console.error('❌ Error closing database:', err.message);
    } else {
        console.log('✅ Database connection closed');
        console.log('🎉 Collector remittance system setup completed!');
        console.log('');
        console.log('📋 What was created:');
        console.log('   - collector_remittances table');
        console.log('   - remittance_status column in collector_payments');
        console.log('   - remittance_id column in collector_payments');
        console.log('   - Performance indexes');
        console.log('');
        console.log('🚀 You can now use the collector remittance feature!');
    }
});
