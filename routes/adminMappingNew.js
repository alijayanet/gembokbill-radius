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

// Helper function untuk mendapatkan device status
function getDeviceStatus(lastInform) {
    if (!lastInform) return 'Offline';
    
    const now = new Date();
    const lastInformTime = new Date(lastInform);
    const diffMinutes = (now - lastInformTime) / (1000 * 60);
    
    if (diffMinutes <= 60) return 'Online';
    if (diffMinutes <= 1440) return 'Warning'; // 24 hours
    return 'Offline';
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

// Helper function untuk mendapatkan nilai TXPower dengan multiple paths
function getTXPowerValue(device) {
    try {
        // Paths yang mungkin berisi nilai TXPower
        const txPowerPaths = [
            'VirtualParameters.TXPower',
            'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.TXPower',
            'Device.XPON.Interface.1.Stats.TXPower',
            'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.TXPower._value',
            'VirtualParameters.TXPower._value',
            'Device.XPON.Interface.1.Stats.TXPower._value'
        ];
        
        let txPower = null;
        
        // Periksa setiap jalur yang mungkin berisi nilai TXPower
        for (const path of txPowerPaths) {
            const value = getParameterValue(device, path);
            if (value !== null && value !== undefined && value !== '') {
                // Validasi apakah nilai berupa angka
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    txPower = value;
                    console.log(`📡 Found TXPower: ${txPower} dBm from path: ${path}`);
                    break;
                }
            }
        }
        
        return txPower;
    } catch (error) {
        console.error('Error getting TXPower:', error);
        return null;
    }
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
                        if (rows && rows.length > 0) {
                            console.log('📋 Sample ODP data:', JSON.stringify(rows[0], null, 2));
                        } else {
                            console.log('⚠️ No ODPs found in database - this might be why ODPs are not showing on map');
                        }
                        resolve(rows || []);
                    }
                });
            }),
            
            // Load cables with customer and ODP coordinates
            new Promise((resolve) => {
                console.log('🔍 Loading cables from database with coordinates...');
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
                    WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL 
                    AND o.latitude IS NOT NULL AND o.longitude IS NOT NULL
                    ORDER BY cr.id
                `, [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error loading cables:', err);
                        resolve([]);
                    } else {
                        console.log(`✅ Found ${rows ? rows.length : 0} cables with coordinates`);
                        if (rows && rows.length > 0) {
                            console.log('📋 Sample cable data:', JSON.stringify(rows[0], null, 2));
                        } else {
                            console.log('⚠️ No cables found with valid coordinates - this might be why cables are not showing on map');
                        }
                        resolve(rows || []);
                    }
                });
            }),
            
            // Load network segments and ODP connections (backbone cables) with ODP coordinates
            new Promise((resolve) => {
                console.log('🔍 Loading network segments and ODP connections from database with coordinates...');
                
                // Combine data from both network_segments and odp_connections tables
                db.all(`
                    SELECT ns.id, ns.name, ns.start_odp_id, ns.end_odp_id, ns.cable_length, 
                           ns.segment_type, ns.installation_date, ns.status, ns.notes,
                           start_odp.name as start_odp_name, start_odp.code as start_odp_code,
                           start_odp.latitude as start_odp_latitude, start_odp.longitude as start_odp_longitude,
                           end_odp.name as end_odp_name, end_odp.code as end_odp_code,
                           end_odp.latitude as end_odp_latitude, end_odp.longitude as end_odp_longitude,
                           'network_segments' as source_table
                    FROM network_segments ns
                    LEFT JOIN odps start_odp ON ns.start_odp_id = start_odp.id
                    LEFT JOIN odps end_odp ON ns.end_odp_id = end_odp.id
                    WHERE start_odp.latitude IS NOT NULL AND start_odp.longitude IS NOT NULL 
                      AND end_odp.latitude IS NOT NULL AND end_odp.longitude IS NOT NULL
                    
                    UNION ALL
                    
                    SELECT oc.id + 10000 as id, 
                           'Connection-' || from_odp.name || '-' || to_odp.name as name,
                           oc.from_odp_id as start_odp_id, oc.to_odp_id as end_odp_id, 
                           oc.cable_length, oc.connection_type as segment_type, 
                           oc.installation_date, oc.status, oc.notes,
                           from_odp.name as start_odp_name, from_odp.code as start_odp_code,
                           from_odp.latitude as start_odp_latitude, from_odp.longitude as start_odp_longitude,
                           to_odp.name as end_odp_name, to_odp.code as end_odp_code,
                           to_odp.latitude as end_odp_latitude, to_odp.longitude as end_odp_longitude,
                           'odp_connections' as source_table
                    FROM odp_connections oc
                    LEFT JOIN odps from_odp ON oc.from_odp_id = from_odp.id
                    LEFT JOIN odps to_odp ON oc.to_odp_id = to_odp.id
                    WHERE from_odp.latitude IS NOT NULL AND from_odp.longitude IS NOT NULL 
                      AND to_odp.latitude IS NOT NULL AND to_odp.longitude IS NOT NULL
                      AND oc.status = 'active'
                    
                    ORDER BY name
                `, [], (err, rows) => {
                    if (err) {
                        console.error('❌ Error loading backbone cables:', err);
                        resolve([]);
                    } else {
                        console.log(`✅ Found ${rows ? rows.length : 0} backbone cables (network segments + ODP connections)`);
                        if (rows && rows.length > 0) {
                            console.log('📋 Sample backbone cable data:', JSON.stringify(rows[0], null, 2));
                        } else {
                            console.log('⚠️ No backbone cables found with valid coordinates');
                        }
                        resolve(rows || []);
                    }
                });
            })
        ]);
        
        // Load ONU devices secara terpisah setelah customers tersedia
                    console.log('🔍 Loading ONU devices from GenieACS...');
        let onuDevices = [];
        
        try {
            // Load data asli dari GenieACS
            const { getDevicesCached } = require('../config/genieacs');
            const genieacsDevices = await getDevicesCached();
            
            console.log(`📊 Found ${genieacsDevices.length} devices from GenieACS`);
            
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
                    
                    // Debug RXPower extraction
                    const rxPowerValue = getRXPowerValue(device);
                    console.log(`📡 RXPower for device ${deviceId}: ${rxPowerValue}`);
                    
                    // Debug TXPower extraction
                    const txPowerValue = getTXPowerValue(device);
                    console.log(`📡 TXPower for device ${deviceId}: ${txPowerValue}`);
                        
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
                                   serialNumber: getParameterValue(device, 'VirtualParameters.getSerialNumber') || 
                                               getParameterValue(device, 'Device.DeviceInfo.SerialNumber') ||
                                               getParameterValue(device, 'DeviceID.SerialNumber') || 'N/A',
                                   name: getParameterValue(device, 'DeviceID.ProductClass') || 
                                        getParameterValue(device, 'Device.DeviceInfo.ProductClass') || 'N/A',
                                   model: getParameterValue(device, 'DeviceID.ProductClass') || 
                                         getParameterValue(device, 'Device.DeviceInfo.ModelName') ||
                                         getParameterValue(device, 'Device.DeviceInfo.ProductClass') || 'N/A',
                                status: getDeviceStatus(device._lastInform),
                                   ssid: getParameterValue(device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID') || 
                                        getParameterValue(device, 'Device.WiFi.SSID.1.SSID') ||
                                        getParameterValue(device, 'VirtualParameters.wifiSSID') || 'N/A',
                                   password: getParameterValue(device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase') || 
                                            getParameterValue(device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase') ||
                                            getParameterValue(device, 'VirtualParameters.wifiPassword') || 'N/A',
                                latitude: customerData.latitude,
                                longitude: customerData.longitude,
                                customerName: customerData.name,
                                customerPhone: customerData.phone,
                                customerPPPoE: customerData.pppoe_username,
                                customerAddress: customerData.address,
                                customerPackage: customerData.package_name,
                                customerStatus: customerData.status,
                                odpName: customerData.odp_name || 'N/A',
                                   rxPower: getRXPowerValue(device) || 'N/A',
                                   txPower: getTXPowerValue(device) || 'N/A',
                                   temperature: getParameterValue(device, 'VirtualParameters.gettemp') || 
                                              getParameterValue(device, 'VirtualParameters.temperature') || 'N/A',
                                   uptime: getParameterValue(device, 'VirtualParameters.getdeviceuptime') || 
                                          getParameterValue(device, 'VirtualParameters.deviceUptime') || 'N/A',
                                   lastInform: device._lastInform || new Date().toISOString(),
                                   firmware: getParameterValue(device, 'Device.DeviceInfo.SoftwareVersion') ||
                                           getParameterValue(device, 'InternetGatewayDevice.DeviceInfo.SoftwareVersion') || 'N/A',
                                   hardware: getParameterValue(device, 'Device.DeviceInfo.HardwareVersion') ||
                                           getParameterValue(device, 'InternetGatewayDevice.DeviceInfo.HardwareVersion') || 'N/A',
                                   ipAddress: getParameterValue(device, 'VirtualParameters.pppoeIP') || 
                                            getParameterValue(device, 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ExternalIPAddress') || 'N/A',
                                   macAddress: getParameterValue(device, 'VirtualParameters.pppoeMac') || 
                                             getParameterValue(device, 'InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.1.MACAddress') || 'N/A',
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
        
        // Format cables untuk frontend dengan koordinat array
        const formattedCables = cables.map(cable => ({
            id: cable.id,
            coordinates: [
                [cable.odp_latitude, cable.odp_longitude],
                [cable.customer_latitude, cable.customer_longitude]
            ],
            from: cable.odp_name,
            to: cable.customer_name,
            type: 'Access Cable',
            length: cable.cable_length || 'N/A',
            status: cable.status,
            customer_name: cable.customer_name,
            customer_phone: cable.customer_phone,
            odp_name: cable.odp_name,
            port_number: cable.port_number,
            notes: cable.notes
        }));
        
        // Format backbone cables untuk frontend dengan koordinat array
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
        
        console.log('✅ New Mapping API - Data loaded successfully:', statistics);
        
        // Debug sample data
        console.log('🔍 Sample data being sent:');
        console.log('- Sample customer:', customers[0]);
        console.log('- Sample ODP:', odps[0]);
        console.log('- Sample formatted cable:', formattedCables[0]);
        console.log('- Sample formatted backbone cable:', formattedBackboneCables[0]);
        console.log('- Sample ONU device:', onuDevices[0]);
        
        res.json({
            success: true,
            data: {
                customers: customers,
                onuDevices: onuDevices,
                odps: odps,
                cables: formattedCables,
                backboneCables: formattedBackboneCables,
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

// API endpoint untuk update ONU device
router.post('/update-onu', adminAuth, async (req, res) => {
    try {
        console.log('🔄 Update ONU API - Processing request...');
        console.log('📋 Request data:', req.body);
        
        const { id, name, serial_number, mac_address, ip_address, status, latitude, longitude, customer_id, odp_id } = req.body;
        
        // Validate required fields
        if (!id || !name || !serial_number || !mac_address) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: id, name, serial_number, mac_address'
            });
        }
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Check if ONU device exists in database
        const existingDevice = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id FROM onu_devices WHERE id = ?
            `, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        
        if (existingDevice) {
            // Update existing ONU device
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE onu_devices SET 
                        name = ?, 
                        serial_number = ?, 
                        mac_address = ?, 
                        ip_address = ?, 
                        status = ?, 
                        latitude = ?, 
                        longitude = ?, 
                        customer_id = ?, 
                        odp_id = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [name, serial_number, mac_address, ip_address, status, latitude, longitude, customer_id, odp_id, id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`✅ Updated ONU device: ${id}`);
                        resolve();
                    }
                });
            });
        } else {
            // Insert new ONU device
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO onu_devices (
                        id, name, serial_number, mac_address, ip_address, status, 
                        latitude, longitude, customer_id, odp_id, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [id, name, serial_number, mac_address, ip_address, status, latitude, longitude, customer_id, odp_id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`✅ Created new ONU device: ${id}`);
                        resolve();
                    }
                });
            });
        }
        
        db.close();
        
        console.log('✅ ONU device updated successfully in database');
        
        // Invalidate GenieACS cache after successful update
        try {
            const cacheManager = require('../config/cacheManager');
            cacheManager.invalidatePattern('genieacs:*');
            console.log('🔄 GenieACS cache invalidated after ONU update');
        } catch (cacheError) {
            console.warn('⚠️ Failed to invalidate cache:', cacheError.message);
        }
        
        res.json({
            success: true,
            message: 'ONU device updated successfully',
            data: {
                id: id,
                name: name,
                serial_number: serial_number,
                mac_address: mac_address,
                ip_address: ip_address,
                status: status,
                latitude: latitude,
                longitude: longitude,
                customer_id: customer_id,
                odp_id: odp_id
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating ONU device:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating ONU device: ' + error.message
        });
    }
});

// API endpoint untuk mendapatkan detail ODP
router.get('/odp/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ODP ID is required'
            });
        }
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Get ODP details
        const odp = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id, name, code, capacity, used_ports, status, 
                       address, latitude, longitude, installation_date,
                       created_at, updated_at
                FROM odps 
                WHERE id = ?
            `, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        
        db.close();
        
        if (!odp) {
            return res.status(404).json({
                success: false,
                message: 'ODP not found'
            });
        }
        
        res.json({
            success: true,
            data: odp
        });
        
    } catch (error) {
        console.error('❌ Error getting ODP details:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting ODP details: ' + error.message
        });
    }
});

// API endpoint untuk update ODP
router.post('/update-odp', adminAuth, async (req, res) => {
    try {
        console.log('🔄 Update ODP API - Processing request...');
        console.log('📋 Request data:', req.body);
        
        const { id, name, code, capacity, used_ports, status, address, latitude, longitude, installation_date } = req.body;
        
        // Validate required fields - hanya validasi id karena update bisa sebagian
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: id'
            });
        }
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Check if ODP exists in database
        const existingODP = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id FROM odps WHERE id = ?
            `, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        
        if (existingODP) {
            // Bangun query dinamis berdasarkan field yang ada
            const fields = [];
            const values = [];
            
            if (name !== undefined) {
                fields.push('name = ?');
                values.push(name);
            }
            if (code !== undefined) {
                fields.push('code = ?');
                values.push(code);
            }
            if (capacity !== undefined) {
                fields.push('capacity = ?');
                values.push(capacity);
            }
            if (used_ports !== undefined) {
                fields.push('used_ports = ?');
                values.push(used_ports);
            }
            if (status !== undefined) {
                fields.push('status = ?');
                values.push(status);
            }
            if (address !== undefined) {
                fields.push('address = ?');
                values.push(address);
            }
            if (latitude !== undefined) {
                fields.push('latitude = ?');
                values.push(latitude);
            }
            if (longitude !== undefined) {
                fields.push('longitude = ?');
                values.push(longitude);
            }
            if (installation_date !== undefined) {
                fields.push('installation_date = ?');
                values.push(installation_date);
            }
            
            // Tambahkan updated_at
            fields.push('updated_at = CURRENT_TIMESTAMP');
            
            if (fields.length > 1) { // Lebih dari 1 karena sudah ada updated_at
                // Update existing ODP
                await new Promise((resolve, reject) => {
                    const query = `UPDATE odps SET ${fields.join(', ')} WHERE id = ?`;
                    values.push(id);
                    
                    db.run(query, values, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`✅ Updated ODP: ${id}`);
                            resolve();
                        }
                    });
                });
            }
        } else {
            // Validasi field yang diperlukan untuk insert
            if (!name || !code || !capacity) {
                db.close();
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields for new ODP: name, code, capacity'
                });
            }
            
            // Insert new ODP
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO odps (
                        id, name, code, capacity, used_ports, status, 
                        address, latitude, longitude, installation_date, 
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [id, name, code, capacity, used_ports || 0, status || 'active', address || '', latitude || 0, longitude || 0, installation_date || null], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`✅ Created new ODP: ${id}`);
                        resolve();
                    }
                });
            });
        }
        
        db.close();
        
        console.log('✅ ODP updated successfully in database');
        
        // Invalidate GenieACS cache after successful update
        try {
            const cacheManager = require('../config/cacheManager');
            cacheManager.invalidatePattern('genieacs:*');
            console.log('🔄 GenieACS cache invalidated after ODP update');
        } catch (cacheError) {
            console.warn('⚠️ Failed to invalidate cache:', cacheError.message);
        }
        
        res.json({
            success: true,
            message: 'ODP updated successfully',
            data: {
                id: id,
                name: name,
                code: code,
                capacity: capacity,
                used_ports: used_ports,
                status: status,
                address: address,
                latitude: latitude,
                longitude: longitude,
                installation_date: installation_date
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating ODP:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating ODP: ' + error.message
        });
    }
});

// API endpoint untuk update Customer
router.post('/update-customer', adminAuth, async (req, res) => {
    try {
        console.log('🔄 Update Customer API - Processing request...');
        console.log('📋 Request data:', req.body);
        
        const { id, name, phone, email, pppoe_username, status, address, latitude, longitude, package_id, odp_id, join_date } = req.body;
        
        // Validate required fields
        if (!id || !name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: id, name, phone'
            });
        }
        
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        // Check if Customer exists in database
        const existingCustomer = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id FROM customers WHERE id = ?
            `, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        
        if (existingCustomer) {
            // Update existing Customer
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE customers SET 
                        name = ?, 
                        phone = ?, 
                        email = ?, 
                        pppoe_username = ?, 
                        status = ?, 
                        address = ?, 
                        latitude = ?, 
                        longitude = ?, 
                        package_id = ?, 
                        odp_id = ?, 
                        join_date = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [name, phone, email, pppoe_username, status, address, latitude, longitude, package_id, odp_id, join_date, id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`✅ Updated Customer: ${id}`);
                        resolve();
                    }
                });
            });
        } else {
            // Insert new Customer
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO customers (
                        id, name, phone, email, pppoe_username, status, 
                        address, latitude, longitude, package_id, odp_id, join_date, 
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [id, name, phone, email, pppoe_username, status, address, latitude, longitude, package_id, odp_id, join_date], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`✅ Created new Customer: ${id}`);
                        resolve();
                    }
                });
            });
        }
        
        db.close();
        
        console.log('✅ Customer updated successfully in database');
        
        // Invalidate GenieACS cache after successful update
        try {
            const cacheManager = require('../config/cacheManager');
            cacheManager.invalidatePattern('genieacs:*');
            console.log('🔄 GenieACS cache invalidated after Customer update');
        } catch (cacheError) {
            console.warn('⚠️ Failed to invalidate cache:', cacheError.message);
        }
        
        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: {
                id: id,
                name: name,
                phone: phone,
                email: email,
                pppoe_username: pppoe_username,
                status: status,
                address: address,
                latitude: latitude,
                longitude: longitude,
                package_id: package_id,
                odp_id: odp_id,
                join_date: join_date
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating Customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating Customer: ' + error.message
        });
    }
});

// API endpoint untuk restart ONU device via GenieACS
router.post('/restart-onu', adminAuth, async (req, res) => {
    try {
        console.log('🔄 Restart ONU API - Processing request...');
        console.log('📋 Request data:', req.body);
        
        const { deviceId, deviceName, serialNumber, customerName } = req.body;
        
        // Validate required fields
        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: deviceId'
            });
        }
        
        // Import GenieACS configuration
        const { getGenieACSConfig } = require('../config/genieacs');
        const genieacsConfig = getGenieACSConfig();
        
        if (!genieacsConfig || !genieacsConfig.url || !genieacsConfig.username || !genieacsConfig.password) {
            return res.status(500).json({
                success: false,
                message: 'GenieACS configuration not found or incomplete'
            });
        }
        
        console.log(`🔄 Restarting ONU device: ${deviceId} (${deviceName})`);
        console.log(`👤 Customer: ${customerName}`);
        console.log(`📱 Serial: ${serialNumber}`);
        
        // Call GenieACS API to restart device
        const genieacsUrl = `${genieacsConfig.url}/devices/${encodeURIComponent(deviceId)}/tasks`;
        const auth = Buffer.from(`${genieacsConfig.username}:${genieacsConfig.password}`).toString('base64');
        
        const restartTask = {
            name: 'reboot',
            objectName: 'Device.Reboot',
            object: 'Device.Reboot',
            parameters: {
                'CommandKey': 'Reboot'
            }
        };
        
        console.log(`🌐 Calling GenieACS API: ${genieacsUrl}`);
        console.log(`📋 Restart task:`, restartTask);
        
        const response = await fetch(genieacsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(restartTask)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ GenieACS API error:', response.status, errorText);
            return res.status(500).json({
                success: false,
                message: `GenieACS API error: ${response.status} - ${errorText}`
            });
        }
        
        const result = await response.json();
        console.log('✅ GenieACS restart task created:', result);
        
        // Log the restart action to database (optional)
        try {
            const dbPath = path.join(__dirname, '../data/billing.db');
            const db = new sqlite3.Database(dbPath);
            
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO device_actions (
                        device_id, device_name, serial_number, customer_name, 
                        action_type, action_status, action_details, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [
                    deviceId, 
                    deviceName || 'Unknown', 
                    serialNumber || 'Unknown', 
                    customerName || 'Unknown',
                    'restart',
                    'initiated',
                    JSON.stringify({
                        genieacs_task_id: result._id,
                        restart_time: new Date().toISOString(),
                        api_response: result
                    })
                ], function(err) {
                    if (err) {
                        console.error('❌ Error logging restart action:', err);
                        // Don't fail the request if logging fails
                    } else {
                        console.log(`✅ Logged restart action for device: ${deviceId}`);
                    }
                    resolve();
                });
            });
            
            db.close();
        } catch (logError) {
            console.error('❌ Error logging restart action to database:', logError);
            // Don't fail the request if logging fails
        }
        
        console.log('✅ ONU restart initiated successfully');
        
        // Invalidate GenieACS cache after successful restart
        try {
            const cacheManager = require('../config/cacheManager');
            cacheManager.invalidatePattern('genieacs:*');
            console.log('🔄 GenieACS cache invalidated after ONU restart');
        } catch (cacheError) {
            console.warn('⚠️ Failed to invalidate cache:', cacheError.message);
        }
        
        res.json({
            success: true,
            message: 'ONU restart initiated successfully',
            data: {
                deviceId: deviceId,
                deviceName: deviceName,
                serialNumber: serialNumber,
                customerName: customerName,
                genieacsTaskId: result._id,
                restartTime: new Date().toISOString(),
                status: 'initiated'
            }
        });
        
    } catch (error) {
        console.error('❌ Error restarting ONU device:', error);
        res.status(500).json({
            success: false,
            message: 'Error restarting ONU device: ' + error.message
        });
    }
});

module.exports = router;
