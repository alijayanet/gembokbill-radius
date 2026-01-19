const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path ke database billing
const dbPath = path.join(__dirname, '../data/billing.db');

// Default coordinates untuk Jakarta
const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;

async function addCoordinatesToCustomers() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Database connected successfully');
        });

        // Cek apakah kolom latitude dan longitude sudah ada
        db.get("PRAGMA table_info(customers)", [], (err, rows) => {
            if (err) {
                console.error('Error checking table structure:', err);
                reject(err);
                return;
            }

            // Cek apakah kolom latitude dan longitude sudah ada
            db.all("PRAGMA table_info(customers)", [], (err, columns) => {
                if (err) {
                    console.error('Error getting table columns:', err);
                    reject(err);
                    return;
                }

                const hasLatitude = columns.some(col => col.name === 'latitude');
                const hasLongitude = columns.some(col => col.name === 'longitude');

                if (!hasLatitude || !hasLongitude) {
                    console.log('Adding latitude and longitude columns...');
                    
                    // Tambahkan kolom latitude dan longitude
                    const addLatitudeSQL = hasLatitude ? '' : 'ALTER TABLE customers ADD COLUMN latitude DECIMAL(10,8);';
                    const addLongitudeSQL = hasLongitude ? '' : 'ALTER TABLE customers ADD COLUMN longitude DECIMAL(11,8);';
                    
                    if (addLatitudeSQL) {
                        db.run(addLatitudeSQL, (err) => {
                            if (err) {
                                console.error('Error adding latitude column:', err);
                            } else {
                                console.log('Latitude column added successfully');
                            }
                        });
                    }
                    
                    if (addLongitudeSQL) {
                        db.run(addLongitudeSQL, (err) => {
                            if (err) {
                                console.error('Error adding longitude column:', err);
                            } else {
                                console.log('Longitude column added successfully');
                            }
                        });
                    }
                } else {
                    console.log('Latitude and longitude columns already exist');
                }

                // Update customer yang belum punya koordinat
                const updateSQL = `
                    UPDATE customers 
                    SET latitude = ?, longitude = ? 
                    WHERE latitude IS NULL OR longitude IS NULL
                `;

                db.run(updateSQL, [DEFAULT_LATITUDE, DEFAULT_LONGITUDE], function(err) {
                    if (err) {
                        console.error('Error updating coordinates:', err);
                        reject(err);
                    } else {
                        console.log(`Updated ${this.changes} customers with default coordinates`);
                        
                        // Tampilkan statistik
                        db.get("SELECT COUNT(*) as total, COUNT(latitude) as with_coords FROM customers", [], (err, row) => {
                            if (err) {
                                console.error('Error getting statistics:', err);
                            } else {
                                console.log(`\n📊 Coordinate Statistics:`);
                                console.log(`Total customers: ${row.total}`);
                                console.log(`Customers with coordinates: ${row.with_coords}`);
                                console.log(`Customers without coordinates: ${row.total - row.with_coords}`);
                            }
                            
                            db.close((err) => {
                                if (err) {
                                    console.error('Error closing database:', err);
                                } else {
                                    console.log('Database connection closed');
                                }
                                resolve();
                            });
                        });
                    }
                });
            });
        });
    });
}

// Jalankan script
if (require.main === module) {
    console.log('🚀 Starting coordinate update process...');
    addCoordinatesToCustomers()
        .then(() => {
            console.log('✅ Coordinate update completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error updating coordinates:', error);
            process.exit(1);
        });
}

module.exports = addCoordinatesToCustomers;
