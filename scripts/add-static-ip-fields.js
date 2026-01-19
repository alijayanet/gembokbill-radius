#!/usr/bin/env node

/**
 * Script untuk menambahkan field static_ip dan mac_address ke tabel customers
 * untuk mendukung sistem isolir IP statik
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/billing.db');

function addStaticIPFields() {
    return new Promise((resolve, reject) => {
        // Pastikan database exists
        if (!fs.existsSync(dbPath)) {
            reject(new Error('Database billing.db tidak ditemukan!'));
            return;
        }

        const db = new sqlite3.Database(dbPath);
        
        console.log('🔍 Checking existing table structure...');
        
        // Cek struktur tabel customers saat ini
        db.all("PRAGMA table_info(customers)", (err, columns) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('📋 Current customers table columns:');
            columns.forEach(col => {
                console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
            });
            
            // Cek apakah field sudah ada
            const hasStaticIP = columns.some(col => col.name === 'static_ip');
            const hasMacAddress = columns.some(col => col.name === 'mac_address');
            const hasAssignedIP = columns.some(col => col.name === 'assigned_ip');
            
            const alterStatements = [];
            
            // Tambahkan field yang belum ada
            if (!hasStaticIP) {
                alterStatements.push("ALTER TABLE customers ADD COLUMN static_ip TEXT");
                console.log('➕ Will add static_ip field');
            } else {
                console.log('✅ static_ip field already exists');
            }
            
            if (!hasMacAddress) {
                alterStatements.push("ALTER TABLE customers ADD COLUMN mac_address TEXT");
                console.log('➕ Will add mac_address field');
            } else {
                console.log('✅ mac_address field already exists');
            }
            
            if (!hasAssignedIP) {
                alterStatements.push("ALTER TABLE customers ADD COLUMN assigned_ip TEXT");
                console.log('➕ Will add assigned_ip field');
            } else {
                console.log('✅ assigned_ip field already exists');
            }
            
            if (alterStatements.length === 0) {
                console.log('✅ All static IP fields already exist, no changes needed');
                db.close();
                resolve({ changed: false, message: 'No changes needed' });
                return;
            }
            
            // Eksekusi ALTER statements
            console.log(`\n🔧 Executing ${alterStatements.length} ALTER statements...`);
            
            let completed = 0;
            const errors = [];
            
            alterStatements.forEach((statement, index) => {
                db.run(statement, function(err) {
                    if (err) {
                        console.error(`❌ Error executing: ${statement}`);
                        console.error(`   ${err.message}`);
                        errors.push({ statement, error: err.message });
                    } else {
                        console.log(`✅ Executed: ${statement}`);
                    }
                    
                    completed++;
                    
                    if (completed === alterStatements.length) {
                        if (errors.length > 0) {
                            console.log(`\n⚠️ Completed with ${errors.length} errors:`);
                            errors.forEach(e => console.log(`   - ${e.error}`));
                            db.close();
                            reject(new Error(`${errors.length} errors occurred`));
                        } else {
                            console.log('\n✅ All ALTER statements executed successfully!');
                            
                            // Verifikasi perubahan
                            db.all("PRAGMA table_info(customers)", (err, newColumns) => {
                                if (err) {
                                    console.error('Error verifying changes:', err.message);
                                    db.close();
                                    reject(err);
                                    return;
                                }
                                
                                console.log('\n📋 Updated customers table columns:');
                                newColumns.forEach(col => {
                                    const isNew = !columns.some(oldCol => oldCol.name === col.name);
                                    const marker = isNew ? '🆕' : '   ';
                                    console.log(`${marker} ${col.name}: ${col.type}`);
                                });
                                
                                console.log('\n🎉 Static IP fields added successfully!');
                                console.log('\n📝 Usage instructions:');
                                console.log('   - static_ip: Primary IP address untuk pelanggan IP statik');
                                console.log('   - assigned_ip: IP address yang di-assign (bisa berbeda dari static_ip)');
                                console.log('   - mac_address: MAC address untuk DHCP-based isolation');
                                console.log('\n⚙️ Configure suspension method in settings.json:');
                                console.log('   "static_ip_suspension_method": "address_list" | "dhcp_block" | "bandwidth_limit" | "firewall_rule"');
                                
                                db.close();
                                resolve({ 
                                    changed: true, 
                                    fieldsAdded: alterStatements.length,
                                    message: 'Static IP fields added successfully'
                                });
                            });
                        }
                    }
                });
            });
        });
    });
}

// Main execution
if (require.main === module) {
    console.log('🚀 Starting Static IP Fields Migration...\n');
    
    addStaticIPFields()
        .then(result => {
            console.log(`\n✅ Migration completed: ${result.message}`);
            process.exit(0);
        })
        .catch(error => {
            console.error(`\n❌ Migration failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { addStaticIPFields };
