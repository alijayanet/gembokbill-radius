/**
 * Test Installations Route
 * Test the technician installations route to identify issues
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Testing installations route logic...');

// Simulate technician data
const mockTechnician = {
    id: 1,
    name: 'Teknisi Demo',
    role: 'technician'
};

// Test the query logic from the route
async function testInstallationsQuery() {
    try {
        const page = 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = '';
        const status = '';

        // Build query conditions for technician access
        let whereConditions = ['(assigned_technician_id = ? OR assigned_technician_id IS NULL)'];
        let params = [mockTechnician.id];

        if (search) {
            whereConditions.push('(job_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status && status !== 'all') {
            whereConditions.push('status = ?');
            params.push(status);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        console.log('📝 Query conditions:', whereConditions);
        console.log('📝 Parameters:', params);
        console.log('📝 Where clause:', whereClause);

        // Get installation jobs assigned to this technician
        const installationJobs = await new Promise((resolve, reject) => {
            const query = `
                SELECT ij.*, 
                       p.name as package_name, p.price as package_price,
                       t.name as technician_name
                FROM installation_jobs ij
                LEFT JOIN packages p ON ij.package_id = p.id
                LEFT JOIN technicians t ON ij.assigned_technician_id = t.id
                ${whereClause}
                ORDER BY ij.installation_date ASC, ij.created_at DESC 
                LIMIT ? OFFSET ?
            `;
            
            console.log('📝 Final query:', query);
            console.log('📝 Query params:', [...params, limit, offset]);
            
            db.all(query, [...params, limit, offset], (err, rows) => {
                if (err) {
                    console.error('❌ Query error:', err);
                    reject(err);
                } else {
                    console.log('✅ Query successful, rows:', rows.length);
                    console.log('📊 Sample data:', rows.slice(0, 2));
                    resolve(rows);
                }
            });
        });

        // Get total count
        const totalJobs = await new Promise((resolve, reject) => {
            const countQuery = `SELECT COUNT(*) as count FROM installation_jobs ${whereClause}`;
            console.log('📝 Count query:', countQuery);
            console.log('📝 Count params:', params);
            
            db.get(countQuery, params, (err, row) => {
                if (err) {
                    console.error('❌ Count query error:', err);
                    reject(err);
                } else {
                    console.log('✅ Count successful:', row.count);
                    resolve(row.count);
                }
            });
        });

        const totalPages = Math.ceil(totalJobs / limit);

        // Calculate statistics for this technician
        const stats = await new Promise((resolve, reject) => {
            const statsQuery = `
                SELECT status, COUNT(*) as count 
                FROM installation_jobs 
                WHERE assigned_technician_id = ? OR assigned_technician_id IS NULL
                GROUP BY status
            `;
            console.log('📝 Stats query:', statsQuery);
            console.log('📝 Stats params:', [mockTechnician.id]);
            
            db.all(statsQuery, [mockTechnician.id], (err, rows) => {
                if (err) {
                    console.error('❌ Stats query error:', err);
                    reject(err);
                } else {
                    console.log('✅ Stats query successful, rows:', rows);
                    
                    const statistics = {
                        total: totalJobs,
                        scheduled: 0,
                        assigned: 0,
                        in_progress: 0,
                        completed: 0,
                        cancelled: 0
                    };
                    
                    rows.forEach(row => {
                        statistics[row.status] = row.count;
                    });
                    
                    console.log('📊 Final statistics:', statistics);
                    resolve(statistics);
                }
            });
        });

        console.log('🎉 All queries successful!');
        console.log('📋 Results summary:');
        console.log('  - Installation jobs:', installationJobs.length);
        console.log('  - Total jobs:', totalJobs);
        console.log('  - Total pages:', totalPages);
        console.log('  - Statistics:', stats);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        db.close();
    }
}

testInstallationsQuery();
