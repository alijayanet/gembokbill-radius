/**
 * Script untuk test API response mapping
 */

const http = require('http');

console.log('🧪 Testing API response for mapping...\n');

function testAPI() {
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
        console.log(`📋 Response Headers:`, res.headers);
        
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('\n📄 Response Body:');
            
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Valid JSON response');
                
                if (jsonData.success) {
                    console.log('\n📊 API Data Summary:');
                    console.log(`   - Customers: ${jsonData.data.customers ? jsonData.data.customers.length : 0}`);
                    console.log(`   - ONU Devices: ${jsonData.data.onuDevices ? jsonData.data.onuDevices.length : 0}`);
                    console.log(`   - ODPs: ${jsonData.data.odps ? jsonData.data.odps.length : 0}`);
                    console.log(`   - Cables: ${jsonData.data.cables ? jsonData.data.cables.length : 0}`);
                    console.log(`   - Backbone Cables: ${jsonData.data.backboneCables ? jsonData.data.backboneCables.length : 0}`);
                    
                    // Check cable data
                    if (jsonData.data.cables && jsonData.data.cables.length > 0) {
                        console.log('\n🔌 Sample Cable Data:');
                        const sampleCable = jsonData.data.cables[0];
                        console.log(`   Customer: ${sampleCable.customer_name}`);
                        console.log(`   Customer Coords: ${sampleCable.customer_latitude}, ${sampleCable.customer_longitude}`);
                        console.log(`   ODP: ${sampleCable.odp_name}`);
                        console.log(`   ODP Coords: ${sampleCable.odp_latitude}, ${sampleCable.odp_longitude}`);
                        console.log(`   Status: ${sampleCable.status}`);
                        console.log(`   Has Valid Coords: ${sampleCable.customer_latitude && sampleCable.customer_longitude && sampleCable.odp_latitude && sampleCable.odp_longitude ? '✅' : '❌'}`);
                    }
                    
                    // Check backbone cable data
                    if (jsonData.data.backboneCables && jsonData.data.backboneCables.length > 0) {
                        console.log('\n🌐 Sample Backbone Cable Data:');
                        const sampleBackbone = jsonData.data.backboneCables[0];
                        console.log(`   Name: ${sampleBackbone.name}`);
                        console.log(`   From ODP: ${sampleBackbone.start_odp_name}`);
                        console.log(`   From Coords: ${sampleBackbone.start_odp_latitude}, ${sampleBackbone.start_odp_longitude}`);
                        console.log(`   To ODP: ${sampleBackbone.end_odp_name}`);
                        console.log(`   To Coords: ${sampleBackbone.end_odp_latitude}, ${sampleBackbone.end_odp_longitude}`);
                        console.log(`   Status: ${sampleBackbone.status}`);
                        console.log(`   Has Valid Coords: ${sampleBackbone.start_odp_latitude && sampleBackbone.start_odp_longitude && sampleBackbone.end_odp_latitude && sampleBackbone.end_odp_longitude ? '✅' : '❌'}`);
                    }
                    
                    // Check if all data is ready for visualization
                    const validCables = jsonData.data.cables ? jsonData.data.cables.filter(c => c.customer_latitude && c.customer_longitude && c.odp_latitude && c.odp_longitude) : [];
                    const validBackboneCables = jsonData.data.backboneCables ? jsonData.data.backboneCables.filter(b => b.start_odp_latitude && b.start_odp_longitude && b.end_odp_latitude && b.end_odp_longitude) : [];
                    
                    console.log('\n🎯 Visualization Readiness:');
                    console.log(`   - Valid Cable Routes: ${validCables.length}/${jsonData.data.cables ? jsonData.data.cables.length : 0}`);
                    console.log(`   - Valid Backbone Cables: ${validBackboneCables.length}/${jsonData.data.backboneCables ? jsonData.data.backboneCables.length : 0}`);
                    
                    if (validCables.length > 0 && validBackboneCables.length > 0) {
                        console.log('\n🎉 SUCCESS: API data is ready for cable visualization!');
                        console.log('   ✅ Cable routes (Customer → ODP) can be rendered');
                        console.log('   ✅ Backbone cables (ODP → ODP) can be rendered');
                    } else if (validCables.length > 0) {
                        console.log('\n⚠️ PARTIAL: Only cable routes can be rendered');
                        console.log('   ✅ Cable routes (Customer → ODP) can be rendered');
                        console.log('   ❌ Backbone cables (ODP → ODP) cannot be rendered');
                    } else {
                        console.log('\n❌ ISSUE: No valid cable data for visualization');
                    }
                    
                } else {
                    console.log('❌ API returned success: false');
                    console.log('Error:', jsonData.message || 'Unknown error');
                }
                
            } catch (error) {
                console.log('❌ Invalid JSON response');
                console.log('Raw response:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
                console.log('Parse error:', error.message);
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('❌ Request error:', error.message);
        console.log('\n💡 Make sure the server is running:');
        console.log('   pm2 restart gembok-bill');
        console.log('   or');
        console.log('   node app.js');
    });
    
    req.setTimeout(10000, () => {
        console.log('❌ Request timeout (10 seconds)');
        req.destroy();
    });
    
    req.end();
}

// Jalankan test
testAPI();
