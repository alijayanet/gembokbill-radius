/**
 * Test Technician Route
 * Test the technician installations route with actual HTTP request
 */

const express = require('express');
const request = require('supertest');
const path = require('path');

// Mock the technician auth middleware
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

// Create a test app
const app = express();

// Mock the route handler
app.get('/test-installations', mockTechnicianAuth, async (req, res) => {
    try {
        console.log('🧪 Testing installations route...');
        
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

        // Return JSON instead of rendering template for testing
        res.json({
            success: true,
            data: {
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
            }
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
async function testRoute() {
    try {
        console.log('🚀 Starting route test...');
        
        const response = await request(app)
            .get('/test-installations')
            .expect(200);
            
        console.log('✅ Route test successful!');
        console.log('📊 Response data:', JSON.stringify(response.body, null, 2));
        
    } catch (error) {
        console.error('❌ Route test failed:', error);
    }
}

testRoute();
