#!/usr/bin/env node

/**
 * Script untuk menambahkan tabel teknisi dan sistem OTP
 * Menambahkan fitur Portal Teknisi dan Kolektor
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔧 Adding Technician Portal tables...\n');

// Path ke database
const dbPath = path.join(__dirname, '../data/billing.db');

// Pastikan direktori data ada
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
}

// Koneksi ke database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err);
        process.exit(1);
    } else {
        console.log('✅ Connected to billing database');
    }
});

// Array tabel yang akan dibuat
const tables = [
    // Tabel teknisi dan kolektor
    {
        name: 'technicians',
        sql: `CREATE TABLE IF NOT EXISTS technicians (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'technician' CHECK(role IN ('technician', 'collector', 'field_officer')),
            is_active BOOLEAN DEFAULT 1,
            area_coverage TEXT,
            join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    },

    // Tabel OTP untuk autentikasi teknisi
    {
        name: 'technician_otp',
        sql: `CREATE TABLE IF NOT EXISTS technician_otp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            is_used BOOLEAN DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    },

    // Tabel aktivitas teknisi untuk tracking
    {
        name: 'technician_activities',
        sql: `CREATE TABLE IF NOT EXISTS technician_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            technician_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            description TEXT,
            customer_id INTEGER,
            invoice_id INTEGER,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (technician_id) REFERENCES technicians (id),
            FOREIGN KEY (customer_id) REFERENCES customers (id),
            FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        )`
    },

    // Tabel pembayaran yang diterima oleh kolektor
    {
        name: 'collector_payments',
        sql: `CREATE TABLE IF NOT EXISTS collector_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collector_id INTEGER NOT NULL,
            invoice_id INTEGER NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_method TEXT DEFAULT 'cash',
            reference_number TEXT,
            notes TEXT,
            collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            verified_by INTEGER,
            verified_at DATETIME,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (collector_id) REFERENCES technicians (id),
            FOREIGN KEY (invoice_id) REFERENCES invoices (id),
            FOREIGN KEY (verified_by) REFERENCES technicians (id)
        )`
    },

    // Tabel session teknisi
    {
        name: 'technician_sessions',
        sql: `CREATE TABLE IF NOT EXISTS technician_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            technician_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (technician_id) REFERENCES technicians (id)
        )`
    }
];

// Fungsi untuk membuat tabel
async function createTables() {
    for (const table of tables) {
        try {
            await new Promise((resolve, reject) => {
                db.run(table.sql, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`✅ Created table: ${table.name}`);
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Error creating table ${table.name}:`, error.message);
        }
    }
}

// Fungsi untuk menambahkan kolom baru ke tabel existing
async function addNewColumns() {
    const alterQueries = [
        // Tambah kolom technician_id ke tabel customers untuk tracking siapa yang menambahkan
        {
            table: 'customers',
            column: 'created_by_technician_id',
            sql: `ALTER TABLE customers ADD COLUMN created_by_technician_id INTEGER REFERENCES technicians(id)`
        },
        // Tambah kolom untuk tracking billing day
        {
            table: 'customers', 
            column: 'billing_day',
            sql: `ALTER TABLE customers ADD COLUMN billing_day INTEGER DEFAULT 15 CHECK(billing_day >= 1 AND billing_day <= 28)`
        },
        // Tambah kolom auto suspension
        {
            table: 'customers',
            column: 'auto_suspension',
            sql: `ALTER TABLE customers ADD COLUMN auto_suspension BOOLEAN DEFAULT 1`
        }
    ];

    for (const query of alterQueries) {
        try {
            await new Promise((resolve, reject) => {
                db.run(query.sql, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        reject(err);
                    } else {
                        if (!err) {
                            console.log(`✅ Added column ${query.column} to ${query.table}`);
                        }
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Error adding column ${query.column} to ${query.table}:`, error.message);
        }
    }
}

// Fungsi untuk menambahkan data default teknisi
async function addDefaultTechnicians() {
    const { getSetting } = require('../config/settingsManager');
    
    // Ambil nomor teknisi dari settings
    const techNumbers = [];
    for (let i = 0; i < 10; i++) {
        const techNumber = getSetting(`technician_numbers.${i}`, null);
        if (techNumber) {
            techNumbers.push(techNumber);
        }
    }

    if (techNumbers.length === 0) {
        console.log('⚠️ No technician numbers found in settings');
        return;
    }

    console.log(`\n📱 Adding ${techNumbers.length} technicians from settings...`);

    for (let i = 0; i < techNumbers.length; i++) {
        const phone = techNumbers[i];
        const name = `Teknisi ${i + 1}`;
        
        try {
            await new Promise((resolve, reject) => {
                const sql = `INSERT OR IGNORE INTO technicians (name, phone, role, area_coverage) VALUES (?, ?, ?, ?)`;
                db.run(sql, [name, phone, 'technician', 'Area ' + (i + 1)], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        if (this.changes > 0) {
                            console.log(`✅ Added technician: ${name} (${phone})`);
                        } else {
                            console.log(`ℹ️ Technician already exists: ${name} (${phone})`);
                        }
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Error adding technician ${name}:`, error.message);
        }
    }
}

// Fungsi utama
async function main() {
    try {
        console.log('📊 Creating technician portal tables...\n');
        
        await createTables();
        console.log('\n🔧 Adding new columns to existing tables...\n');
        
        await addNewColumns();
        console.log('\n👥 Adding default technicians...\n');
        
        await addDefaultTechnicians();
        
        console.log('\n🎉 Technician portal tables setup completed successfully!');
        console.log('\n📋 Summary of tables created:');
        console.log('   • technicians - Data teknisi dan kolektor');
        console.log('   • technician_otp - Sistem OTP untuk autentikasi');
        console.log('   • technician_activities - Log aktivitas teknisi');
        console.log('   • collector_payments - Pembayaran yang diterima kolektor');
        console.log('   • technician_sessions - Session management');
        console.log('\n🚀 Next steps:');
        console.log('   1. Implement technician authentication routes');
        console.log('   2. Create technician dashboard views');
        console.log('   3. Add technician-specific features');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('\n🔒 Database connection closed');
            }
        });
    }
}

// Jalankan script
main();