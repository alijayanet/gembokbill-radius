/**
 * Script untuk memeriksa data kabel yang sebenarnya di database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Checking cable data in database...\n');

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

async function checkCableData() {
    try {
        console.log('📊 === CABLE ROUTES DATA ===\n');
        
        // Cek cable routes dengan detail
        const cableRoutes = await new Promise((resolve) => {
            db.all(`
                SELECT cr.id, cr.customer_id, cr.odp_id, cr.cable_length, cr.cable_type, 
                       cr.installation_date, cr.status, cr.port_number, cr.notes,
                       c.name as customer_name, c.phone as customer_phone,
                       c.latitude as customer_latitude, c.longitude as customer_longitude,
                       o.name as odp_name, o.code as odp_code,
                       o.latitude as odp_latitude, o.longitude as odp_longitude
                FROM cable_routes cr
                LEFT JOIN customers c ON cr.customer_id = c.id
                LEFT JOIN odps o ON cr.odp_id = o.id
                ORDER BY cr.id
            `, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error loading cable routes:', err);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            });
        });

        console.log(`📋 Found ${cableRoutes.length} cable routes:`);
        
        if (cableRoutes.length > 0) {
            cableRoutes.forEach((cable, index) => {
                console.log(`\n🔌 Cable Route #${cable.id}:`);
                console.log(`   Customer: ${cable.customer_name || 'N/A'} (ID: ${cable.customer_id})`);
                console.log(`   Customer Coords: ${cable.customer_latitude}, ${cable.customer_longitude}`);
                console.log(`   ODP: ${cable.odp_name || 'N/A'} (ID: ${cable.odp_id})`);
                console.log(`   ODP Coords: ${cable.odp_latitude}, ${cable.odp_longitude}`);
                console.log(`   Status: ${cable.status}`);
                console.log(`   Length: ${cable.cable_length} meters`);
                console.log(`   Port: ${cable.port_number}`);
                
                // Cek apakah koordinat valid
                const hasValidCoords = cable.customer_latitude && cable.customer_longitude && 
                                     cable.odp_latitude && cable.odp_longitude;
                console.log(`   Valid Coords: ${hasValidCoords ? '✅' : '❌'}`);
            });
        } else {
            console.log('⚠️ No cable routes found!');
        }

        console.log('\n📊 === NETWORK SEGMENTS DATA ===\n');
        
        // Cek network segments dengan detail
        const networkSegments = await new Promise((resolve) => {
            db.all(`
                SELECT ns.id, ns.name, ns.start_odp_id, ns.end_odp_id, ns.cable_length, 
                       ns.segment_type, ns.installation_date, ns.status, ns.notes,
                       start_odp.name as start_odp_name, start_odp.code as start_odp_code,
                       start_odp.latitude as start_odp_latitude, start_odp.longitude as start_odp_longitude,
                       end_odp.name as end_odp_name, end_odp.code as end_odp_code,
                       end_odp.latitude as end_odp_latitude, end_odp.longitude as end_odp_longitude
                FROM network_segments ns
                LEFT JOIN odps start_odp ON ns.start_odp_id = start_odp.id
                LEFT JOIN odps end_odp ON ns.end_odp_id = end_odp.id
                ORDER BY ns.id
            `, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error loading network segments:', err);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            });
        });

        console.log(`📋 Found ${networkSegments.length} network segments:`);
        
        if (networkSegments.length > 0) {
            networkSegments.forEach((segment, index) => {
                console.log(`\n🌐 Network Segment #${segment.id}: ${segment.name}`);
                console.log(`   From ODP: ${segment.start_odp_name || 'N/A'} (ID: ${segment.start_odp_id})`);
                console.log(`   From Coords: ${segment.start_odp_latitude}, ${segment.start_odp_longitude}`);
                console.log(`   To ODP: ${segment.end_odp_name || 'N/A'} (ID: ${segment.end_odp_id})`);
                console.log(`   To Coords: ${segment.end_odp_latitude}, ${segment.end_odp_longitude}`);
                console.log(`   Type: ${segment.segment_type}`);
                console.log(`   Status: ${segment.status}`);
                console.log(`   Length: ${segment.cable_length} meters`);
                
                // Cek apakah koordinat valid
                const hasValidCoords = segment.start_odp_latitude && segment.start_odp_longitude && 
                                     segment.end_odp_latitude && segment.end_odp_longitude;
                console.log(`   Valid Coords: ${hasValidCoords ? '✅' : '❌'}`);
            });
        } else {
            console.log('⚠️ No network segments found!');
        }

        console.log('\n📊 === CUSTOMERS DATA ===\n');
        
        // Cek customers dengan koordinat
        const customersWithCoords = await new Promise((resolve) => {
            db.all(`
                SELECT id, name, phone, latitude, longitude, status
                FROM customers 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY id
            `, [], (err, rows) => {
                if (err) {
                    console.error('❌ Error loading customers:', err);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            });
        });

        console.log(`📋 Found ${customersWithCoords.length} customers with coordinates:`);
        
        if (customersWithCoords.length > 0) {
            customersWithCoords.slice(0, 5).forEach((customer, index) => {
                console.log(`   ${customer.id}. ${customer.name} - ${customer.latitude}, ${customer.longitude}`);
            });
            if (customersWithCoords.length > 5) {
                console.log(`   ... and ${customersWithCoords.length - 5} more customers`);
            }
        }

        console.log('\n📊 === ODPS DATA ===\n');
        
        // Cek ODPs
        const odps = await new Promise((resolve) => {
            db.all(`
                SELECT id, name, code, latitude, longitude, capacity, used_ports, status
                FROM odps 
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

        console.log(`📋 Found ${odps.length} ODPs:`);
        
        if (odps.length > 0) {
            odps.slice(0, 5).forEach((odp, index) => {
                console.log(`   ${odp.id}. ${odp.name} (${odp.code}) - ${odp.latitude}, ${odp.longitude} - ${odp.used_ports}/${odp.capacity} ports`);
            });
            if (odps.length > 5) {
                console.log(`   ... and ${odps.length - 5} more ODPs`);
            }
        }

        // Summary
        console.log('\n📊 === SUMMARY ===');
        console.log(`✅ Customers with coordinates: ${customersWithCoords.length}`);
        console.log(`✅ ODPs: ${odps.length}`);
        console.log(`✅ Cable routes: ${cableRoutes.length}`);
        console.log(`✅ Network segments: ${networkSegments.length}`);
        
        const validCableRoutes = cableRoutes.filter(c => c.customer_latitude && c.customer_longitude && c.odp_latitude && c.odp_longitude);
        const validNetworkSegments = networkSegments.filter(s => s.start_odp_latitude && s.start_odp_longitude && s.end_odp_latitude && s.end_odp_longitude);
        
        console.log(`✅ Valid cable routes (with coordinates): ${validCableRoutes.length}`);
        console.log(`✅ Valid network segments (with coordinates): ${validNetworkSegments.length}`);

        if (validCableRoutes.length === 0) {
            console.log('\n⚠️ ISSUE: No valid cable routes found with coordinates!');
            console.log('   This means cables cannot be visualized on the map.');
        }

        if (validNetworkSegments.length === 0) {
            console.log('\n⚠️ ISSUE: No valid network segments found with coordinates!');
            console.log('   This means backbone connections cannot be visualized on the map.');
        }

    } catch (error) {
        console.error('❌ Error in checkCableData:', error);
    } finally {
        db.close();
    }
}

// Jalankan script
checkCableData();
