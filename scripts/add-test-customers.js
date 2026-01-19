#!/usr/bin/env node

/**
 * Script untuk menambahkan customer test untuk testing backup/restore
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class TestCustomerAdder {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/billing.db');
    }

    async addTestCustomers() {
        console.log('👥 Menambahkan customer test...');
        
        const db = new sqlite3.Database(this.dbPath);
        
        try {
            // Cek apakah customer test sudah ada
            const existingCustomers = await new Promise((resolve, reject) => {
                db.all('SELECT username FROM customers WHERE username LIKE "test_%"', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            if (existingCustomers.length > 0) {
                console.log('⚠️  Customer test sudah ada, menghapus yang lama...');
                await new Promise((resolve, reject) => {
                    db.run('DELETE FROM customers WHERE username LIKE "test_%"', (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            // Tambahkan customer test
            const testCustomers = [
                {
                    username: 'test_customer_1',
                    name: 'Test Customer 1',
                    phone: '081234567890',
                    email: 'test1@example.com',
                    pppoe_username: 'test1',
                    address: 'Jl. Test 1',
                    latitude: -6.25301152,
                    longitude: 107.92302644,
                    package_id: 1,
                    status: 'active',
                    auto_suspension: 1,
                    billing_day: 15,
                    join_date: new Date().toISOString().split('T')[0]
                },
                {
                    username: 'test_customer_2',
                    name: 'Test Customer 2',
                    phone: '081234567891',
                    email: 'test2@example.com',
                    pppoe_username: 'test2',
                    address: 'Jl. Test 2',
                    latitude: -6.25401152,
                    longitude: 107.92402644,
                    package_id: 2,
                    status: 'active',
                    auto_suspension: 1,
                    billing_day: 20,
                    join_date: new Date().toISOString().split('T')[0]
                }
            ];

            for (const customer of testCustomers) {
                await new Promise((resolve, reject) => {
                    const sql = `
                        INSERT INTO customers (
                            username, name, phone, email, pppoe_username, address,
                            latitude, longitude, package_id, status, auto_suspension,
                            billing_day, join_date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.run(sql, [
                        customer.username, customer.name, customer.phone, customer.email,
                        customer.pppoe_username, customer.address, customer.latitude,
                        customer.longitude, customer.package_id, customer.status,
                        customer.auto_suspension, customer.billing_day, customer.join_date
                    ], function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`✅ Customer ${customer.username} ditambahkan dengan ID: ${this.lastID}`);
                            resolve();
                        }
                    });
                });
            }

            // Cek total customers
            const totalCustomers = await new Promise((resolve, reject) => {
                db.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0].count);
                });
            });

            console.log(`✅ Total customers sekarang: ${totalCustomers}`);

            // List semua customers
            const allCustomers = await new Promise((resolve, reject) => {
                db.all('SELECT id, username, name, status FROM customers ORDER BY id', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('📋 Daftar semua customers:');
            allCustomers.forEach(c => {
                console.log(`  - ID: ${c.id}, Username: ${c.username}, Name: ${c.name}, Status: ${c.status}`);
            });

        } catch (error) {
            console.error('❌ Error menambahkan customer test:', error);
        } finally {
            db.close();
        }
    }

    async removeTestCustomers() {
        console.log('🗑️  Menghapus customer test...');
        
        const db = new sqlite3.Database(this.dbPath);
        
        try {
            const result = await new Promise((resolve, reject) => {
                db.run('DELETE FROM customers WHERE username LIKE "test_%"', function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });

            console.log(`✅ ${result} customer test dihapus`);

            // Cek total customers
            const totalCustomers = await new Promise((resolve, reject) => {
                db.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0].count);
                });
            });

            console.log(`📊 Total customers sekarang: ${totalCustomers}`);

        } catch (error) {
            console.error('❌ Error menghapus customer test:', error);
        } finally {
            db.close();
        }
    }
}

// Main execution
async function main() {
    const adder = new TestCustomerAdder();
    
    const action = process.argv[2];
    
    if (action === 'remove') {
        await adder.removeTestCustomers();
    } else {
        await adder.addTestCustomers();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestCustomerAdder;
