const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

console.log('🔍 Checking ONU devices with ODP connections...');
db.all('SELECT id, name, latitude, longitude, odp_id, customer_id, status FROM onu_devices', (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('ONU Devices:');
        rows.forEach(row => {
            console.log(`- ${row.name}: ODP ID ${row.odp_id}, Status: ${row.status}, Coords: [${row.latitude}, ${row.longitude}]`);
        });
    }
});

console.log('🔍 Checking ODPs...');
db.all('SELECT id, name, latitude, longitude FROM odps', (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('ODPs:');
        rows.forEach(row => {
            console.log(`- ${row.name}: Coords: [${row.latitude}, ${row.longitude}]`);
        });
    }
    db.close();
});
