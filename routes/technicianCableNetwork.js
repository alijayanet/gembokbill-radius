const express = require('express');
const router = express.Router();
const path = require('path');
const logger = require('../config/logger');
const { technicianAuth } = require('./technicianAuth');
const { getSetting } = require('../config/settingsManager');
const CableNetworkUtils = require('../utils/cableNetworkUtils');

// Database connection using MySQL wrapper
const db = require('../config/database');

// ===== TECHNICIAN CABLE NETWORK API =====

// GET: Halaman ODP Management untuk technician
router.get('/odp', technicianAuth, (req, res) => {
    res.render('technician/odp', {
        title: 'Manajemen ODP - Portal Technician',
        page: 'odp',
        technician: req.technician
    });
});

// GET: API untuk data ODP dan Cable Routes untuk technician mapping
router.get('/api/cable-network-data', technicianAuth, async (req, res) => {
    try {
        // Ambil data ODP
        const odps = await new Promise((resolve, reject) => {
            db.all(`
                SELECT o.*, 
                       COUNT(cr.id) as connected_customers,
                       COUNT(CASE WHEN cr.status = 'connected' THEN 1 END) as active_connections
                FROM odps o
                LEFT JOIN cable_routes cr ON o.id = cr.odp_id
                GROUP BY o.id
                ORDER BY o.name
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Ambil data cable routes dengan detail
        const cableRoutes = await new Promise((resolve, reject) => {
            db.all(`
                SELECT cr.*, 
                       c.name as customer_name, c.phone as customer_phone,
                       c.latitude as customer_latitude, c.longitude as customer_longitude,
                       o.name as odp_name, o.latitude as odp_latitude, o.longitude as odp_longitude
                FROM cable_routes cr
                JOIN customers c ON cr.customer_id = c.id
                JOIN odps o ON cr.odp_id = o.id
                WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Ambil data network segments
        const networkSegments = await new Promise((resolve, reject) => {
            db.all(`
                SELECT ns.*, 
                       o1.name as start_odp_name, o1.latitude as start_latitude, o1.longitude as start_longitude,
                       o2.name as end_odp_name, o2.latitude as end_latitude, o2.longitude as end_longitude
                FROM network_segments ns
                JOIN odps o1 ON ns.start_odp_id = o1.id
                LEFT JOIN odps o2 ON ns.end_odp_id = o2.id
                WHERE ns.status = 'active'
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Analisis statistik untuk teknisi
        const odpAnalysis = CableNetworkUtils.analyzeODPCapacity(odps);
        const cableAnalysis = CableNetworkUtils.analyzeCableStatus(cableRoutes);
        
        res.json({
            success: true,
            data: {
                odps: odps,
                cableRoutes: cableRoutes,
                networkSegments: networkSegments,
                analysis: {
                    odps: odpAnalysis,
                    cables: cableAnalysis
                },
                technician: {
                    name: req.session.technician_name,
                    phone: req.session.technician_phone
                }
            }
        });
        
    } catch (error) {
        logger.error('Error getting technician cable network data:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data cable network'
        });
    }
});

// GET: API untuk statistik cable network untuk teknisi
router.get('/api/cable-network-stats', technicianAuth, async (req, res) => {
    try {
        // Statistik ODP
        const odpStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(*) as total_odps,
                    SUM(capacity) as total_capacity,
                    SUM(used_ports) as total_used_ports,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_odps,
                    COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_odps
                FROM odps
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Statistik Cable Routes
        const cableStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(*) as total_cables,
                    SUM(cable_length) as total_length,
                    COUNT(CASE WHEN status = 'connected' THEN 1 END) as connected_cables,
                    COUNT(CASE WHEN status = 'disconnected' THEN 1 END) as disconnected_cables,
                    COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_cables,
                    COUNT(CASE WHEN status = 'damaged' THEN 1 END) as damaged_cables
                FROM cable_routes
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({
            success: true,
            data: {
                odps: odpStats,
                cables: cableStats,
                utilization: odpStats.total_capacity > 0 ? 
                    (odpStats.total_used_ports / odpStats.total_capacity) * 100 : 0
            }
        });
        
    } catch (error) {
        logger.error('Error getting technician cable network stats:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik cable network'
        });
    }
});

// GET: API untuk detail ODP untuk teknisi
router.get('/api/odp/:id', technicianAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil detail ODP
        const odp = await new Promise((resolve, reject) => {
            db.get(`
                SELECT o.*, 
                       COUNT(CASE WHEN cr.customer_id IS NOT NULL THEN cr.id END) as connected_customers,
                       COUNT(CASE WHEN cr.status = 'connected' AND cr.customer_id IS NOT NULL THEN 1 END) as active_connections
                FROM odps o
                LEFT JOIN cable_routes cr ON o.id = cr.odp_id
                WHERE o.id = ?
                GROUP BY o.id
            `, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!odp) {
            return res.status(404).json({
                success: false,
                message: 'ODP tidak ditemukan'
            });
        }
        
        // Ambil cable routes yang terhubung ke ODP ini (hanya yang memiliki customer)
        const cableRoutes = await new Promise((resolve, reject) => {
            db.all(`
                SELECT cr.*, 
                       c.name as customer_name, c.phone as customer_phone,
                       c.latitude as customer_latitude, c.longitude as customer_longitude
                FROM cable_routes cr
                JOIN customers c ON cr.customer_id = c.id
                WHERE cr.odp_id = ? AND cr.customer_id IS NOT NULL
                ORDER BY cr.status, c.name
            `, [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({
            success: true,
            data: {
                odp: odp,
                cableRoutes: cableRoutes
            }
        });
        
    } catch (error) {
        logger.error('Error getting ODP details for technician:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail ODP'
        });
    }
});

// GET: API untuk search ODP untuk teknisi
router.get('/api/search-odp', technicianAuth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        const odps = await new Promise((resolve, reject) => {
            db.all(`
                SELECT o.*, 
                       COUNT(cr.id) as connected_customers
                FROM odps o
                LEFT JOIN cable_routes cr ON o.id = cr.odp_id
                WHERE o.name LIKE ? OR o.code LIKE ? OR o.address LIKE ?
                GROUP BY o.id
                ORDER BY o.name
                LIMIT 10
            `, [`%${q}%`, `%${q}%`, `%${q}%`], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({
            success: true,
            data: odps
        });
        
    } catch (error) {
        logger.error('Error searching ODP for technician:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mencari ODP'
        });
    }
});

// POST: Tambah ODP baru
router.post('/api/odp', technicianAuth, async (req, res) => {
    try {
        const { 
            name, code, parent_odp_id, latitude, longitude, address, capacity, status, notes,
            enable_connection, from_odp_id, connection_type, cable_capacity, connection_status, connection_notes, cable_length
        } = req.body;
        
        // Validasi input
        if (!name || !code || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Nama, kode, latitude, dan longitude wajib diisi'
            });
        }
        
        // Validasi koordinat
        if (!CableNetworkUtils.validateODPCoordinates(parseFloat(latitude), parseFloat(longitude))) {
            return res.status(400).json({
                success: false,
                message: 'Koordinat tidak valid'
            });
        }
        
        // Cek apakah kode sudah ada
        const existingODP = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM odps WHERE code = ?', [code], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existingODP) {
            return res.status(400).json({
                success: false,
                message: 'Kode ODP sudah digunakan'
            });
        }
        
        // Insert ODP baru
        const newODPId = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO odps (name, code, parent_odp_id, latitude, longitude, address, capacity, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [name, code, parent_odp_id || null, latitude, longitude, address, capacity || 64, status || 'active', notes], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        
        // Jika ada koneksi ODP yang diaktifkan
        if (enable_connection && from_odp_id) {
            try {
                // Validasi ODP sumber ada
                const sourceODP = await new Promise((resolve, reject) => {
                    db.get('SELECT id, name, code FROM odps WHERE id = ?', [from_odp_id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                
                if (!sourceODP) {
                    throw new Error('ODP sumber tidak ditemukan');
                }
                
                // Cek apakah koneksi sudah ada
                const existingConnection = await new Promise((resolve, reject) => {
                    db.get(`
                        SELECT id FROM odp_connections 
                        WHERE (from_odp_id = ? AND to_odp_id = ?) OR (from_odp_id = ? AND to_odp_id = ?)
                    `, [from_odp_id, newODPId, newODPId, from_odp_id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                
                if (existingConnection) {
                    logger.warn(`Connection already exists between ODP ${from_odp_id} and ${newODPId}`);
                } else {
                    // Insert koneksi ODP
                    await new Promise((resolve, reject) => {
                        db.run(`
                            INSERT INTO odp_connections (from_odp_id, to_odp_id, connection_type, cable_length, cable_capacity, status, notes)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [
                            from_odp_id, 
                            newODPId, 
                            connection_type || 'fiber', 
                            cable_length || null, 
                            cable_capacity || '1G', 
                            connection_status || 'active', 
                            connection_notes || `Auto-created connection from ${sourceODP.name} to ${name}`
                        ], function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        });
                    });
                    
                    logger.info(`ODP connection created: ${sourceODP.name} (${sourceODP.code}) -> ${name} (${code})`);
                }
            } catch (connectionError) {
                logger.error('Error creating ODP connection:', connectionError);
                // Jangan gagal seluruh proses jika koneksi gagal
            }
        }
        
        res.json({
            success: true,
            message: 'ODP berhasil ditambahkan' + (enable_connection ? ' dengan koneksi kabel' : ''),
            data: { id: newODPId }
        });
        
    } catch (error) {
        logger.error('Error adding ODP by technician:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan ODP'
        });
    }
});

// POST: Tambah Cable Route
router.post('/api/cables', technicianAuth, async (req, res) => {
    try {
        const { customer_id, odp_id, cable_length, cable_type, port_number, notes } = req.body;
        
        // Validasi input
        if (!customer_id || !odp_id) {
            return res.status(400).json({
                success: false,
                message: 'Customer dan ODP wajib dipilih'
            });
        }
        
        // Cek apakah customer sudah punya cable route
        const existingRoute = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM cable_routes WHERE customer_id = ?', [customer_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existingRoute) {
            return res.status(400).json({
                success: false,
                message: 'Customer sudah memiliki jalur kabel'
            });
        }
        
        // Hitung panjang kabel otomatis jika tidak diisi
        let calculatedLength = cable_length;
        if (!cable_length) {
            const customer = await new Promise((resolve, reject) => {
                db.get('SELECT latitude, longitude FROM customers WHERE id = ?', [customer_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            const odp = await new Promise((resolve, reject) => {
                db.get('SELECT latitude, longitude FROM odps WHERE id = ?', [odp_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (customer && odp) {
                calculatedLength = CableNetworkUtils.calculateCableDistance(
                    { latitude: customer.latitude, longitude: customer.longitude },
                    { latitude: odp.latitude, longitude: odp.longitude }
                );
            }
        }
        
        // Insert cable route
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO cable_routes (customer_id, odp_id, cable_length, cable_type, port_number, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [customer_id, odp_id, calculatedLength, cable_type || 'Fiber Optic', port_number, notes], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        
        res.json({
            success: true,
            message: 'Jalur kabel berhasil ditambahkan',
            data: { 
                id: this.lastID,
                cable_length: calculatedLength
            }
        });
        
    } catch (error) {
        logger.error('Error adding cable route by technician:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan jalur kabel'
        });
    }
});

// PUT: Update Cable Route Status
router.put('/api/cables/:id/status', technicianAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE cable_routes 
                SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, notes, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
        
        res.json({
            success: true,
            message: 'Status kabel berhasil diperbarui'
        });
        
    } catch (error) {
        logger.error('Error updating cable status by technician:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui status kabel'
        });
    }
});

// PUT: Update Cable Route
router.put('/api/cables/:id', technicianAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { cable_type, cable_length, port_number, status, notes } = req.body;
        
        // Cek apakah cable route ada sebelum update
        const existingCable = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM cable_routes WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!existingCable) {
            return res.status(404).json({
                success: false,
                message: 'Cable route tidak ditemukan'
            });
        }
        
        const result = await new Promise((resolve, reject) => {
            db.run(`
                UPDATE cable_routes 
                SET cable_type = ?, cable_length = ?, port_number = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [cable_type, cable_length, port_number, status || 'connected', notes, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
        
        res.json({
            success: true,
            message: 'Cable route berhasil diperbarui'
        });
        
    } catch (error) {
        logger.error('Error updating cable route by technician:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui cable route'
        });
    }
});

// DELETE: Hapus Cable Route
router.delete('/api/cables/:id', technicianAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Cek apakah cable route ada
        const existingCable = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM cable_routes WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!existingCable) {
            return res.status(404).json({
                success: false,
                message: 'Cable route tidak ditemukan'
            });
        }
        
        // Hapus cable route
        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM cable_routes WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
        
        res.json({
            success: true,
            message: 'Cable route berhasil dihapus'
        });
        
    } catch (error) {
        logger.error('Error deleting cable route by technician:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus cable route'
        });
    }
});

module.exports = router;
