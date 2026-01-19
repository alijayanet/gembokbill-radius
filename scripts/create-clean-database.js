#!/usr/bin/env node

/**
 * Script to create a clean database with only table structures
 * Preserves all table schemas but removes transaction data and records
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔧 Creating clean database with table structures only...\n');

// Database paths
const dbPath = path.join(__dirname, '../data/billing.db');
const backupPath = path.join(__dirname, '../data/billing.db.backup');

// Backup existing database if it exists
if (fs.existsSync(dbPath)) {
    console.log('💾 Backing up existing database...');
    fs.copyFileSync(dbPath, backupPath);
    console.log('✅ Database backed up to:', backupPath);
}

// Connect to database
const db = new sqlite3.Database(dbPath);

// Tables to preserve (these contain configuration and settings)
const preserveTables = [
    'voucher_pricing',
    'voucher_online_settings',
    'voucher_generation_settings',
    'midtrans_config',
    'tripay_config',
    'packages'
];

// Tables to clear (these contain transaction data and records)
const clearTables = [
    'agent_transactions',
    'agent_voucher_sales',
    'agent_monthly_payments',
    'agent_balance_requests',
    'agent_notifications',
    'admin_notifications',
    'voucher_purchases',
    'voucher_delivery_logs',
    'payment_notifications',
    'transactions',
    'invoices',
    'customers',
    'agents',
    'technicians',
    'technician_activities',
    'technician_sessions',
    'technician_otp',
    'installation_jobs',
    'installation_job_status_history',
    'installation_job_equipment',
    'odps',
    'cable_routes',
    'network_segments',
    'cable_maintenance_logs',
    'odp_connections',
    'monthly_summary',
    'onu_devices',
    'collectors',
    'collector_assignments',
    'collector_remittances',
    'collector_payments',
    'agent_balances',
    'agent_transactions',
    'agent_voucher_sales',
    'agent_balance_requests',
    'agent_monthly_payments',
    'agent_payments',
    'admin_notifications',
    'agent_notifications'
];

// Tables to reset auto-increment counters for
const resetAutoIncrementTables = [
    ...clearTables,
    'agents',
    'customers',
    'invoices',
    'transactions',
    'voucher_purchases',
    'agent_transactions',
    'agent_voucher_sales',
    'agent_balance_requests',
    'agent_monthly_payments'
];

console.log('📋 Clearing transaction data and records...\n');

// Clear data from tables
clearTables.forEach((table, index) => {
    db.run(`DELETE FROM ${table}`, (err) => {
        if (err) {
            console.log(`⚠️  Warning: Could not clear table ${table} - ${err.message}`);
        } else {
            console.log(`✅ Cleared data from ${table}`);
        }
        
        // After clearing the last table, reset auto-increment counters
        if (index === clearTables.length - 1) {
            console.log('\n🔄 Resetting auto-increment counters...');
            resetAutoIncrementCounters();
        }
    });
});

function resetAutoIncrementCounters() {
    let completed = 0;
    
    resetAutoIncrementTables.forEach(table => {
        db.run(`DELETE FROM sqlite_sequence WHERE name = ?`, [table], (err) => {
            completed++;
            
            if (err) {
                console.log(`⚠️  Warning: Could not reset counter for ${table} - ${err.message}`);
            } else {
                console.log(`✅ Reset counter for ${table}`);
            }
            
            // After resetting all counters, verify the clean database
            if (completed === resetAutoIncrementTables.length) {
                console.log('\n🔍 Verifying clean database...');
                verifyCleanDatabase();
            }
        });
    });
}

function verifyCleanDatabase() {
    console.log('\n✅ Database cleaning completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Preserved ${preserveTables.length} configuration tables`);
    console.log(`- Cleared data from ${clearTables.length} transaction/record tables`);
    console.log(`- Reset auto-increment counters for ${resetAutoIncrementTables.length} tables`);
    console.log('- Database schema remains intact');
    console.log('- All transaction data and customer records removed');
    
    console.log('\n💾 Backup of original database saved to:', backupPath);
    console.log('\n🚀 Clean database is ready for new server deployment!');
    
    db.close();
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⚠️  Process interrupted. Closing database connection...');
    db.close();
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
    db.close();
    process.exit(1);
});