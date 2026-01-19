/**
 * Script untuk memperbaiki network segments dengan ODP yang benar-benar ada
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 Fixing network segments with valid ODPs...\n');

// Path ke database
const dbPath = path.join(__dirname, '../data/billing.db');

// Koneksi ke database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err);
        process.exit(1);
    } else {
        console.log('✅ Connected to billing database');
    }
});

async function fixNetworkSegments() {
    try {
        // Ambil ODP yang benar-benar ada dan memiliki koordinat
        const validODPs = await new Promise((resolve) => {
            db.all(`
                SELECT id, name, code, latitude, longitude
                FROM odps 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY id
            `, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error loading ODPs:', err);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            });
        });

        console.log(`📋 Found ${validODPs.length} valid ODPs:`);
        validODPs.forEach(odp => {
            console.log(`   ${odp.id}. ${odp.name} (${odp.code}) - ${odp.latitude}, ${odp.longitude}`);
        });

        if (validODPs.length < 2) {
            console.log('❌ Need at least 2 ODPs to create network segments');
            return;
        }

        // Hapus network segments yang tidak valid
        console.log('\n🗑️ Removing invalid network segments...');
        await new Promise((resolve) => {
            db.run('DELETE FROM network_segments', (err) => {
                if (err) {
                    console.error('❌ Error deleting network segments:', err);
                } else {
                    console.log('✅ Deleted all network segments');
                }
                resolve();
            });
        });

        // Buat network segments baru dengan ODP yang valid
        console.log('\n📝 Creating new valid network segments...');
        
        const networkSegments = [
            {
                name: 'Backbone-PUSAT-KAPRAN',
                start_odp_id: 2, // ODP-PUSAT
                end_odp_id: 10,  // ODP-KAPRAN
                cable_length: 150.0,
                segment_type: 'Backbone',
                status: 'active'
            },
            {
                name: 'Backbone-KAPRAN-ERIK',
                start_odp_id: 10, // ODP-KAPRAN
                end_odp_id: 11,   // ODP-ERIK
                cable_length: 100.0,
                segment_type: 'Distribution',
                status: 'active'
            }
        ];

        // Tambahkan network segments jika ada lebih dari 3 ODP
        if (validODPs.length >= 4) {
            networkSegments.push({
                name: 'Backbone-Central-Branch',
                start_odp_id: validODPs[2].id, // ODP ke-3
                end_odp_id: validODPs[3].id,   // ODP ke-4
                cable_length: 500.0,
                segment_type: 'Backbone',
                status: 'active'
            });
        }

        if (validODPs.length >= 5) {
            networkSegments.push({
                name: 'Distribution-Branch-Residential',
                start_odp_id: validODPs[3].id, // ODP ke-4
                end_odp_id: validODPs[4].id,   // ODP ke-5
                cable_length: 300.0,
                segment_type: 'Distribution',
                status: 'active'
            });
        }

        for (const segment of networkSegments) {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO network_segments (name, start_odp_id, end_odp_id, cable_length, segment_type, status, installation_date)
                    VALUES (?, ?, ?, ?, ?, ?, date('now'))
                `, [segment.name, segment.start_odp_id, segment.end_odp_id, 
                     segment.cable_length, segment.segment_type, segment.status], function(err) {
                    if (err) {
                        console.error(`❌ Error adding network segment ${segment.name}:`, err);
                        reject(err);
                    } else {
                        console.log(`✅ Added network segment: ${segment.name} (ID: ${this.lastID})`);
                        resolve();
                    }
                });
            });
        }

        // Verifikasi hasil
        console.log('\n📊 Verifying network segments...');
        const finalSegments = await new Promise((resolve) => {
            db.all(`
                SELECT ns.id, ns.name, ns.start_odp_id, ns.end_odp_id, ns.cable_length, 
                       ns.segment_type, ns.status,
                       start_odp.name as start_odp_name,
                       start_odp.latitude as start_odp_latitude, start_odp.longitude as start_odp_longitude,
                       end_odp.name as end_odp_name,
                       end_odp.latitude as end_odp_latitude, end_odp.longitude as end_odp_longitude
                FROM network_segments ns
                LEFT JOIN odps start_odp ON ns.start_odp_id = start_odp.id
                LEFT JOIN odps end_odp ON ns.end_odp_id = end_odp.id
                ORDER BY ns.id
            `, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error verifying network segments:', err);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            });
        });

        console.log(`📋 Created ${finalSegments.length} network segments:`);
        finalSegments.forEach((segment, index) => {
            const hasValidCoords = segment.start_odp_latitude && segment.start_odp_longitude && 
                                 segment.end_odp_latitude && segment.end_odp_longitude;
            console.log(`   ${index + 1}. ${segment.name}`);
            console.log(`      From: ${segment.start_odp_name} (${segment.start_odp_latitude}, ${segment.start_odp_longitude})`);
            console.log(`      To: ${segment.end_odp_name} (${segment.end_odp_latitude}, ${segment.end_odp_longitude})`);
            console.log(`      Type: ${segment.segment_type}, Length: ${segment.cable_length}m`);
            console.log(`      Valid: ${hasValidCoords ? '✅' : '❌'}`);
        });

        const validSegments = finalSegments.filter(s => s.start_odp_latitude && s.start_odp_longitude && s.end_odp_latitude && s.end_odp_longitude);
        console.log(`\n✅ Valid network segments: ${validSegments.length}/${finalSegments.length}`);

        if (validSegments.length > 0) {
            console.log('🎉 Network segments fixed successfully!');
            console.log('   Now backbone connections should be visible on the map.');
        } else {
            console.log('❌ Still no valid network segments created.');
        }

    } catch (error) {
        console.error('❌ Error in fixNetworkSegments:', error);
    } finally {
        db.close();
    }
}

// Jalankan script
fixNetworkSegments();
