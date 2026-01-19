const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Making invoice_id nullable in collector_payments...');

// First, let's check if we can simply alter the column
db.run(`ALTER TABLE collector_payments ALTER COLUMN invoice_id DROP NOT NULL`, (err) => {
    if (err) {
        console.log('⚠️  Direct ALTER not supported, using backup/restore method...');
        
        // Create backup table
        db.run(`
            CREATE TABLE collector_payments_backup AS 
            SELECT * FROM collector_payments
        `, (err) => {
            if (err) {
                console.error('❌ Error creating backup:', err.message);
                return;
            }
            
            console.log('✅ Backup table created');
            
            // Drop original table
            db.run(`DROP TABLE collector_payments`, (err) => {
                if (err) {
                    console.error('❌ Error dropping original table:', err.message);
                    return;
                }
                
                console.log('✅ Original table dropped');
                
                // Recreate table with nullable invoice_id
                db.run(`
                    CREATE TABLE collector_payments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        collector_id INTEGER NOT NULL,
                        invoice_id INTEGER NULL,
                        amount DECIMAL(10,2) NOT NULL,
                        payment_method TEXT,
                        reference_number TEXT,
                        notes TEXT,
                        collected_at DATETIME,
                        verified_by INTEGER,
                        verified_at DATETIME,
                        status TEXT,
                        created_at DATETIME,
                        customer_id INTEGER,
                        payment_amount DECIMAL(15,2),
                        commission_amount DECIMAL(15,2),
                        remittance_status VARCHAR(20),
                        remittance_id INTEGER
                    )
                `, (err) => {
                    if (err) {
                        console.error('❌ Error recreating table:', err.message);
                        return;
                    }
                    
                    console.log('✅ New table created with nullable invoice_id');
                    
                    // Restore data
                    db.run(`
                        INSERT INTO collector_payments 
                        SELECT * FROM collector_payments_backup
                    `, (err) => {
                        if (err) {
                            console.error('❌ Error restoring data:', err.message);
                            return;
                        }
                        
                        console.log('✅ Data restored');
                        
                        // Drop backup table
                        db.run(`DROP TABLE collector_payments_backup`, (err) => {
                            if (err) {
                                console.error('❌ Error dropping backup:', err.message);
                            } else {
                                console.log('✅ Backup table dropped');
                            }
                            
                            // Recreate indexes
                            db.run(`
                                CREATE INDEX IF NOT EXISTS idx_collector_payments_collector_id 
                                ON collector_payments(collector_id)
                            `, (err) => {
                                if (err) {
                                    console.error('❌ Error creating index:', err.message);
                                } else {
                                    console.log('✅ Index recreated');
                                }
                                
                                db.close((err) => {
                                    if (err) {
                                        console.error('❌ Error closing database:', err.message);
                                    } else {
                                        console.log('🎉 Fix completed successfully!');
                                        console.log('✅ invoice_id column is now nullable');
                                        console.log('✅ Collector payments can now be recorded without invoice_id');
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    } else {
        console.log('✅ invoice_id column made nullable successfully');
        db.close();
    }
});
