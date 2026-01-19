const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

console.log('🚀 Adding ONU Devices...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database');
});

// Insert ONU devices
const onuDevices = [
    {
        name: 'ONU-001',
        serial_number: 'SN123456789',
        mac_address: '00:11:22:33:44:55',
        ip_address: '192.168.1.100',
        status: 'online',
        latitude: -6.25300618,
        longitude: 107.92300909,
        customer_id: 1,
        odp_id: 1,
        ssid: 'GEMBOK-WIFI-001',
        password: 'password123',
        model: 'HG8245H5'
    },
    {
        name: 'ONU-002',
        serial_number: 'SN987654321',
        mac_address: '00:11:22:33:44:66',
        ip_address: '192.168.1.101',
        status: 'online',
        latitude: -6.25250000,
        longitude: 107.92250000,
        customer_id: null,
        odp_id: 1,
        ssid: 'GEMBOK-WIFI-002',
        password: 'password456',
        model: 'HG8245H5'
    },
    {
        name: 'ONU-003',
        serial_number: 'SN555666777',
        mac_address: '00:11:22:33:44:77',
        ip_address: '192.168.1.102',
        status: 'offline',
        latitude: -6.25350000,
        longitude: 107.92350000,
        customer_id: null,
        odp_id: 2,
        ssid: 'GEMBOK-WIFI-003',
        password: 'password789',
        model: 'HG8245H5'
    }
];

let insertedCount = 0;
let errorCount = 0;

onuDevices.forEach((device, index) => {
    const sql = `INSERT OR IGNORE INTO onu_devices (
        name, serial_number, mac_address, ip_address, status, 
        latitude, longitude, customer_id, odp_id, ssid, password, model
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
        device.name, device.serial_number, device.mac_address, device.ip_address,
        device.status, device.latitude, device.longitude, device.customer_id,
        device.odp_id, device.ssid, device.password, device.model
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error(`❌ Error inserting ${device.name}:`, err.message);
            errorCount++;
        } else {
            console.log(`✅ ${device.name} inserted successfully`);
            insertedCount++;
        }
        
        // Check if all devices have been processed
        if (index === onuDevices.length - 1) {
            console.log(`\n📊 Summary: ${insertedCount} inserted, ${errorCount} errors`);
            
            // Count total ONU devices
            db.get("SELECT COUNT(*) as count FROM onu_devices", (err, row) => {
                if (err) {
                    console.error('❌ Error counting records:', err.message);
                } else {
                    console.log(`✅ Total ONU devices in database: ${row.count}`);
                }
                
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    } else {
                        console.log('✅ Database connection closed');
                    }
                });
            });
        }
    });
});
