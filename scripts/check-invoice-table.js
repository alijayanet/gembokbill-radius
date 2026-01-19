#!/usr/bin/env node

/**
 * Script to check the structure of the invoices table
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkInvoiceTable() {
    const dbPath = path.join(__dirname, '../data/billing.db');
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🔍 Checking invoices table structure...\n');
        
        // Get table info
        const tableInfo = await new Promise((resolve, reject) => {
            db.all('PRAGMA table_info(invoices)', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('📋 Invoices table columns:');
        tableInfo.forEach(column => {
            console.log(`   • ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        // Check if invoice_type column exists
        const hasInvoiceType = tableInfo.some(column => column.name === 'invoice_type');
        console.log(`\n✅ Invoice type column exists: ${hasInvoiceType ? 'YES' : 'NO'}`);
        
        // Get some sample data
        console.log('\n📊 Sample invoices data:');
        const sampleData = await new Promise((resolve, reject) => {
            db.all('SELECT id, invoice_number, invoice_type, status, amount FROM invoices LIMIT 5', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (sampleData && sampleData.length > 0) {
            sampleData.forEach(row => {
                console.log(`   • Invoice ${row.invoice_number}: ${row.invoice_type || 'N/A'} - ${row.status} - ${row.amount}`);
            });
        } else {
            console.log('   No invoice data found');
        }
        
    } catch (error) {
        console.error('❌ Error checking invoices table:', error.message);
    } finally {
        db.close();
    }
}

// Run if called directly
if (require.main === module) {
    checkInvoiceTable();
}

module.exports = checkInvoiceTable;