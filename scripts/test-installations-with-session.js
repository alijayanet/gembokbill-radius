/**
 * Test Installations Route with Valid Session
 * Create a valid technician session and test the route
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const session = require('express-session');

console.log('🧪 Testing installations route with valid session...');

// Create test app
const app = express();

// Mock session middleware
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Mock technician auth middleware
const mockTechnicianAuth = (req, res, next) => {
    req.technician = {
        id: 1,
        name: 'Teknisi Demo',
        role: 'technician'
    };
    next();
};

// Mock authManager
const mockAuthManager = {
    logActivity: async (technicianId, activityType, description) => {
        console.log(`📝 Mock activity log: ${technicianId} - ${activityType} - ${description}`);
        return true;
    }
};

// Mock getSetting function
const mockGetSetting = (key, defaultValue) => {
    const settings = {
        'company_header': 'GEMBOK',
        'footer_info': 'Portal Teknisi'
    };
    return settings[key] || defaultValue;
};

// Add the exact route from technicianDashboard.js
app.get('/test-installations', mockTechnicianAuth, async (req, res) => {
    try {
        console.log('🧪 Testing installations route logic...');
        
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || '';

        // Build query conditions for technician access
        let whereConditions = ['(assigned_technician_id = ? OR assigned_technician_id IS NULL)'];
        let params = [req.technician.id];

        if (search) {
            whereConditions.push('(job_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status && status !== 'all') {
            whereConditions.push('status = ?');
            params.push(status);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

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
            
            db.all(query, [...params, limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Get total count
        const totalJobs = await new Promise((resolve, reject) => {
            const countQuery = `SELECT COUNT(*) as count FROM installation_jobs ${whereClause}`;
            db.get(countQuery, params, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        const totalPages = Math.ceil(totalJobs / limit);

        // Calculate statistics for this technician
        const stats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT status, COUNT(*) as count 
                FROM installation_jobs 
                WHERE assigned_technician_id = ? OR assigned_technician_id IS NULL
                GROUP BY status
            `, [req.technician.id], (err, rows) => {
                if (err) reject(err);
                else {
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
                    
                    resolve(statistics);
                }
            });
        });

        // Mock activity logging
        await mockAuthManager.logActivity(req.technician.id, 'installations_access', 'Mengakses halaman instalasi');

        // Test template rendering by creating a mock template
        const templateData = {
            title: 'Jadwal Instalasi - Portal Teknisi',
            technician: req.technician,
            installationJobs,
            stats,
            pagination: {
                currentPage: page,
                totalPages,
                totalJobs,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            search,
            status,
            settings: {
                company_header: mockGetSetting('company_header', 'GEMBOK'),
                footer_info: mockGetSetting('footer_info', 'Portal Teknisi')
            }
        };

        console.log('✅ Template data prepared successfully!');
        console.log('📊 Template data summary:');
        console.log('  - Installation jobs:', installationJobs.length);
        console.log('  - Statistics:', stats);
        console.log('  - Pagination:', templateData.pagination);
        console.log('  - Settings:', templateData.settings);

        res.json({
            success: true,
            message: 'Route logic works correctly',
            data: templateData
        });

        db.close();

    } catch (error) {
        console.error('❌ Route error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Test the route
const server = app.listen(3004, () => {
    console.log('🚀 Test server running on port 3004');
    
    // Make test request
    const http = require('http');
    const options = {
        hostname: 'localhost',
        port: 3004,
        path: '/test-installations',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ Test successful!');
                const result = JSON.parse(data);
                console.log('📊 Result:', result.message);
            } else {
                console.log('❌ Test failed with status:', res.statusCode);
                console.log('📄 Response:', data);
            }
            
            server.close();
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Request error:', error.message);
        server.close();
    });
    
    req.end();
});
