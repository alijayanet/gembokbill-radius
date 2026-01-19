/**
 * Script untuk check ODP connections table
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Checking ODP connections table...\n');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err);
        process.exit(1);
    } else {
        console.log('✅ Connected to billing database');
    }
});

async function checkODPConnections() {
    try {
        console.log('📊 === CHECKING ODP CONNECTIONS TABLE ===\n');
        
        // Check if odp_connections table exists
        const tableExists = await new Promise((resolve, reject) => {
            db.get(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='odp_connections'
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
        
        console.log(`📋 ODP Connections table exists: ${tableExists ? '✅' : '❌'}`);
        
        if (tableExists) {
            // Get all ODP connections
            const odpConnections = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT oc.id, oc.from_odp_id, oc.to_odp_id, oc.connection_type, 
                           oc.cable_length, oc.cable_capacity, oc.status, oc.installation_date, oc.notes,
                           from_odp.name as from_odp_name, from_odp.latitude as from_odp_latitude, from_odp.longitude as from_odp_longitude,
                           to_odp.name as to_odp_name, to_odp.latitude as to_odp_latitude, to_odp.longitude as to_odp_longitude
                    FROM odp_connections oc
                    LEFT JOIN odps from_odp ON oc.from_odp_id = from_odp.id
                    LEFT JOIN odps to_odp ON oc.to_odp_id = to_odp.id
                    ORDER BY oc.id
                `, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`📋 Found ${odpConnections.length} ODP connections:`);
            
            if (odpConnections.length > 0) {
                odpConnections.forEach((conn, index) => {
                    console.log(`\n🔗 ODP Connection #${index + 1}:`);
                    console.log(`   ID: ${conn.id}`);
                    console.log(`   From ODP: ${conn.from_odp_name} (ID: ${conn.from_odp_id})`);
                    console.log(`   From Coords: ${conn.from_odp_latitude}, ${conn.from_odp_longitude}`);
                    console.log(`   To ODP: ${conn.to_odp_name} (ID: ${conn.to_odp_id})`);
                    console.log(`   To Coords: ${conn.to_odp_latitude}, ${conn.to_odp_longitude}`);
                    console.log(`   Connection Type: ${conn.connection_type}`);
                    console.log(`   Cable Length: ${conn.cable_length} meters`);
                    console.log(`   Cable Capacity: ${conn.cable_capacity}`);
                    console.log(`   Status: ${conn.status}`);
                    console.log(`   Installation Date: ${conn.installation_date}`);
                    console.log(`   Notes: ${conn.notes || 'N/A'}`);
                    
                    // Check coordinate validity
                    const hasValidCoords = conn.from_odp_latitude && conn.from_odp_longitude && 
                                         conn.to_odp_latitude && conn.to_odp_longitude;
                    console.log(`   Valid Coords: ${hasValidCoords ? '✅' : '❌'}`);
                });
            } else {
                console.log('⚠️ No ODP connections found in odp_connections table');
            }
        }
        
        console.log('\n📊 === CHECKING ALL ODPs ===\n');
        
        // Get all ODPs to see what's available
        const allOdps = await new Promise((resolve, reject) => {
            db.all(`SELECT id, name, code, latitude, longitude, status FROM odps ORDER BY id`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📋 Found ${allOdps.length} total ODPs:`);
        allOdps.forEach(odp => {
            const hasCoords = odp.latitude && odp.longitude;
            console.log(`   ${odp.id}. ${odp.name} (${odp.code}) - ${odp.latitude}, ${odp.longitude} - Status: ${odp.status} - Coords: ${hasCoords ? '✅' : '❌'}`);
        });
        
        // Check for specific ODPs mentioned
        console.log('\n📊 === CHECKING SPECIFIC ODPS ===\n');
        
        const erikODP = allOdps.find(o => o.name.includes('ERIK'));
        const sdODP = allOdps.find(o => o.name.includes('SD'));
        const atamODP = allOdps.find(o => o.name.includes('ATAM'));
        
        console.log('🎯 Specific ODPs:');
        console.log(`   ODP-ERIK: ${erikODP ? `✅ ${erikODP.name} (ID: ${erikODP.id})` : '❌ Not found'}`);
        console.log(`   ODP-SD: ${sdODP ? `✅ ${sdODP.name} (ID: ${sdODP.id})` : '❌ Not found'}`);
        console.log(`   ODP-ATAM: ${atamODP ? `✅ ${atamODP.name} (ID: ${atamODP.id})` : '❌ Not found'}`);
        
        if (erikODP && sdODP && atamODP) {
            console.log('\n💡 RECOMMENDATION:');
            console.log('   You can create connections between these ODPs:');
            console.log(`   1. ${erikODP.name} (ID: ${erikODP.id}) → ${sdODP.name} (ID: ${sdODP.id})`);
            console.log(`   2. ${sdODP.name} (ID: ${sdODP.id}) → ${atamODP.name} (ID: ${atamODP.id})`);
            console.log('\n   Use the following interfaces:');
            console.log('   - /admin/cable-network/odp-connections (for odp_connections table)');
            console.log('   - /admin/cable-network/network-segments (for network_segments table)');
        }
        
        console.log('\n📊 === SUMMARY ===');
        console.log(`✅ ODP Connections table exists: ${tableExists}`);
        console.log(`✅ Total ODP connections: ${tableExists ? odpConnections?.length || 0 : 0}`);
        console.log(`✅ Total ODPs: ${allOdps.length}`);
        console.log(`✅ ODP-ERIK found: ${!!erikODP}`);
        console.log(`✅ ODP-SD found: ${!!sdODP}`);
        console.log(`✅ ODP-ATAM found: ${!!atamODP}`);
        
    } catch (error) {
        console.error('❌ Error checking ODP connections:', error);
    } finally {
        db.close();
    }
}

// Jalankan check
checkODPConnections();
