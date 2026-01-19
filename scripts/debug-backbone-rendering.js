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

async function debugBackboneRendering() {
    try {
        console.log('📊 === DEBUGGING BACKBONE CABLES RENDERING ===\n');
        
        // 1. Check network_segments table
        console.log('1️⃣ Checking network_segments table...');
        const networkSegments = await new Promise((resolve, reject) => {
            db.all(`
                SELECT ns.id, ns.name, ns.start_odp_id, ns.end_odp_id, ns.segment_type, ns.status, ns.cable_length,
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
        
        console.log(`📋 Found ${networkSegments.length} network segments:`);
        networkSegments.forEach((segment, index) => {
            console.log(`\n🌐 Segment #${index + 1}:`);
            console.log(`   ID: ${segment.id}`);
            console.log(`   Name: ${segment.name}`);
            console.log(`   Type: ${segment.segment_type}`);
            console.log(`   Status: ${segment.status}`);
            console.log(`   Start ODP: ${segment.start_odp_name} (ID: ${segment.start_odp_id})`);
            console.log(`   Start Coords: ${segment.start_odp_latitude}, ${segment.start_odp_longitude}`);
            console.log(`   End ODP: ${segment.end_odp_name} (ID: ${segment.end_odp_id})`);
            console.log(`   End Coords: ${segment.end_odp_latitude}, ${segment.end_odp_longitude}`);
            
            // Check coordinate validity
            const hasValidCoords = segment.start_odp_latitude && segment.start_odp_longitude && 
                                 segment.end_odp_latitude && segment.end_odp_longitude;
            console.log(`   Valid Coords: ${hasValidCoords ? '✅' : '❌'}`);
            
            if (!hasValidCoords) {
                console.log(`   ⚠️ ISSUE: Missing coordinates for segment ${segment.name}`);
            }
        });
        
        // 2. Check ODPs table
        console.log('\n2️⃣ Checking ODPs table...');
        const odps = await new Promise((resolve, reject) => {
            db.all(`SELECT id, name, code, latitude, longitude, status FROM odps ORDER BY id`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📋 Found ${odps.length} ODPs:`);
        odps.forEach(odp => {
            const hasCoords = odp.latitude && odp.longitude;
            console.log(`   ${odp.id}. ${odp.name} (${odp.code}) - ${odp.latitude}, ${odp.longitude} - Status: ${odp.status} - Coords: ${hasCoords ? '✅' : '❌'}`);
        });
        
        // 3. Simulate API data formatting
        console.log('\n3️⃣ Simulating API data formatting...');
        
        const formattedBackboneCables = networkSegments
            .filter(cable => cable.start_odp_latitude && cable.start_odp_longitude && 
                           cable.end_odp_latitude && cable.end_odp_longitude)
            .map(cable => ({
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
        
        console.log(`📋 Formatted ${formattedBackboneCables.length} backbone cables for API:`);
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
        
        // 4. Check for potential issues
        console.log('\n4️⃣ Checking for potential issues...');
        
        const issues = [];
        
        // Check if any segments have missing coordinates
        const segmentsWithMissingCoords = networkSegments.filter(s => 
            !s.start_odp_latitude || !s.start_odp_longitude || 
            !s.end_odp_latitude || !s.end_odp_longitude
        );
        
        if (segmentsWithMissingCoords.length > 0) {
            issues.push(`❌ ${segmentsWithMissingCoords.length} segments have missing coordinates`);
            segmentsWithMissingCoords.forEach(s => {
                console.log(`   - Segment "${s.name}" (ID: ${s.id}) has missing coordinates`);
            });
        }
        
        // Check if any ODPs are missing
        const segmentOdpIds = new Set();
        networkSegments.forEach(s => {
            segmentOdpIds.add(s.start_odp_id);
            segmentOdpIds.add(s.end_odp_id);
        });
        
        const existingOdpIds = new Set(odps.map(o => o.id));
        const missingOdps = [...segmentOdpIds].filter(id => !existingOdpIds.has(id));
        
        if (missingOdps.length > 0) {
            issues.push(`❌ ${missingOdps.length} ODPs referenced in segments are missing from ODPs table`);
            missingOdps.forEach(id => {
                console.log(`   - ODP ID ${id} is referenced in segments but not found in ODPs table`);
            });
        }
        
        // Check if any ODPs have missing coordinates
        const odpsWithMissingCoords = odps.filter(o => !o.latitude || !o.longitude);
        if (odpsWithMissingCoords.length > 0) {
            issues.push(`❌ ${odpsWithMissingCoords.length} ODPs have missing coordinates`);
            odpsWithMissingCoords.forEach(o => {
                console.log(`   - ODP "${o.name}" (ID: ${o.id}) has missing coordinates`);
            });
        }
        
        // Summary
        console.log('\n📊 === SUMMARY ===');
        console.log(`✅ Total network segments: ${networkSegments.length}`);
        console.log(`✅ Total ODPs: ${odps.length}`);
        console.log(`✅ Segments with valid coordinates: ${formattedBackboneCables.length}`);
        console.log(`✅ Segments with missing coordinates: ${segmentsWithMissingCoords.length}`);
        console.log(`✅ ODPs with missing coordinates: ${odpsWithMissingCoords.length}`);
        
        if (issues.length === 0) {
            console.log('\n🎉 SUCCESS: All backbone cables should render correctly!');
            console.log('   If backbone cables are still not showing, check:');
            console.log('   1. Browser console for JavaScript errors');
            console.log('   2. Network tab for API response');
            console.log('   3. Layer visibility controls');
            console.log('   4. Map zoom level and bounds');
        } else {
            console.log('\n⚠️ ISSUES FOUND:');
            issues.forEach(issue => console.log(`   ${issue}`));
            console.log('\n💡 RECOMMENDATIONS:');
            if (segmentsWithMissingCoords.length > 0) {
                console.log('   - Fix missing coordinates in network segments');
                console.log('   - Run: node scripts/fix-network-segments.js');
            }
            if (odpsWithMissingCoords.length > 0) {
                console.log('   - Add coordinates to ODPs');
                console.log('   - Update ODPs via /admin/cable-network/odp');
            }
        }
        
    } catch (error) {
        console.error('❌ Error debugging backbone rendering:', error);
    } finally {
        db.close();
    }
}

// Jalankan debug
debugBackboneRendering();
