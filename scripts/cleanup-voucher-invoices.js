#!/usr/bin/env node

/**
 * Script untuk membersihkan invoice voucher yang expired
 * Menghapus invoice voucher yang tidak dibayar setelah waktu tertentu
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { getSetting } = require('../config/settings');

// Path ke database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🧹 Memulai cleanup invoice voucher expired...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

// Ambil konfigurasi dari settings
const cleanupEnabled = getSetting('voucher_cleanup.enabled', true);
const expiryHours = parseInt(getSetting('voucher_cleanup.expiry_hours', '24'));
const deleteInvoices = getSetting('voucher_cleanup.delete_expired_invoices', true);
const logActions = getSetting('voucher_cleanup.log_cleanup_actions', true);

if (!cleanupEnabled) {
    console.log('⚠️  Voucher cleanup disabled in settings');
    db.close();
    process.exit(0);
}

console.log(`📋 Konfigurasi cleanup:`);
console.log(`   - Expiry hours: ${expiryHours} jam`);
console.log(`   - Delete invoices: ${deleteInvoices ? 'Ya' : 'Tidak'}`);
console.log(`   - Log actions: ${logActions ? 'Ya' : 'Tidak'}\n`);

// Calculate expiry time
const expiryTime = new Date();
expiryTime.setHours(expiryTime.getHours() - expiryHours);
const expiryTimeStr = expiryTime.toISOString();

console.log(`⏰ Mencari invoice voucher yang dibuat sebelum: ${expiryTimeStr}`);

// First, get expired invoices for logging
const selectSql = `
    SELECT i.id, i.invoice_number, i.amount, i.created_at, i.status, c.name as customer_name
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.invoice_type = 'voucher' 
    AND i.status = 'unpaid' 
    AND i.created_at < ?
    ORDER BY i.created_at ASC
`;

db.all(selectSql, [expiryTimeStr], (err, expiredInvoices) => {
    if (err) {
        console.error('❌ Error getting expired invoices:', err.message);
        db.close();
        process.exit(1);
    }
    
    if (expiredInvoices.length === 0) {
        console.log('✅ Tidak ada invoice voucher yang expired');
        db.close();
        process.exit(0);
    }
    
    console.log(`📋 Ditemukan ${expiredInvoices.length} invoice voucher expired:`);
    expiredInvoices.forEach((invoice, index) => {
        console.log(`   ${index + 1}. ${invoice.invoice_number} (${invoice.customer_name}) - Rp ${invoice.amount.toLocaleString('id-ID')} - ${invoice.created_at}`);
    });
    
    if (deleteInvoices) {
        console.log('\n🗑️  Menghapus invoice expired...');
        
        const deleteSql = `
            DELETE FROM invoices 
            WHERE invoice_type = 'voucher' 
            AND status = 'unpaid' 
            AND created_at < ?
        `;
        
        db.run(deleteSql, [expiryTimeStr], function(err) {
            if (err) {
                console.error('❌ Error deleting expired invoices:', err.message);
                db.close();
                process.exit(1);
            }
            
            const deletedCount = this.changes;
            console.log(`✅ Berhasil menghapus ${deletedCount} invoice voucher expired`);
            
            // Show summary
            console.log('\n📊 Ringkasan cleanup:');
            console.log(`   - Invoice ditemukan: ${expiredInvoices.length}`);
            console.log(`   - Invoice dihapus: ${deletedCount}`);
            console.log(`   - Status: Berhasil`);
            
            db.close();
            process.exit(0);
        });
    } else {
        console.log('\n🏷️  Menandai invoice sebagai expired (tidak dihapus)...');
        
        const updateSql = `
            UPDATE invoices 
            SET notes = COALESCE(notes, '') || ' [EXPIRED - NOT DELETED]'
            WHERE invoice_type = 'voucher' 
            AND status = 'unpaid' 
            AND created_at < ?
        `;
        
        db.run(updateSql, [expiryTimeStr], function(err) {
            if (err) {
                console.error('❌ Error marking expired invoices:', err.message);
                db.close();
                process.exit(1);
            }
            
            const updatedCount = this.changes;
            console.log(`✅ Berhasil menandai ${updatedCount} invoice sebagai expired`);
            
            // Show summary
            console.log('\n📊 Ringkasan cleanup:');
            console.log(`   - Invoice ditemukan: ${expiredInvoices.length}`);
            console.log(`   - Invoice ditandai: ${updatedCount}`);
            console.log(`   - Status: Berhasil (tidak dihapus)`);
            
            db.close();
            process.exit(0);
        });
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⚠️  Process interrupted');
    db.close();
    process.exit(0);
});
