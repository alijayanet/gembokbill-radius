/**
 * Script untuk test RXPower extraction dari GenieACS
 */

const { getDevicesCached } = require('../config/genieacs');

console.log('🔍 Testing RXPower extraction from GenieACS...\n');

// Helper function untuk mendapatkan parameter value dari device GenieACS
function getParameterValue(device, parameterPath) {
    try {
        const parts = parameterPath.split('.');
        let current = device;
        
        for (const part of parts) {
            if (!current) return null;
            current = current[part];
        }
        
        // Check if it's a GenieACS parameter object
        if (current && current._value !== undefined) {
            return current._value;
        }
        
        return current || null;
    } catch (error) {
        console.error(`Error getting parameter ${parameterPath}:`, error);
        return null;
    }
}

// Helper function untuk mendapatkan nilai RXPower dengan multiple paths
function getRXPowerValue(device) {
    try {
        // Paths yang mungkin berisi nilai RXPower
        const rxPowerPaths = [
            'VirtualParameters.RXPower',
            'VirtualParameters.redaman',
            'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.RXPower',
            'Device.XPON.Interface.1.Stats.RXPower',
            'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.RXPower._value',
            'VirtualParameters.RXPower._value',
            'Device.XPON.Interface.1.Stats.RXPower._value'
        ];
        
        let rxPower = null;
        
        // Periksa setiap jalur yang mungkin berisi nilai RXPower
        for (const path of rxPowerPaths) {
            const value = getParameterValue(device, path);
            if (value !== null && value !== undefined && value !== '') {
                // Validasi apakah nilai berupa angka
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    rxPower = value;
                    console.log(`📡 Found RXPower: ${rxPower} dBm from path: ${path}`);
                    break;
                }
            }
        }
        
        return rxPower;
    } catch (error) {
        console.error('Error getting RXPower:', error);
        return null;
    }
}

async function testRXPowerExtraction() {
    try {
        console.log('📡 Loading devices from GenieACS...');
        const devices = await getDevicesCached();
        
        console.log(`📊 Found ${devices.length} devices from GenieACS`);
        
        if (devices.length === 0) {
            console.log('⚠️ No devices found from GenieACS');
            return;
        }
        
        // Test RXPower extraction untuk 5 device pertama
        const devicesToTest = devices.slice(0, 5);
        
        console.log('\n🔍 Testing RXPower extraction for first 5 devices:');
        
        devicesToTest.forEach((device, index) => {
            console.log(`\n📡 Device ${index + 1}: ${device._id}`);
            
            // Debug device structure
            console.log('📋 Device keys:', Object.keys(device));
            
            if (device.VirtualParameters) {
                console.log('📋 VirtualParameters keys:', Object.keys(device.VirtualParameters));
            }
            
            if (device.InternetGatewayDevice) {
                console.log('📋 InternetGatewayDevice keys:', Object.keys(device.InternetGatewayDevice));
            }
            
            // Test RXPower extraction
            const rxPower = getRXPowerValue(device);
            console.log(`📡 RXPower result: ${rxPower}`);
            
            // Test individual paths
            const paths = [
                'VirtualParameters.RXPower',
                'VirtualParameters.redaman',
                'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.RXPower',
                'Device.XPON.Interface.1.Stats.RXPower'
            ];
            
            paths.forEach(path => {
                const value = getParameterValue(device, path);
                console.log(`   ${path}: ${value}`);
            });
        });
        
        // Summary
        console.log('\n📊 Summary:');
        let devicesWithRXPower = 0;
        
        devices.forEach(device => {
            const rxPower = getRXPowerValue(device);
            if (rxPower !== null) {
                devicesWithRXPower++;
            }
        });
        
        console.log(`✅ Devices with RXPower data: ${devicesWithRXPower}/${devices.length}`);
        
        if (devicesWithRXPower === 0) {
            console.log('⚠️ No devices have RXPower data - this might be why RXPower is not showing');
            console.log('💡 Check if GenieACS is properly configured and devices are reporting power data');
        } else {
            console.log('🎉 RXPower extraction is working!');
        }
        
    } catch (error) {
        console.error('❌ Error testing RXPower extraction:', error);
    }
}

// Jalankan test
testRXPowerExtraction();
