const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

console.log('🔌 Adding ONU devices connected to ODPs...');

// Insert ONU devices connected to ODPs
const onuDevices = [
    {
        name: 'ONU-001',
        serial_number: 'SN001234567',
        mac_address: '00:11:22:33:44:55',
        ip_address: '192.168.1.100',
        status: 'online',
        latitude: -6.252800,
        longitude: 107.920900,
        odp_id: 1, // Connected to ODP-SERVER
        customer_id: 1,
        ssid: 'GEMBOK-WIFI-001',
        password: 'password123',
        model: 'HG8245H5',
        firmware_version: 'V500R019C00SPC108'
    },
    {
        name: 'ONU-002',
        serial_number: 'SN001234568',
        mac_address: '00:11:22:33:44:56',
        ip_address: '192.168.1.101',
        status: 'online',
        latitude: -6.253200,
        longitude: 107.921300,
        odp_id: 2, // Connected to ODP-KAPRAN
        customer_id: 2,
        ssid: 'GEMBOK-WIFI-002',
        password: 'password456',
        model: 'HG8245H5',
        firmware_version: 'V500R019C00SPC108'
    },
    {
        name: 'ONU-003',
        serial_number: 'SN001234569',
        mac_address: '00:11:22:33:44:57',
        ip_address: '192.168.1.102',
        status: 'offline',
        latitude: -6.253500,
        longitude: 107.921600,
        odp_id: 1, // Connected to ODP-SERVER
        customer_id: 3,
        ssid: 'GEMBOK-WIFI-003',
        password: 'password789',
        model: 'HG8245H5',
        firmware_version: 'V500R019C00SPC108'
    }
];

onuDevices.forEach((device, index) => {
    const stmt = db.prepare(`
        INSERT INTO onu_devices (
            name, serial_number, mac_address, ip_address, status, 
            latitude, longitude, odp_id, customer_id, ssid, password, 
            model, firmware_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
        device.name,
        device.serial_number,
        device.mac_address,
        device.ip_address,
        device.status,
        device.latitude,
        device.longitude,
        device.odp_id,
        device.customer_id,
        device.ssid,
        device.password,
        device.model,
        device.firmware_version
    ], function(err) {
        if (err) {
            console.error(`Error inserting ${device.name}:`, err.message);
        } else {
            console.log(`✅ ${device.name} added with ID ${this.lastID}`);
        }
    });
    
    stmt.finalize();
});

// Close database after a short delay
setTimeout(() => {
    db.close();
    console.log('✅ ONU devices with ODP connections added successfully!');
}, 1000);
