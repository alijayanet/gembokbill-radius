#!/usr/bin/env node

/**
 * Script verifikasi database untuk produksi
 * Memastikan semua tabel yang dibutuhkan ada dalam database
 * Mendukung SQLite dan MySQL
 */

const db = require('../config/database');
const { getSetting } = require('../config/settingsManager');

// Tabel-tabel yang wajib ada di produksi
const requiredTables = [
    'invoices',
    'customers',
    'packages',
    'payments',
    'payment_gateway_transactions',
    'odps',
    'cable_routes',
    'technicians',
    'trouble_reports'
];

// Kolom-kolom yang wajib ada di tabel tertentu
const requiredColumns = {
    invoices: [
        'id', 'customer_id', 'package_id', 'invoice_number', 'amount',
        'base_amount', 'tax_rate', 'due_date', 'status', 'payment_date',
        'payment_method', 'payment_gateway', 'payment_token', 'payment_url',
        'payment_status', 'notes', 'created_at', 'description', 'invoice_type', 'package_name'
    ],
    customers: [
        'id', 'name', 'username', 'phone', 'pppoe_username', 'email', 'address',
        'latitude', 'longitude', 'package_id', 'odp_id', 'pppoe_profile',
        'status', 'auto_suspension', 'billing_day', 'whatsapp_lid'
    ],
    packages: [
        'id', 'name', 'price', 'tax_rate', 'description', 'speed',
        'status', 'created_at', 'pppoe_profile'
    ]
};

// Fungsi untuk memverifikasi keberadaan tabel
async function verifyTablesExist() {
    console.log('🔍 Memverifikasi keberadaan tabel yang dibutuhkan...');

    const dbType = getSetting('db_type', 'sqlite');
    const missingTables = [];

    for (const tableName of requiredTables) {
        let exists;
        
        if (dbType === 'sqlite') {
            const row = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tableName]);
            exists = !!row;
        } else {
            const [rows] = await db.query(`SHOW TABLES LIKE ?`, [tableName]);
            exists = rows.length > 0;
        }

        if (exists) {
            console.log(`✅ Tabel ${tableName} ditemukan`);
        } else {
            console.error(`❌ Tabel ${tableName} tidak ditemukan`);
            missingTables.push(tableName);
        }
    }

    if (missingTables.length > 0) {
        throw new Error(`Tabel yang hilang: ${missingTables.join(', ')}`);
    }
}

// Fungsi untuk memverifikasi kolom dalam tabel
async function verifyTableColumns(tableName, requiredCols) {
    console.log(`\n🔍 Memverifikasi kolom dalam tabel ${tableName}...`);

    const dbType = getSetting('db_type', 'sqlite');
    let existingColumns;

    if (dbType === 'sqlite') {
        const columns = await db.query(`PRAGMA table_info(${tableName})`);
        existingColumns = columns.map(col => col.name);
    } else {
        const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
        existingColumns = columns.map(col => col.Field);
    }

    const missingColumns = requiredCols.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
        console.error(`❌ Kolom yang hilang dalam tabel ${tableName}: ${missingColumns.join(', ')}`);
        throw new Error(`Kolom yang hilang dalam tabel ${tableName}: ${missingColumns.join(', ')}`);
    } else {
        console.log(`✅ Semua kolom dalam tabel ${tableName} lengkap`);
    }
}

// Fungsi utama verifikasi
async function verifyProductionDatabase() {
    try {
        console.log('🚀 Memulai verifikasi database produksi...');
        console.log(`📊 Database type: ${getSetting('db_type', 'sqlite')}\n`);

        // Memverifikasi tabel-tabel
        await verifyTablesExist();

        // Memverifikasi kolom-kolom penting
        for (const [tableName, columns] of Object.entries(requiredColumns)) {
            await verifyTableColumns(tableName, columns);
        }

        console.log('\n🎉 Verifikasi database produksi berhasil!');
        console.log('✅ Semua tabel yang dibutuhkan ada');
        console.log('✅ Semua kolom yang dibutuhkan ada');
        console.log('✅ Database siap untuk produksi');

        return true;

    } catch (error) {
        console.error('\n💥 Verifikasi database produksi gagal!');
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Menjalankan verifikasi jika script dijalankan langsung
if (require.main === module) {
    verifyProductionDatabase()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error tidak terduga:', error.message);
            process.exit(1);
        });
}

module.exports = { verifyProductionDatabase };