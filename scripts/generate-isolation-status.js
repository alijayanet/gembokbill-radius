#!/usr/bin/env node

/**
 * Script untuk menampilkan status isolir pelanggan IP statik
 * Menghasilkan laporan lengkap tentang pelanggan yang diisolir
 * 
 * Usage: node scripts/generate-isolation-status.js
 */

const { getMikrotikConnection } = require('../config/mikrotik');
const billingManager = require('../config/billing');
const { getSetting } = require('../config/settingsManager');

class IsolationStatusGenerator {
    constructor() {
        this.mikrotik = null;
    }

    async connect() {
        try {
            this.mikrotik = await getMikrotikConnection();
            console.log('✅ Terhubung ke Mikrotik');
        } catch (error) {
            console.error('❌ Gagal terhubung ke Mikrotik:', error.message);
            throw error;
        }
    }

    async getBlockedCustomersFromMikrotik() {
        try {
            // Ambil semua IP yang ada di address list blocked_customers
            const blockedIPs = await this.mikrotik.write('/ip/firewall/address-list/print', [
                '?list=blocked_customers'
            ]);

            console.log(`📊 Ditemukan ${blockedIPs.length} IP yang diisolir di Mikrotik`);
            return blockedIPs || [];
        } catch (error) {
            console.error('❌ Error mengambil data blocked customers:', error.message);
            return [];
        }
    }

    async getCustomersFromBilling() {
        try {
            // Ambil semua customer dari billing
            const customers = await billingManager.getAllCustomers();
            console.log(`📊 Ditemukan ${customers.length} customer di billing`);
            return customers || [];
        } catch (error) {
            console.error('❌ Error mengambil data customer:', error.message);
            return [];
        }
    }

    async generateStatusReport() {
        try {
            await this.connect();
            
            console.log('\n🔍 Mengambil data isolir...\n');
            
            const [blockedIPs, customers] = await Promise.all([
                this.getBlockedCustomersFromMikrotik(),
                this.getCustomersFromBilling()
            ]);

            // Buat mapping customer berdasarkan IP
            const customerMap = new Map();
            customers.forEach(customer => {
                const ip = customer.static_ip || customer.ip_address || customer.assigned_ip;
                if (ip) {
                    customerMap.set(ip, customer);
                }
            });

            console.log('\n' + '='.repeat(80));
            console.log('📋 LAPORAN STATUS ISOLIR PELANGGAN IP STATIK');
            console.log('='.repeat(80));
            console.log(`Tanggal: ${new Date().toLocaleString('id-ID')}`);
            console.log(`Total IP diisolir: ${blockedIPs.length}`);
            console.log(`Total customer di billing: ${customers.length}`);
            console.log('='.repeat(80));

            if (blockedIPs.length === 0) {
                console.log('✅ Tidak ada pelanggan yang diisolir saat ini');
                return;
            }

            console.log('\n📌 DAFTAR PELANGGAN YANG DIISOLIR:');
            console.log('-'.repeat(80));
            console.log('No | IP Address    | Nama Customer        | Phone           | Alasan Isolir');
            console.log('-'.repeat(80));

            let foundInBilling = 0;
            let notFoundInBilling = 0;

            blockedIPs.forEach((blockedIP, index) => {
                const ip = blockedIP.address;
                const comment = blockedIP.comment || 'Tidak ada alasan';
                const customer = customerMap.get(ip);
                
                if (customer) {
                    foundInBilling++;
                    console.log(
                        `${(index + 1).toString().padStart(2)} | ` +
                        `${ip.padEnd(13)} | ` +
                        `${(customer.name || 'N/A').padEnd(19)} | ` +
                        `${(customer.phone || 'N/A').padEnd(14)} | ` +
                        `${comment}`
                    );
                } else {
                    notFoundInBilling++;
                    console.log(
                        `${(index + 1).toString().padStart(2)} | ` +
                        `${ip.padEnd(13)} | ` +
                        `TIDAK DITEMUKAN DI BILLING`.padEnd(19) + ' | ' +
                        `N/A`.padEnd(14) + ' | ' +
                        `${comment}`
                    );
                }
            });

            console.log('-'.repeat(80));
            console.log(`\n📊 RINGKASAN:`);
            console.log(`   ✅ Ditemukan di billing: ${foundInBilling}`);
            console.log(`   ❌ Tidak ditemukan di billing: ${notFoundInBilling}`);
            console.log(`   📱 Total diisolir: ${blockedIPs.length}`);

            // Generate Mikrotik commands untuk restore
            if (foundInBilling > 0) {
                console.log('\n🔧 MIKROTIK COMMANDS UNTUK RESTORE:');
                console.log('-'.repeat(80));
                
                blockedIPs.forEach((blockedIP, index) => {
                    const ip = blockedIP.address;
                    const customer = customerMap.get(ip);
                    
                    if (customer) {
                        console.log(`# Restore ${customer.name} (${customer.phone})`);
                        console.log(`/ip firewall address-list remove [find where address=${ip} and list=blocked_customers]`);
                        console.log('');
                    }
                });
            }

            // Generate bulk restore command
            if (foundInBilling > 0) {
                console.log('🔧 BULK RESTORE COMMAND:');
                console.log('-'.repeat(80));
                const ipsToRestore = blockedIPs
                    .filter(blockedIP => customerMap.has(blockedIP.address))
                    .map(blockedIP => blockedIP.address);
                
                if (ipsToRestore.length > 0) {
                    console.log('# Restore semua pelanggan yang ada di billing:');
                    console.log(`:foreach i in={${ipsToRestore.join(';')}} do={/ip firewall address-list remove [find where address=$i and list=blocked_customers]}`);
                }
            }

            console.log('\n' + '='.repeat(80));
            console.log('✅ Laporan selesai');
            console.log('='.repeat(80));

        } catch (error) {
            console.error('❌ Error generating status report:', error.message);
        }
    }

    async generateMikrotikCommands() {
        try {
            await this.connect();
            
            const blockedIPs = await this.getBlockedCustomersFromMikrotik();
            
            if (blockedIPs.length === 0) {
                console.log('✅ Tidak ada IP yang diisolir');
                return;
            }

            console.log('\n🔧 MIKROTIK COMMANDS:');
            console.log('='.repeat(60));
            
            // Commands untuk monitoring
            console.log('# Monitoring commands:');
            console.log('/ip firewall address-list print where list=blocked_customers');
            console.log('/ip firewall filter print where comment~"Block suspended customers"');
            console.log('');
            
            // Commands untuk restore individual
            console.log('# Individual restore commands:');
            blockedIPs.forEach((blockedIP, index) => {
                console.log(`# ${index + 1}. IP: ${blockedIP.address} - ${blockedIP.comment || 'No comment'}`);
                console.log(`/ip firewall address-list remove [find where address=${blockedIP.address} and list=blocked_customers]`);
                console.log('');
            });
            
            // Bulk restore command
            const allIPs = blockedIPs.map(ip => ip.address);
            console.log('# Bulk restore command:');
            console.log(`:foreach i in={${allIPs.join(';')}} do={/ip firewall address-list remove [find where address=$i and list=blocked_customers]}`);
            
            console.log('\n' + '='.repeat(60));

        } catch (error) {
            console.error('❌ Error generating Mikrotik commands:', error.message);
        }
    }
}

// Main execution
if (require.main === module) {
    const generator = new IsolationStatusGenerator();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    
    switch (command) {
        case 'status':
            generator.generateStatusReport();
            break;
        case 'commands':
            generator.generateMikrotikCommands();
            break;
        case 'help':
            console.log('Usage: node scripts/generate-isolation-status.js [command]');
            console.log('');
            console.log('Commands:');
            console.log('  status    - Generate full status report (default)');
            console.log('  commands  - Generate Mikrotik commands only');
            console.log('  help      - Show this help message');
            break;
        default:
            console.log('❌ Unknown command. Use "help" to see available commands.');
    }
}

module.exports = IsolationStatusGenerator;
