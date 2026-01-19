const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('Checking database at:', dbPath);

// Check if database file exists
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
    console.log('Database file does not exist');
    process.exit(1);
}

console.log('Database file exists');

// Connect to database and list tables
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    
    console.log('Connected to database');
    
    // Get all tables
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, rows) => {
        if (err) {
            console.error('Error querying tables:', err);
            db.close();
            return;
        }
        
        console.log('\nTables in database:');
        if (rows.length === 0) {
            console.log('No tables found');
        } else {
            rows.forEach(row => {
                console.log('- ' + row.name);
            });
        }
        
        // Check if voucher_online_settings table exists
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='voucher_online_settings'`, [], (err, row) => {
            if (err) {
                console.error('Error checking voucher_online_settings table:', err);
                db.close();
                return;
            }
            
            if (row) {
                console.log('\nChecking voucher_online_settings table structure:');
                db.all(`PRAGMA table_info(voucher_online_settings)`, [], (err, columns) => {
                    if (err) {
                        console.error('Error getting table info:', err);
                    } else {
                        console.log('Columns:');
                        columns.forEach(col => {
                            console.log(`- ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
                        });
                    }
                    
                    // Check data in table
                    db.all(`SELECT * FROM voucher_online_settings LIMIT 5`, [], (err, rows) => {
                        if (err) {
                            console.error('Error querying voucher_online_settings:', err);
                        } else {
                            console.log(`\nData in voucher_online_settings (${rows.length} rows):`);
                            rows.forEach(row => {
                                console.log(JSON.stringify(row, null, 2));
                            });
                        }
                        
                        // Also check some other important tables
                        checkCustomersTable(db);
                    });
                });
            } else {
                console.log('\nvoucher_online_settings table does not exist');
                // Check other important tables
                checkCustomersTable(db);
            }
        });
    });
});

function checkCustomersTable(db) {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='customers'`, [], (err, row) => {
        if (err) {
            console.error('Error checking customers table:', err);
            db.close();
            return;
        }
        
        if (row) {
            console.log('\nChecking customers table:');
            db.all(`SELECT COUNT(*) as count FROM customers`, [], (err, result) => {
                if (err) {
                    console.error('Error counting customers:', err);
                } else {
                    console.log(`Total customers: ${result[0].count}`);
                }
                
                checkTransactionsTable(db);
            });
        } else {
            console.log('\ncustomers table does not exist');
            checkTransactionsTable(db);
        }
    });
}

function checkTransactionsTable(db) {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'`, [], (err, row) => {
        if (err) {
            console.error('Error checking transactions table:', err);
            db.close();
            return;
        }
        
        if (row) {
            console.log('\nChecking transactions table:');
            db.all(`SELECT COUNT(*) as count FROM transactions`, [], (err, result) => {
                if (err) {
                    console.error('Error counting transactions:', err);
                } else {
                    console.log(`Total transactions: ${result[0].count}`);
                }
                
                checkPaymentNotificationsTable(db);
            });
        } else {
            console.log('\ntransactions table does not exist');
            checkPaymentNotificationsTable(db);
        }
    });
}

function checkPaymentNotificationsTable(db) {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='payment_notifications'`, [], (err, row) => {
        if (err) {
            console.error('Error checking payment_notifications table:', err);
            db.close();
            return;
        }
        
        if (row) {
            console.log('\nChecking payment_notifications table:');
            db.all(`SELECT COUNT(*) as count FROM payment_notifications`, [], (err, result) => {
                if (err) {
                    console.error('Error counting payment notifications:', err);
                } else {
                    console.log(`Total payment notifications: ${result[0].count}`);
                }
                
                checkConfigs(db);
            });
        } else {
            console.log('\npayment_notifications table does not exist');
            checkConfigs(db);
        }
    });
}

function checkConfigs(db) {
    // Check Midtrans config
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='midtrans_config'`, [], (err, row) => {
        if (err) {
            console.error('Error checking midtrans_config table:', err);
            db.close();
            return;
        }
        
        if (row) {
            console.log('\nChecking midtrans_config table:');
            db.all(`SELECT * FROM midtrans_config`, [], (err, rows) => {
                if (err) {
                    console.error('Error querying midtrans_config:', err);
                } else {
                    console.log(`Midtrans config entries: ${rows.length}`);
                    if (rows.length > 0) {
                        console.log('Sample config:', JSON.stringify(rows[0], null, 2));
                    }
                }
                
                // Check Tripay config
                db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='tripay_config'`, [], (err, row) => {
                    if (err) {
                        console.error('Error checking tripay_config table:', err);
                        db.close();
                        return;
                    }
                    
                    if (row) {
                        console.log('\nChecking tripay_config table:');
                        db.all(`SELECT * FROM tripay_config`, [], (err, rows) => {
                            if (err) {
                                console.error('Error querying tripay_config:', err);
                            } else {
                                console.log(`Tripay config entries: ${rows.length}`);
                                if (rows.length > 0) {
                                    console.log('Sample config:', JSON.stringify(rows[0], null, 2));
                                }
                            }
                            
                            db.close();
                        });
                    } else {
                        console.log('\ntripay_config table does not exist');
                        db.close();
                    }
                });
            });
        } else {
            console.log('\nmidtrans_config table does not exist');
            db.close();
        }
    });
}