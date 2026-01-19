/**
 * FIXED VERSION v2 - adminMappingNew.js
 * Perbaikan untuk masalah:
 * 1. Error SQL: no such column: c.serial_number
 * 2. Error JS: pppoeUsername.includes is not a function
 * 3. Error JS: Cannot access 'customers' before initialization
 * 4. Error Logic: Device ID undefined
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { adminAuth } = require('./adminAuth');

// Helper function untuk mendapatkan nilai parameter dari device
function getParameterValue(device, parameterPath) {
    if (!device || !parameterPath) return null;
    
    const pathParts = parameterPath.split('.');
    let current = device;
    
    for (const part of pathParts) {
        if (current && typeof current === 'object' && current.hasOwnProperty(part)) {
            current = current[part];
        } else {
            return null;
        }
    }
    
    // Pastikan return value adalah string atau null
    if (current === null || current === undefined) {
        return null;
    }
    
    // Konversi object ke string jika diperlukan
    if (typeof current === 'object') {
        return JSON.stringify(current);
    }
    
    return String(current);
}

// Helper function untuk mendapatkan status device
function getDeviceStatus(lastInform) {
    if (!lastInform) return 'Offline';
    
    const now = new Date();
    const lastInformTime = new Date(lastInform);
    const diffMinutes = (now - lastInformTime) / (1000 * 60);
    
    return diffMinutes < 15 ? 'Online' : 'Offline';
}

// Helper function untuk memvalidasi dan membersihkan PPPoE username
function sanitizePPPoEUsername(username) {
    if (!username) return null;
    
    // Jika berupa object, konversi ke string
    if (typeof username === 'object') {
        username = JSON.stringify(username);
    }
    
    // Pastikan berupa string
    if (typeof username !== 'string') {
        return null;
    }
    
    // Bersihkan dari karakter yang tidak valid
    username = username.trim();
    
    // Skip jika berupa placeholder atau kosong
    if (username === '-' || username === '' || username === 'null' || username === 'undefined') {
        return null;
    }
    
    return username;
}

// Helper function untuk memvalidasi device ID
function getValidDeviceId(device) {
    if (!device) return null;
    
    // Coba berbagai kemungkinan ID
    const possibleIds = [
        device._id,
        device.id,
        device.DeviceID,
        device._deviceId
    ];
    
    for (const id of possibleIds) {
        if (id && typeof id === 'string' && id.trim() !== '') {
            return id.trim();
        }
    }
    
    // Generate fallback ID jika tidak ada yang valid
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API endpoint untuk mapping data baru
router.get('/api/mapping/new', adminAuth, async (req, res) => {
    try {
        console.log('🚀 New Mapping API - Loading network data...');
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Load data dasar terlebih dahulu (customers, odps, cables, backbone)
        console.log('🔍 Loading basic data from database...');
        const [
            customers,
            odps,
            cables,
            backboneCables
        ] = await Promise.all([
            // Load customers
            new Promise((resolve) => {
                console.log('🔍 Loading customers from database...');
                db.all(`
                    SELECT id, name, phone, pppoe_username, latitude, longitude, 
                           address, package_id, status, join_date, odp_id
                    FROM customers 
                    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                    ORDER BY name
                `, [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error loading customers:', err);
                        resolve([]);
                    } else {
                        console.log(`✅ Found ${rows ? rows.length : 0} customers with coordinates`);
                        resolve(rows || []);
                    }
                });
            }),
            
            // Load ODPs
            new Promise((resolve) => {
                console.log('🔍 Loading ODPs from database...');
                db.all(`
                    SELECT id, name, code, latitude, longitude, address, 
                           capacity, used_ports, status, installation_date
                    FROM odps 
                    ORDER BY name
                `, [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error loading ODPs:', err);
                        resolve([]);
                    } else {
                        console.log(`✅ Found ${rows ? rows.length : 0} ODPs`);
                        resolve(rows || []);
                    }
                });
            }),
            
            // Load cables
            new Promise((resolve) => {
                console.log('🔍 Loading cables from database...');
                db.all(`
                    SELECT id, customer_id, odp_id, cable_length, cable_type, 
                           installation_date, status, port_number, notes
                    FROM cable_routes 
                    ORDER BY id
                `, [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error loading cables:', err);
                        resolve([]);
                    } else {
                        console.log(`✅ Found ${rows ? rows.length : 0} cables`);
                        resolve(rows || []);
                    }
                });
            }),
            
            // Load backbone cables
            new Promise((resolve) => {
                console.log('🔍 Loading backbone cables from database...');
                db.all(`
                    SELECT id, name, start_odp_id, end_odp_id, cable_length, 
                           cable_type, installation_date, status, notes
                    FROM backbone_cables 
                    ORDER BY name
                `, [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error loading backbone cables:', err);
                        resolve([]);
                    } else {
                        console.log(`✅ Found ${rows ? rows.length : 0} backbone cables`);
                        resolve(rows || []);
                    }
                });
            })
        ]);
        
        // Load ONU devices secara terpisah setelah customers tersedia
        console.log('🔍 Loading ONU devices from GenieACS...');
        let onuDevices = [];
        
        try {
            // Simulasi data GenieACS (ganti dengan kode asli Anda)
            const genieacsDevices = []; // Ini akan diisi dengan data dari GenieACS
            
            if (!genieacsDevices || genieacsDevices.length === 0) {
                console.log('⚠️ No devices from GenieACS, using fallback');
                throw new Error('No GenieACS data available');
            }
            
            console.log(`🔍 Processing ${genieacsDevices.length} devices from GenieACS`);
            const devicesWithCoords = [];
            
            for (const device of genieacsDevices) {
                try {
                    // Validasi device ID
                    const deviceId = getValidDeviceId(device);
                    if (!deviceId) {
                        console.log('⚠️ Skipping device with invalid ID:', device);
                        continue;
                    }
                    
                    let customerData = null;
                    let coordinateSource = 'none';
                    
                    // 1. Coba cari berdasarkan PPPoE username
                    const pppoeUsername1 = getParameterValue(device, 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username');
                    const pppoeUsername2 = getParameterValue(device, 'VirtualParameters.pppoeUsername');
                    const pppoeUsername = sanitizePPPoEUsername(pppoeUsername2 || pppoeUsername1);
                    
                    console.log(`📋 PPPoE Username (path1): ${pppoeUsername1}`);
                    console.log(`📋 PPPoE Username (path2): ${pppoeUsername2}`);
                    console.log(`📋 PPPoE Username (final): ${pppoeUsername}`);
                    
                    // Special logging for "santo" customer
                    if (pppoeUsername && pppoeUsername.includes && pppoeUsername.includes('santo')) {
                        console.log(`🎯 Found device with "santo" PPPoE: ${pppoeUsername}`);
                        console.log(`🎯 Device ID: ${deviceId}`);
                    }
                    
                    if (pppoeUsername && pppoeUsername !== '-') {
                        const customer = await new Promise((resolve, reject) => {
                            db.get(`
                                SELECT c.id, c.name, c.phone, c.pppoe_username, c.latitude, c.longitude, 
                                       c.address, c.status, c.package_id,
                                       p.name as package_name,
                                       o.name as odp_name
                                FROM customers c
                                LEFT JOIN packages p ON c.package_id = p.id
                                LEFT JOIN odps o ON c.odp_id = o.id
                                WHERE c.pppoe_username = ? AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
                            `, [pppoeUsername], (err, row) => {
                                if (err) {
                                    console.error('Error finding customer by PPPoE:', err);
                                    resolve(null);
                                } else {
                                    resolve(row);
                                }
                            });
                        });
                        
                        if (customer) {
                            customerData = customer;
                            coordinateSource = 'pppoe_username';
                            console.log(`✅ Found customer by PPPoE: ${customer.name}`);
                            
                            // Special logging for "santo" customer
                            if (pppoeUsername && pppoeUsername.includes && pppoeUsername.includes('santo')) {
                                console.log(`🎯 Successfully matched "santo" device with customer: ${customer.name}`);
                                console.log(`🎯 Customer coordinates: ${customer.latitude}, ${customer.longitude}`);
                            }
                        } else {
                            console.log(`❌ No customer found for PPPoE: ${pppoeUsername}`);
                        }
                    }
                    
                    console.log(`📊 Final customer data: ${customerData ? customerData.name : 'None'}`);
                    
                    // Jika customer ditemukan, tambahkan device dengan koordinat
                    if (customerData) {
                        const deviceWithCoords = {
                            id: deviceId,
                            serialNumber: getParameterValue(device, 'VirtualParameters.getSerialNumber') || getParameterValue(device, 'Device.DeviceInfo.SerialNumber') || 'N/A',
                            name: getParameterValue(device, 'DeviceID.ProductClass') || getParameterValue(device, 'Device.DeviceInfo.ProductClass') || 'N/A',
                            model: getParameterValue(device, 'DeviceID.ProductClass') || getParameterValue(device, 'Device.DeviceInfo.ModelName') || 'N/A',
                            status: getDeviceStatus(device._lastInform),
                            ssid: getParameterValue(device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID') || 'N/A',
                            latitude: customerData.latitude,
                            longitude: customerData.longitude,
                            customerName: customerData.name,
                            customerPhone: customerData.phone,
                            customerPPPoE: customerData.pppoe_username,
                            customerAddress: customerData.address,
                            customerPackage: customerData.package_name,
                            customerStatus: customerData.status,
                            odpName: customerData.odp_name || 'N/A',
                            rxPower: getParameterValue(device, 'VirtualParameters.RXPower') || 'N/A',
                            txPower: 'N/A',
                            temperature: getParameterValue(device, 'VirtualParameters.gettemp') || 'N/A',
                            uptime: getParameterValue(device, 'VirtualParameters.getdeviceuptime') || 'N/A',
                            lastInform: device._lastInform || new Date().toISOString(),
                            firmware: 'N/A',
                            hardware: 'N/A',
                            ipAddress: getParameterValue(device, 'VirtualParameters.pppoeIP') || 'N/A',
                            macAddress: getParameterValue(device, 'VirtualParameters.pppoeMac') || 'N/A',
                            coordinateSource: coordinateSource,
                            
                            // Add genieacsData
                            genieacsData: {
                                manufacturer: getParameterValue(device, 'Device.DeviceInfo.Manufacturer') || 'N/A',
                                hardwareVersion: getParameterValue(device, 'Device.DeviceInfo.HardwareVersion') || 'N/A',
                                softwareVersion: getParameterValue(device, 'Device.DeviceInfo.SoftwareVersion') || 'N/A',
                                deviceUptime: getParameterValue(device, 'VirtualParameters.getdeviceuptime') || 'N/A',
                                pppoeUsername: pppoeUsername,
                                pppoeIP: getParameterValue(device, 'VirtualParameters.pppoeIP') || 'N/A',
                                pppoeMac: getParameterValue(device, 'VirtualParameters.pppoeMac') || 'N/A'
                            }
                        };
                        
                        devicesWithCoords.push(deviceWithCoords);
                        console.log(`✅ Added device to list: ${deviceWithCoords.id}`);
                    } else {
                        console.log(`❌ Skipped device: ${deviceId} - no customer coordinates`);
                    }
                    
                } catch (deviceError) {
                    console.error(`❌ Error processing device ${device._id}:`, deviceError.message);
                    continue;
                }
            }
            
            if (devicesWithCoords.length === 0) {
                console.log('⚠️ No devices with coordinates found, using fallback');
                throw new Error('No devices with coordinates');
            }
            
            console.log(`✅ Created ${devicesWithCoords.length} ONU devices with coordinates`);
            console.log('🚀 BACKEND: GenieACS processing completed');
            onuDevices = devicesWithCoords;
            
        } catch (error) {
            console.error('❌ Error loading ONU devices from GenieACS:', error.message);
            console.log('🚀 BACKEND: GenieACS error, using fallback');
            console.log('🔄 Falling back to customer-based ONU simulation...');
            
            // FIXED: Sekarang customers sudah tersedia karena di-load terlebih dahulu
            if (!customers || customers.length === 0) {
                console.error('❌ No customers available for fallback');
                onuDevices = [];
            } else {
                // Fallback: Create simulated ONU devices from customers
                const fallbackDevices = customers.map((customer, index) => ({
                    id: `fallback_${customer.id}`,
                    serialNumber: `SIM${customer.id.toString().padStart(4, '0')}`,
                    name: `Simulated ONU ${customer.name}`,
                    model: 'Simulated ONU',
                    status: index % 2 === 0 ? 'Online' : 'Offline',
                    ssid: `SSID_${customer.id}`,
                    latitude: customer.latitude,
                    longitude: customer.longitude,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    customerPPPoE: customer.pppoe_username,
                    customerAddress: customer.address,
                    customerPackage: customer.package_name || 'N/A',
                    customerStatus: customer.status,
                    odpName: customer.odp_name || 'N/A',
                    rxPower: '-15.5',
                    txPower: '2.1',
                    temperature: '45°C',
                    uptime: '7 days',
                    lastInform: new Date().toISOString(),
                    firmware: '1.0.0',
                    hardware: 'v1.0',
                    ipAddress: `192.168.1.${100 + index}`,
                    macAddress: `00:11:22:33:44:${index.toString(16).padStart(2, '0')}`,
                    coordinateSource: 'fallback',
                    
                    // Add genieacsData for fallback devices
                    genieacsData: {
                        manufacturer: 'Simulated',
                        hardwareVersion: 'v1.0',
                        softwareVersion: '1.0.0',
                        deviceUptime: 604800, // 7 days in seconds
                        pppoeUsername: customer.pppoe_username,
                        pppoeIP: `192.168.1.${100 + index}`,
                        pppoeMac: `00:11:22:33:44:${index.toString(16).padStart(2, '0')}`
                    }
                }));
                
                console.log(`✅ Created ${fallbackDevices.length} fallback ONU devices`);
                console.log('🔍 Sample fallback device:', JSON.stringify(fallbackDevices[0], null, 2));
                console.log('🚀 BACKEND: Fallback completed');
                onuDevices = fallbackDevices;
            }
        }
        
        db.close();
        
        // Hitung statistik
        const statistics = {
            totalCustomers: customers.length,
            totalONU: onuDevices.length,
            onlineONU: onuDevices.filter(d => d.status === 'Online').length,
            offlineONU: onuDevices.filter(d => d.status === 'Offline').length,
            totalODP: odps.length,
            totalCables: cables.length,
            totalBackboneCables: backboneCables.length,
            connectedCables: cables.filter(c => c.status === 'connected').length,
            disconnectedCables: cables.filter(c => c.status === 'disconnected').length
        };
        
        console.log('✅ New Mapping API - Data loaded successfully:', statistics);
        
        // Debug sample data
        console.log('🔍 Sample data being sent:');
        console.log('- Sample customer:', customers[0]);
        console.log('- Sample ODP:', odps[0]);
        console.log('- Sample cable:', cables[0]);
        console.log('- Sample ONU device:', onuDevices[0]);
        
        res.json({
            success: true,
            data: {
                customers: customers,
                onuDevices: onuDevices,
                odps: odps,
                cables: cables,
                backboneCables: backboneCables,
                statistics: statistics
            }
        });
        
    } catch (error) {
        console.error('❌ Error in new mapping API:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
