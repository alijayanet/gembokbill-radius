const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Function to check database tables
function checkDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Check if all required tables exist
            const tables = [
                'voucher_online_settings',
                'customers',
                'transactions',
                'payment_notifications',
                'midtrans_config',
                'tripay_config'
            ];
            
            let tableChecks = [];
            
            tables.forEach(table => {
                tableChecks.push(new Promise((tableResolve, tableReject) => {
                    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table], (err, row) => {
                        if (err) {
                            tableReject(err);
                        } else if (row) {
                            tableResolve({ table, exists: true });
                        } else {
                            tableResolve({ table, exists: false });
                        }
                    });
                }));
            });
            
            Promise.all(tableChecks)
                .then(results => {
                    db.close();
                    resolve(results);
                })
                .catch(err => {
                    db.close();
                    reject(err);
                });
        });
    });
}

// Function to check voucher online settings data
function checkVoucherSettings() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            db.all(`SELECT * FROM voucher_online_settings`, [], (err, rows) => {
                if (err) {
                    db.close();
                    reject(err);
                } else {
                    db.close();
                    resolve(rows);
                }
            });
        });
    });
}

// Function to check if required files exist
function checkRequiredFiles() {
    const requiredFiles = [
        'views/adminHotspot.ejs',
        'views/admin.ejs',
        'views/adminPayment.ejs',
        'views/adminVoucher.ejs',
        'views/dashboard.ejs',
        'views/login.ejs',
        'views/print.ejs',
        'routes/adminHotspot.js',
        'routes/admin.js',
        'routes/adminPayment.js',
        'routes/adminVoucher.js',
        'routes/auth.js',
        'routes/dashboard.js',
        'routes/mikrotik.js',
        'routes/payment.js',
        'routes/print.js',
        'public/css/style.css',
        'public/js/script.js'
    ];
    
    const results = [];
    
    requiredFiles.forEach(file => {
        const fullPath = path.join(__dirname, '..', file);
        const exists = fs.existsSync(fullPath);
        results.push({ file, exists });
    });
    
    return results;
}

// Function to check if required directories exist
function checkRequiredDirectories() {
    const requiredDirs = [
        'views',
        'routes',
        'public',
        'public/css',
        'public/js',
        'migrations',
        'scripts'
    ];
    
    const results = [];
    
    requiredDirs.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        const exists = fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory();
        results.push({ directory: dir, exists });
    });
    
    return results;
}

// Function to check Mikrotik integration
function checkMikrotikIntegration() {
    // This would normally check if Mikrotik connection is working
    // For now, we'll just check if the required config exists
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            db.get(`SELECT * FROM voucher_online_settings LIMIT 1`, [], (err, row) => {
                if (err) {
                    db.close();
                    reject(err);
                } else {
                    db.close();
                    resolve({ mikrotikIntegration: row ? 'Configured' : 'Not configured' });
                }
            });
        });
    });
}

// Function to check payment gateways
function checkPaymentGateways() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const gateways = ['midtrans_config', 'tripay_config'];
            let gatewayChecks = [];
            
            gateways.forEach(gateway => {
                gatewayChecks.push(new Promise((gatewayResolve, gatewayReject) => {
                    db.get(`SELECT COUNT(*) as count FROM ${gateway}`, [], (err, row) => {
                        if (err) {
                            gatewayReject(err);
                        } else {
                            gatewayResolve({ gateway, configured: row.count > 0 });
                        }
                    });
                }));
            });
            
            Promise.all(gatewayChecks)
                .then(results => {
                    db.close();
                    resolve(results);
                })
                .catch(err => {
                    db.close();
                    reject(err);
                });
        });
    });
}

// Main function to run all checks
async function runComprehensiveCheck() {
    console.log('=== Comprehensive Application Status Check ===\n');
    
    try {
        // Check directories
        console.log('1. Checking required directories...');
        const dirResults = checkRequiredDirectories();
        const missingDirs = dirResults.filter(d => !d.exists);
        if (missingDirs.length === 0) {
            console.log('   ✓ All required directories exist');
        } else {
            console.log('   ✗ Missing directories:');
            missingDirs.forEach(d => console.log(`     - ${d.directory}`));
        }
        console.log();
        
        // Check files
        console.log('2. Checking required files...');
        const fileResults = checkRequiredFiles();
        const missingFiles = fileResults.filter(f => !f.exists);
        if (missingFiles.length === 0) {
            console.log('   ✓ All required files exist');
        } else {
            console.log('   ✗ Missing files:');
            missingFiles.forEach(f => console.log(`     - ${f.file}`));
        }
        console.log();
        
        // Check database
        console.log('3. Checking database tables...');
        const tableResults = await checkDatabase();
        const missingTables = tableResults.filter(t => !t.exists);
        if (missingTables.length === 0) {
            console.log('   ✓ All required database tables exist');
        } else {
            console.log('   ✗ Missing tables:');
            missingTables.forEach(t => console.log(`     - ${t.table}`));
        }
        console.log();
        
        // Check voucher settings
        console.log('4. Checking voucher online settings...');
        const voucherSettings = await checkVoucherSettings();
        if (voucherSettings.length > 0) {
            console.log(`   ✓ Voucher settings found (${voucherSettings.length} records)`);
            console.log('   Sample settings:');
            voucherSettings.slice(0, 3).forEach(setting => {
                console.log(`     - Package: ${setting.package_id}, Name: ${setting.name}, Price: ${setting.price}`);
            });
        } else {
            console.log('   ⚠ No voucher settings found');
        }
        console.log();
        
        // Check Mikrotik integration
        console.log('5. Checking Mikrotik integration...');
        const mikrotikStatus = await checkMikrotikIntegration();
        console.log(`   ${mikrotikStatus.mikrotikIntegration}`);
        console.log();
        
        // Check payment gateways
        console.log('6. Checking payment gateways...');
        const gatewayResults = await checkPaymentGateways();
        gatewayResults.forEach(gateway => {
            const status = gateway.configured ? 'Configured' : 'Not configured';
            console.log(`   ${gateway.gateway}: ${status}`);
        });
        console.log();
        
        console.log('=== Status Check Complete ===');
        
    } catch (error) {
        console.error('Error during comprehensive check:', error);
    }
}

// Run the check
runComprehensiveCheck();