#!/usr/bin/env node

/**
 * Script to migrate data from old database while preserving existing data
 * This script can be used when upgrading from an older version
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrateFromOldDatabase() {
    console.log('🔄 Starting migration from old database...');
    
    // Paths to databases
    const oldDbPath = path.join(__dirname, '../data/old_billing.db');  // Old database
    const currentDbPath = path.join(__dirname, '../data/billing.db'); // Current database
    
    // Check if old database exists
    if (!require('fs').existsSync(oldDbPath)) {
        console.log('ℹ️  Old database not found. Running normal migrations...');
        const { execSync } = require('child_process');
        execSync('node scripts/run-voucher-online-settings-migrations.js', { stdio: 'inherit' });
        return;
    }
    
    const oldDb = new sqlite3.Database(oldDbPath);
    const currentDb = new sqlite3.Database(currentDbPath);
    
    try {
        // 1. First run normal migrations to ensure schema is up to date
        console.log('🔧 Ensuring current schema is up to date...');
        const { execSync } = require('child_process');
        execSync('node scripts/run-voucher-online-settings-migrations.js', { stdio: 'inherit' });
        
        // 2. Migrate specific data from old database
        console.log('📋 Migrating data from old database...');
        
        // Example: Migrate voucher online settings
        await migrateVoucherSettings(oldDb, currentDb);
        
        // Example: Migrate customer data (if needed)
        await migrateCustomerData(oldDb, currentDb);
        
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        oldDb.close();
        currentDb.close();
    }
}

async function migrateVoucherSettings(oldDb, currentDb) {
    return new Promise((resolve, reject) => {
        console.log('📦 Migrating voucher online settings...');
        
        // Get settings from old database
        oldDb.all('SELECT * FROM voucher_online_settings', (err, oldSettings) => {
            if (err) {
                console.log('⚠️  No voucher settings found in old database');
                resolve();
                return;
            }
            
            // Update current database with old settings
            const updatePromises = oldSettings.map(setting => {
                return new Promise((resolveUpdate, rejectUpdate) => {
                    const sql = `
                        INSERT OR REPLACE INTO voucher_online_settings 
                        (package_id, name, profile, digits, enabled, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                    `;
                    currentDb.run(sql, [
                        setting.package_id,
                        setting.name || `${setting.package_id} - Paket`,
                        setting.profile,
                        setting.digits || 5,
                        setting.enabled || 1,
                        setting.created_at || new Date().toISOString()
                    ], function(err) {
                        if (err) {
                            console.error(`❌ Failed to migrate setting ${setting.package_id}:`, err.message);
                            rejectUpdate(err);
                        } else {
                            console.log(`✅ Migrated setting: ${setting.package_id}`);
                            resolveUpdate();
                        }
                    });
                });
            });
            
            Promise.all(updatePromises)
                .then(() => {
                    console.log('✅ Voucher settings migration completed');
                    resolve();
                })
                .catch(reject);
        });
    });
}

async function migrateCustomerData(oldDb, currentDb) {
    return new Promise((resolve, reject) => {
        console.log('👥 Migrating customer data...');
        
        // Check if customers table exists in old database
        oldDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'", (err, tables) => {
            if (err || tables.length === 0) {
                console.log('⚠️  No customers table found in old database');
                resolve();
                return;
            }
            
            // Get customers from old database
            oldDb.all('SELECT * FROM customers', (err, customers) => {
                if (err) {
                    console.log('⚠️  Error reading customers from old database');
                    resolve();
                    return;
                }
                
                if (customers.length === 0) {
                    console.log('ℹ️  No customer data to migrate');
                    resolve();
                    return;
                }
                
                console.log(`📦 Found ${customers.length} customers to migrate`);
                
                // Insert customers into current database
                let migratedCount = 0;
                customers.forEach(customer => {
                    const sql = `
                        INSERT OR IGNORE INTO customers 
                        (name, phone, address, package_id, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;
                    currentDb.run(sql, [
                        customer.name,
                        customer.phone,
                        customer.address,
                        customer.package_id,
                        customer.status || 'active',
                        customer.created_at || new Date().toISOString(),
                        customer.updated_at || new Date().toISOString()
                    ], function(err) {
                        if (err) {
                            console.error(`❌ Failed to migrate customer ${customer.name}:`, err.message);
                        } else {
                            migratedCount++;
                            if (migratedCount === customers.length) {
                                console.log(`✅ Migrated ${migratedCount} customers`);
                                resolve();
                            }
                        }
                    });
                });
            });
        });
    });
}

// Run if called directly
if (require.main === module) {
    migrateFromOldDatabase()
        .then(() => {
            console.log('🎉 Migration script completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = migrateFromOldDatabase;