const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🧪 Testing WhatsApp Group Management untuk Teknisi');
console.log('='.repeat(60));

// Path database
const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

async function testWhatsAppGroupManagement() {
    console.log('\n📋 1. MENAMBAHKAN TEKNISI BARU DENGAN WHATSAPP GROUP:');

    const newTechnician = {
        name: 'Teknisi Test Group',
        phone: '6281234567890',
        role: 'technician',
        whatsapp_group_id: '120363123456789012@g.us',
        area_coverage: 'Area Test',
        is_active: 1
    };

    try {
        const result = await new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO technicians (name, phone, role, area_coverage, whatsapp_group_id, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;

            db.run(sql, [
                newTechnician.name,
                newTechnician.phone,
                newTechnician.role,
                newTechnician.area_coverage,
                newTechnician.whatsapp_group_id,
                newTechnician.is_active
            ], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });

        console.log(`✅ Teknisi baru ditambahkan dengan ID: ${result.id}`);
        console.log(`   - Nama: ${newTechnician.name}`);
        console.log(`   - Phone: ${newTechnician.phone}`);
        console.log(`   - WhatsApp Group: ${newTechnician.whatsapp_group_id}`);

    } catch (error) {
        console.error('❌ Error menambah teknisi:', error);
    }

    console.log('\n📊 2. MENAMPILKAN SEMUA TEKNISI DENGAN WHATSAPP GROUP:');

    try {
        const allTechnicians = await new Promise((resolve, reject) => {
            db.all(`
                SELECT id, name, phone, role, whatsapp_group_id, is_active
                FROM technicians
                ORDER BY is_active DESC, name ASC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        allTechnicians.forEach((tech, index) => {
            const status = tech.is_active ? 'Aktif' : 'Tidak Aktif';
            const groupInfo = tech.whatsapp_group_id ? tech.whatsapp_group_id : 'Tidak ada';
            console.log(`${index + 1}. ${tech.name} (${tech.phone}) - ${status}`);
            console.log(`   Role: ${tech.role} | Group: ${groupInfo}`);
        });

    } catch (error) {
        console.error('❌ Error menampilkan teknisi:', error);
    }

    console.log('\n📱 3. MENAMPILKAN TEKNISI YANG PUNYA WHATSAPP GROUP:');

    try {
        const techniciansWithGroups = await new Promise((resolve, reject) => {
            db.all(`
                SELECT id, name, phone, role, whatsapp_group_id
                FROM technicians
                WHERE is_active = 1 AND whatsapp_group_id IS NOT NULL AND whatsapp_group_id != ''
                ORDER BY name ASC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (techniciansWithGroups.length === 0) {
            console.log('   Tidak ada teknisi dengan WhatsApp Group');
        } else {
            techniciansWithGroups.forEach((tech, index) => {
                console.log(`${index + 1}. ${tech.name}`);
                console.log(`   📱 Group ID: ${tech.whatsapp_group_id}`);
                console.log(`   📞 Phone: ${tech.phone}`);
                console.log(`   🔧 Role: ${tech.role}`);
            });
        }

    } catch (error) {
        console.error('❌ Error menampilkan teknisi dengan group:', error);
    }

    console.log('\n🎯 4. SIMULASI PENGIRIMAN NOTIFIKASI:');

    try {
        const activeTechnicians = await new Promise((resolve, reject) => {
            db.all(`
                SELECT phone, name, role, whatsapp_group_id
                FROM technicians
                WHERE is_active = 1
                ORDER BY role, name
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        console.log(`   Total teknisi aktif: ${activeTechnicians.length}`);

        const techniciansWithGroups = activeTechnicians.filter(tech =>
            tech.whatsapp_group_id && tech.whatsapp_group_id.trim() !== ''
        );

        console.log(`   Teknisi dengan grup individual: ${techniciansWithGroups.length}`);
        console.log(`   Teknisi tanpa grup individual: ${activeTechnicians.length - techniciansWithGroups.length}`);

        console.log('\n   📤 Simulasi pengiriman notifikasi:');
        console.log('   1. Grup utama (dari settings): 120363031495796203@g.us');
        console.log('   2. Grup individual:');

        techniciansWithGroups.forEach(tech => {
            console.log(`      - ${tech.name}: ${tech.whatsapp_group_id}`);
        });

        console.log('   3. Nomor individual:');
        activeTechnicians.forEach(tech => {
            console.log(`      - ${tech.name}: ${tech.phone}`);
        });

    } catch (error) {
        console.error('❌ Error simulasi pengiriman:', error);
    }

    console.log('\n🎉 TESTING SELESAI!');
    console.log('\n💡 CARA MENGGUNAKAN:');
    console.log('   1. Akses: http://localhost:3004/admin/technicians');
    console.log('   2. Edit teknisi untuk menambah WhatsApp Group ID');
    console.log('   3. Kosongkan field jika ingin menggunakan grup default');
    console.log('   4. Sistem akan mengirim ke semua grup yang tersedia');

    db.close();
}

// Jalankan testing
testWhatsAppGroupManagement().catch(console.error);
