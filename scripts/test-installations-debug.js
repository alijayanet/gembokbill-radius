/**
 * Debug Installations Route
 * Test the exact same database connection and query as the route
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Debugging installations route...');

// Use the exact same database path as the route
const dbPath = path.join(__dirname, '../data/billing.db');
console.log('📁 Database path:', dbPath);

// Test database connection
const db = new sqlite3.Database(dbPath);

console.log('🔌 Testing database connection...');

// Test if we can connect and query
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='installation_jobs'", (err, row) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else if (row) {
        console.log('✅ installation_jobs table found');
        
        // Test the exact query from the route
        const mockTechnicianId = 1;
        const limit = 20;
        const offset = 0;
        
        const query = `
            SELECT ij.*, 
                   p.name as package_name, p.price as package_price,
                   t.name as technician_name
            FROM installation_jobs ij
            LEFT JOIN packages p ON ij.package_id = p.id
            LEFT JOIN technicians t ON ij.assigned_technician_id = t.id
            WHERE (assigned_technician_id = ? OR assigned_technician_id IS NULL)
            ORDER BY ij.installation_date ASC, ij.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        console.log('📝 Testing query with parameters:', [mockTechnicianId, limit, offset]);
        
        db.all(query, [mockTechnicianId, limit, offset], (err, rows) => {
            if (err) {
                console.error('❌ Query error:', err);
            } else {
                console.log('✅ Query successful! Rows returned:', rows.length);
                console.log('📊 Sample data:', rows.slice(0, 2));
            }
            
            // Test count query
            const countQuery = `SELECT COUNT(*) as count FROM installation_jobs WHERE (assigned_technician_id = ? OR assigned_technician_id IS NULL)`;
            console.log('📝 Testing count query...');
            
            db.get(countQuery, [mockTechnicianId], (err, row) => {
                if (err) {
                    console.error('❌ Count query error:', err);
                } else {
                    console.log('✅ Count query successful! Total:', row.count);
                }
                
                // Test stats query
                const statsQuery = `
                    SELECT status, COUNT(*) as count 
                    FROM installation_jobs 
                    WHERE assigned_technician_id = ? OR assigned_technician_id IS NULL
                    GROUP BY status
                `;
                console.log('📝 Testing stats query...');
                
                db.all(statsQuery, [mockTechnicianId], (err, rows) => {
                    if (err) {
                        console.error('❌ Stats query error:', err);
                    } else {
                        console.log('✅ Stats query successful! Results:', rows);
                    }
                    
                    db.close();
                    console.log('🎉 All tests completed!');
                });
            });
        });
        
    } else {
        console.log('❌ installation_jobs table NOT found');
        db.close();
    }
});
