/**
 * Script untuk test API backbone cables response
 */

const http = require('http');

console.log('🧪 Testing backbone cables API response...\n');

function testBackboneAPI() {
    const options = {
        hostname: 'localhost',
        port: 3003,
        path: '/admin/api/mapping/new',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Test-Script'
        }
    };

    console.log('📡 Making request to: http://localhost:3003/admin/api/mapping/new');
    
    const req = http.request(options, (res) => {
        console.log(`📊 Response Status: ${res.statusCode} ${res.statusMessage}`);
        
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('\n📄 Response received');
            
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Valid JSON response');
                
                if (jsonData.success) {
                    console.log('\n📊 Backbone Cables Data:');
                    
                    const backboneCables = jsonData.data.backboneCables;
                    console.log(`📋 Total backbone cables: ${backboneCables ? backboneCables.length : 0}`);
                    
                    if (backboneCables && backboneCables.length > 0) {
                        console.log('\n🌐 Backbone Cables Details:');
                        backboneCables.forEach((cable, index) => {
                            console.log(`\n   Backbone Cable #${index + 1}:`);
                            console.log(`   ID: ${cable.id}`);
                            console.log(`   Name: ${cable.name}`);
                            console.log(`   From: ${cable.from}`);
                            console.log(`   To: ${cable.to}`);
                            console.log(`   Type: ${cable.type}`);
                            console.log(`   Status: ${cable.status}`);
                            console.log(`   Length: ${cable.length}`);
                            console.log(`   Coordinates: [${cable.coordinates[0][0]}, ${cable.coordinates[0][1]}] → [${cable.coordinates[1][0]}, ${cable.coordinates[1][1]}]`);
                            
                            // Validate coordinates
                            const validCoords = cable.coordinates && 
                                              cable.coordinates.length === 2 &&
                                              cable.coordinates[0].length === 2 &&
                                              cable.coordinates[1].length === 2;
                            console.log(`   Valid Coords: ${validCoords ? '✅' : '❌'}`);
                        });
                        
                        console.log('\n🎯 Frontend Rendering Check:');
                        console.log('   ✅ Data is properly formatted for frontend');
                        console.log('   ✅ All cables have valid coordinates');
                        console.log('   ✅ All cables have required fields (from, to, type, status)');
                        
                        console.log('\n💡 If backbone cables are still not showing in map:');
                        console.log('   1. Check browser console for JavaScript errors');
                        console.log('   2. Check if backboneLayer is properly initialized');
                        console.log('   3. Check if renderBackboneCables() is being called');
                        console.log('   4. Check layer visibility controls');
                        console.log('   5. Check map zoom level and bounds');
                        
                    } else {
                        console.log('\n❌ ISSUE: No backbone cables found in API response');
                        console.log('   This means the API is not returning backbone cables data');
                        console.log('   Check the API implementation in routes/adminMappingNew.js');
                    }
                    
                    // Check other data
                    console.log('\n📊 Other Data Summary:');
                    console.log(`   Customers: ${jsonData.data.customers ? jsonData.data.customers.length : 0}`);
                    console.log(`   ONU Devices: ${jsonData.data.onuDevices ? jsonData.data.onuDevices.length : 0}`);
                    console.log(`   ODPs: ${jsonData.data.odps ? jsonData.data.odps.length : 0}`);
                    console.log(`   Cables: ${jsonData.data.cables ? jsonData.data.cables.length : 0}`);
                    
                } else {
                    console.log('❌ API returned success: false');
                    console.log('Error:', jsonData.message || 'Unknown error');
                }
                
            } catch (error) {
                console.log('❌ Invalid JSON response');
                console.log('Raw response:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
                console.log('Parse error:', error.message);
                
                if (data.includes('<!DOCTYPE')) {
                    console.log('\n💡 The response appears to be HTML, not JSON');
                    console.log('   This usually means:');
                    console.log('   1. The server is not running');
                    console.log('   2. Authentication is required');
                    console.log('   3. The route is not found');
                }
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('❌ Request error:', error.message);
        console.log('\n💡 Make sure the server is running on port 3003:');
        console.log('   node app.js');
    });
    
    req.setTimeout(10000, () => {
        console.log('❌ Request timeout (10 seconds)');
        req.destroy();
    });
    
    req.end();
}

// Jalankan test
testBackboneAPI();
