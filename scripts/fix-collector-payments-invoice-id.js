const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing collector_payments invoice_id constraint...');

// Check current table structure
db.get("PRAGMA table_info(collector_payments)", (err, row) => {
    if (err) {
        console.error('❌ Error checking table structure:', err.message);
        return;
    }
    
    console.log('📋 Current collector_payments table structure:');
    db.all("PRAGMA table_info(collector_payments)", (err, rows) => {
        if (err) {
            console.error('❌ Error getting table info:', err.message);
            return;
        }
        
        rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.type} (nullable: ${row.notnull === 0 ? 'YES' : 'NO'})`);
        });
        
        // Check if invoice_id column exists and is NOT NULL
        const invoiceIdColumn = rows.find(row => row.name === 'invoice_id');
        if (invoiceIdColumn && invoiceIdColumn.notnull === 1) {
            console.log('⚠️  invoice_id column is NOT NULL, need to make it nullable...');
            
            // Create new table with nullable invoice_id
            db.run(`
                CREATE TABLE collector_payments_new (
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
                    console.error('❌ Error creating new table:', err.message);
                    return;
                }
                
                console.log('✅ New table created with nullable invoice_id');
                
                // Copy data from old table to new table
                db.run(`
                    INSERT INTO collector_payments_new 
                    SELECT * FROM collector_payments
                `, (err) => {
                    if (err) {
                        console.error('❌ Error copying data:', err.message);
                        return;
                    }
                    
                    console.log('✅ Data copied to new table');
                    
                    // Drop old table
                    db.run(`DROP TABLE collector_payments`, (err) => {
                        if (err) {
                            console.error('❌ Error dropping old table:', err.message);
                            return;
                        }
                        
                        console.log('✅ Old table dropped');
                        
                        // Rename new table
                        db.run(`ALTER TABLE collector_payments_new RENAME TO collector_payments`, (err) => {
                            if (err) {
                                console.error('❌ Error renaming table:', err.message);
                                return;
                            }
                            
                            console.log('✅ Table renamed successfully');
                            
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
        } else {
            console.log('✅ invoice_id column is already nullable or does not exist');
            db.close();
        }
    });
});
