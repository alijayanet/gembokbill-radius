#!/usr/bin/env node

/**
 * Script sederhana untuk menampilkan status isolir pelanggan
 * Usage: node scripts/check-isolation-status.js
 */

const { getMikrotikConnection } = require('../config/mikrotik');

async function checkIsolationStatus() {
    try {
        console.log('🔍 Mengecek status isolir di Mikrotik...\n');
        
        const mikrotik = await getMikrotikConnection();
        console.log('✅ Terhubung ke Mikrotik');
        
        // Ambil semua IP yang ada di address list blocked_customers
        const blockedIPs = await mikrotik.write('/ip/firewall/address-list/print', [
            '?list=blocked_customers'
        ]);

        console.log(`\n📊 Status Isolir:`);
        console.log(`   Total IP yang diisolir: ${blockedIPs.length}`);
        
        if (blockedIPs.length === 0) {
            console.log('✅ Tidak ada pelanggan yang diisolir saat ini');
            return;
        }

        console.log('\n📌 Daftar IP yang diisolir:');
        console.log('-'.repeat(60));
        console.log('No | IP Address    | Alasan Isolir');
        console.log('-'.repeat(60));

        blockedIPs.forEach((blockedIP, index) => {
            const ip = blockedIP.address;
            const comment = blockedIP.comment || 'Tidak ada alasan';
            
            console.log(
                `${(index + 1).toString().padStart(2)} | ` +
                `${ip.padEnd(13)} | ` +
                `${comment}`
            );
        });

        console.log('-'.repeat(60));

        // Generate commands untuk restore
        console.log('\n🔧 Commands untuk restore pelanggan:');
        console.log('-'.repeat(60));
        
        blockedIPs.forEach((blockedIP, index) => {
            const ip = blockedIP.address;
            console.log(`# ${index + 1}. IP: ${ip}`);
            console.log(`/ip firewall address-list remove [find where address=${ip} and list=blocked_customers]`);
            console.log('');
        });

        // Bulk restore command
        if (blockedIPs.length > 0) {
            const allIPs = blockedIPs.map(ip => ip.address);
            console.log('🔧 Bulk restore command:');
            console.log(`:foreach i in={${allIPs.join(';')}} do={/ip firewall address-list remove [find where address=$i and list=blocked_customers]}`);
        }

        console.log('\n✅ Pengecekan selesai');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Jalankan script
if (require.main === module) {
    checkIsolationStatus();
}

module.exports = checkIsolationStatus;
