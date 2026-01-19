/**
 * Script untuk debug backbone cables rendering
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Debugging backbone cables rendering...\n');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err);
        process.exit(1);
    } else {
        console.log('✅ Connected to billing database');
    }
});

async function debugBackboneCables() {
    try {
        console.log('📊 === DEBUGGING BACKBONE CABLES ===\n');
        
        // Get backbone cables with coordinates
        const backboneCables = await new Promise((resolve, reject) => {
            db.all(`
                SELECT ns.id, ns.name, ns.start_odp_id, ns.end_odp_id, ns.cable_length, 
                       ns.segment_type, ns.status,
                       start_odp.name as start_odp_name, start_odp.latitude as start_odp_latitude, start_odp.longitude as start_odp_longitude,
                       end_odp.name as end_odp_name, end_odp.latitude as end_odp_latitude, end_odp.longitude as end_odp_longitude
                FROM network_segments ns
                LEFT JOIN odps start_odp ON ns.start_odp_id = start_odp.id
                LEFT JOIN odps end_odp ON ns.end_odp_id = end_odp.id
                ORDER BY ns.id
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📋 Found ${backboneCables.length} backbone cables:\n`);
        
        backboneCables.forEach((cable, index) => {
            console.log(`🌐 Backbone Cable #${index + 1}:`);
            console.log(`   ID: ${cable.id}`);
            console.log(`   Name: ${cable.name}`);
            console.log(`   Start ODP: ${cable.start_odp_name} (ID: ${cable.start_odp_id})`);
            console.log(`   Start Coords: ${cable.start_odp_latitude}, ${cable.start_odp_longitude}`);
            console.log(`   End ODP: ${cable.end_odp_name} (ID: ${cable.end_odp_id})`);
            console.log(`   End Coords: ${cable.end_odp_latitude}, ${cable.end_odp_longitude}`);
            console.log(`   Type: ${cable.segment_type}`);
            console.log(`   Status: ${cable.status}`);
            console.log(`   Length: ${cable.cable_length} meters`);
            
            // Check coordinate validity
            const hasValidCoords = cable.start_odp_latitude && cable.start_odp_longitude && 
                                 cable.end_odp_latitude && cable.end_odp_longitude;
            console.log(`   Valid Coords: ${hasValidCoords ? '✅' : '❌'}`);
            
            // Check coordinate range (should be reasonable lat/lng values)
            if (hasValidCoords) {
                const startLat = parseFloat(cable.start_odp_latitude);
                const startLng = parseFloat(cable.start_odp_longitude);
                const endLat = parseFloat(cable.end_odp_latitude);
                const endLng = parseFloat(cable.end_odp_longitude);
                
                const validLatRange = startLat >= -90 && startLat <= 90 && endLat >= -90 && endLat <= 90;
                const validLngRange = startLng >= -180 && startLng <= 180 && endLng >= -180 && endLng <= 180;
                
                console.log(`   Valid Lat Range: ${validLatRange ? '✅' : '❌'}`);
                console.log(`   Valid Lng Range: ${validLngRange ? '✅' : '❌'}`);
                
                // Calculate distance between points
                const distance = calculateDistance(startLat, startLng, endLat, endLng);
                console.log(`   Calculated Distance: ${distance.toFixed(2)} km`);
                
                // Check if distance is reasonable (not too far apart)
                const reasonableDistance = distance < 100; // Less than 100km
                console.log(`   Reasonable Distance: ${reasonableDistance ? '✅' : '❌'} (${distance.toFixed(2)} km)`);
            }
            
            console.log('');
        });
        
        // Test API data format
        console.log('📊 === TESTING API DATA FORMAT ===\n');
        
        const formattedBackboneCables = backboneCables.map(cable => ({
            id: cable.id,
            coordinates: [
                [cable.start_odp_latitude, cable.start_odp_longitude],
                [cable.end_odp_latitude, cable.end_odp_longitude]
            ],
            from: cable.start_odp_name,
            to: cable.end_odp_name,
            type: cable.segment_type || 'Backbone',
            length: cable.cable_length || 'N/A',
            status: cable.status,
            name: cable.name,
            notes: cable.notes
        }));
        
        console.log('📋 Formatted backbone cables for API:');
        formattedBackboneCables.forEach((cable, index) => {
            console.log(`\n🌐 Formatted Cable #${index + 1}:`);
            console.log(`   ID: ${cable.id}`);
            console.log(`   Name: ${cable.name}`);
            console.log(`   Coordinates: [${cable.coordinates[0][0]}, ${cable.coordinates[0][1]}] → [${cable.coordinates[1][0]}, ${cable.coordinates[1][1]}]`);
            console.log(`   From: ${cable.from}`);
            console.log(`   To: ${cable.to}`);
            console.log(`   Type: ${cable.type}`);
            console.log(`   Status: ${cable.status}`);
            console.log(`   Length: ${cable.length}`);
            
            // Validate coordinates format
            const validCoordsFormat = Array.isArray(cable.coordinates) && 
                                    cable.coordinates.length === 2 &&
                                    Array.isArray(cable.coordinates[0]) &&
                                    Array.isArray(cable.coordinates[1]) &&
                                    cable.coordinates[0].length === 2 &&
                                    cable.coordinates[1].length === 2;
            console.log(`   Valid Coords Format: ${validCoordsFormat ? '✅' : '❌'}`);
        });
        
        // Summary
        const validCables = backboneCables.filter(c => 
            c.start_odp_latitude && c.start_odp_longitude && 
            c.end_odp_latitude && c.end_odp_longitude
        );
        
        console.log('\n📊 === SUMMARY ===');
        console.log(`✅ Total backbone cables: ${backboneCables.length}`);
        console.log(`✅ Valid backbone cables: ${validCables.length}`);
        console.log(`✅ Formatted for API: ${formattedBackboneCables.length}`);
        
        if (validCables.length === 0) {
            console.log('\n❌ ISSUE: No valid backbone cables found!');
            console.log('   This means backbone connections cannot be visualized on the map.');
        } else {
            console.log('\n🎉 SUCCESS: Backbone cables are ready for visualization!');
        }
        
    } catch (error) {
        console.error('❌ Error debugging backbone cables:', error);
    } finally {
        db.close();
    }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

// Jalankan debug
debugBackboneCables();
