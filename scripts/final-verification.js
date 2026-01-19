const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('=== Final Application Verification ===\n');

// Function to check if database file exists and has data
function checkDatabase() {
    return new Promise((resolve, reject) => {
        console.log('1. Checking database file...');
        
        if (!fs.existsSync(dbPath)) {
            console.log('   ✗ Database file does not exist');
            resolve(false);
            return;
        }
        
        console.log('   ✓ Database file exists');
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log('   ✗ Error connecting to database:', err.message);
                resolve(false);
                return;
            }
            
            // Check if required tables exist
            const requiredTables = [
                'voucher_online_settings',
                'customers',
                'voucher_pricing'
            ];
            
            let tableChecks = [];
            
            requiredTables.forEach(table => {
                tableChecks.push(new Promise((tableResolve) => {
                    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table], (err, row) => {
                        if (err || !row) {
                            tableResolve({ table, exists: false });
                        } else {
                            tableResolve({ table, exists: true });
                        }
                    });
                }));
            });
            
            Promise.all(tableChecks)
                .then(results => {
                    const missingTables = results.filter(r => !r.exists);
                    if (missingTables.length === 0) {
                        console.log('   ✓ All required tables exist');
                        
                        // Check voucher_online_settings data
                        db.all(`SELECT * FROM voucher_online_settings`, [], (err, rows) => {
                            if (err) {
                                console.log('   ⚠ Error querying voucher_online_settings:', err.message);
                                db.close();
                                resolve(true);
                            } else {
                                console.log(`   ✓ voucher_online_settings table has ${rows.length} records`);
                                if (rows.length > 0) {
                                    console.log('     Sample records:');
                                    rows.slice(0, 3).forEach(row => {
                                        console.log(`       - ${row.package_id}: ${row.name} (${row.profile})`);
                                    });
                                }
                                db.close();
                                resolve(true);
                            }
                        });
                    } else {
                        console.log('   ✗ Missing tables:');
                        missingTables.forEach(t => console.log(`     - ${t.table}`));
                        db.close();
                        resolve(false);
                    }
                })
                .catch(() => {
                    db.close();
                    resolve(false);
                });
        });
    });
}

// Function to check if required files exist
function checkRequiredFiles() {
    console.log('\n2. Checking required files...');
    
    const requiredFiles = [
        'views/adminHotspot.ejs',
        'views/adminVoucher.ejs',
        'views/dashboard.ejs',
        'views/login.ejs',
        'routes/adminHotspot.js',
        'routes/adminDashboard.js',
        'routes/adminVoucherPricing.js',
        'public/css/style.css'
    ];
    
    let allExist = true;
    
    requiredFiles.forEach(file => {
        const fullPath = path.join(__dirname, '..', file);
        if (fs.existsSync(fullPath)) {
            console.log(`   ✓ ${file}`);
        } else {
            console.log(`   ✗ ${file}`);
            allExist = false;
        }
    });
    
    return allExist;
}

// Function to check if required directories exist
function checkRequiredDirectories() {
    console.log('\n3. Checking required directories...');
    
    const requiredDirs = [
        'views',
        'routes',
        'public',
        'public/css',
        'public/js',
        'data'
    ];
    
    let allExist = true;
    
    requiredDirs.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
            console.log(`   ✓ ${dir}`);
        } else {
            console.log(`   ✗ ${dir}`);
            allExist = false;
        }
    });
    
    return allExist;
}

// Function to check package.json
function checkPackageJson() {
    console.log('\n4. Checking package.json...');
    
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packagePath)) {
        console.log('   ✗ package.json does not exist');
        return false;
    }
    
    try {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log('   ✓ package.json exists and is valid');
        console.log(`   ✓ Application name: ${packageData.name || 'N/A'}`);
        console.log(`   ✓ Version: ${packageData.version || 'N/A'}`);
        return true;
    } catch (err) {
        console.log('   ✗ package.json is invalid:', err.message);
        return false;
    }
}

// Function to check settings.json
function checkSettings() {
    console.log('\n5. Checking settings.json...');
    
    const settingsPath = path.join(__dirname, '..', 'settings.json');
    if (!fs.existsSync(settingsPath)) {
        console.log('   ✗ settings.json does not exist');
        return false;
    }
    
    try {
        const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        console.log('   ✓ settings.json exists and is valid');
        console.log(`   ✓ Company header: ${settingsData.company_header || 'N/A'}`);
        console.log(`   ✓ Server port: ${settingsData.server_port || 'N/A'}`);
        return true;
    } catch (err) {
        console.log('   ✗ settings.json is invalid:', err.message);
        return false;
    }
}

// Function to check Mikrotik configuration
function checkMikrotikConfig() {
    console.log('\n6. Checking Mikrotik configuration...');
    
    const settingsPath = path.join(__dirname, '..', 'settings.json');
    if (!fs.existsSync(settingsPath)) {
        console.log('   ⚠ settings.json not found, cannot check Mikrotik config');
        return false;
    }
    
    try {
        const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const hasMikrotikConfig = settingsData.mikrotik_host && settingsData.mikrotik_user && settingsData.mikrotik_password;
        
        if (hasMikrotikConfig) {
            console.log('   ✓ Mikrotik configuration exists');
            console.log(`     Host: ${settingsData.mikrotik_host || 'N/A'}`);
            console.log(`     User: ${settingsData.mikrotik_user || 'N/A'}`);
            // Don't show password for security
        } else {
            console.log('   ⚠ Mikrotik configuration incomplete');
        }
        
        return true;
    } catch (err) {
        console.log('   ✗ Error reading settings.json:', err.message);
        return false;
    }
}

// Main verification function
async function runFinalVerification() {
    try {
        // Check directories
        const dirsOk = checkRequiredDirectories();
        
        // Check files
        const filesOk = checkRequiredFiles();
        
        // Check database
        const dbOk = await checkDatabase();
        
        // Check package.json
        const packageOk = checkPackageJson();
        
        // Check settings.json
        const settingsOk = checkSettings();
        
        // Check Mikrotik config
        const mikrotikOk = checkMikrotikConfig();
        
        console.log('\n=== Verification Summary ===');
        console.log(`Directories: ${dirsOk ? '✓' : '✗'}`);
        console.log(`Files: ${filesOk ? '✓' : '✗'}`);
        console.log(`Database: ${dbOk ? '✓' : '✗'}`);
        console.log(`Package.json: ${packageOk ? '✓' : '✗'}`);
        console.log(`Settings.json: ${settingsOk ? '✓' : '✗'}`);
        console.log(`Mikrotik Config: ${mikrotikOk ? '✓' : '⚠'}`);
        
        const allCriticalOk = dirsOk && filesOk && dbOk && packageOk && settingsOk;
        
        if (allCriticalOk) {
            console.log('\n🎉 ALL CRITICAL COMPONENTS ARE WORKING CORRECTLY');
            console.log('The application should be ready to run normally.');
        } else {
            console.log('\n❌ SOME CRITICAL COMPONENTS HAVE ISSUES');
            console.log('Please check the errors above and fix them before running the application.');
        }
        
    } catch (error) {
        console.error('Error during verification:', error.message);
    }
}

// Run the verification
runFinalVerification();