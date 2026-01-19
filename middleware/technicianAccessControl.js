/**
 * Middleware untuk kontrol akses teknisi
 * Mencegah teknisi mengakses halaman admin
 */

const logger = require('../config/logger');

/**
 * Middleware untuk memblokir akses teknisi ke halaman admin
 */
function blockTechnicianAccess(req, res, next) {
    // Cek jika user adalah teknisi
    if (req.technician) {
        logger.warn(`Technician ${req.technician.name} (${req.technician.id}) attempted to access admin route: ${req.originalUrl}`);
        
        // Redirect ke dashboard teknisi dengan pesan error
        req.session.error = 'Access denied: You are logged in as a technician. Admin access is not allowed.';
        return res.redirect('/technician/dashboard');
    }
    
    // Jika bukan teknisi, lanjutkan ke middleware berikutnya
    next();
}

/**
 * Middleware untuk memblokir akses admin ke halaman teknisi (optional)
 */
function blockAdminAccess(req, res, next) {
    // Cek jika user adalah admin (tidak ada req.technician)
    if (!req.technician && req.user) {
        logger.warn(`Admin user attempted to access technician route: ${req.originalUrl}`);
        
        // Redirect ke dashboard admin dengan pesan error
        req.session.error = 'Access denied: You are logged in as admin. Please use technician login for technician features.';
        return res.redirect('/admin/dashboard');
    }
    
    // Jika bukan admin atau tidak ada user, lanjutkan
    next();
}

/**
 * Middleware untuk cek role teknisi tertentu
 */
function requireTechnicianRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.technician) {
            return res.status(401).json({
                success: false,
                message: 'Technician authentication required'
            });
        }
        
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.technician.role)) {
            logger.warn(`Technician ${req.technician.name} with role ${req.technician.role} attempted to access restricted route: ${req.originalUrl}`);
            
            return res.status(403).json({
                success: false,
                message: `Access denied: Role ${req.technician.role} is not allowed for this action`
            });
        }
        
        next();
    };
}

/**
 * Middleware untuk cek area coverage teknisi
 */
function requireAreaAccess(req, res, next) {
    if (!req.technician) {
        return res.status(401).json({
            success: false,
            message: 'Technician authentication required'
        });
    }
    
    // Jika teknisi memiliki area coverage spesifik
    if (req.technician.area_coverage && req.technician.area_coverage !== 'all') {
        // Di sini bisa ditambahkan logika untuk filter data berdasarkan area
        // Misalnya, jika ada parameter area di request
        if (req.query.area && req.query.area !== req.technician.area_coverage) {
            return res.status(403).json({
                success: false,
                message: `Access denied: You can only access data for area ${req.technician.area_coverage}`
            });
        }
    }
    
    next();
}

/**
 * Middleware untuk log aktivitas teknisi
 */
function logTechnicianActivity(activityType, description) {
    return async (req, res, next) => {
        if (req.technician) {
            try {
                const authManager = require('../routes/technicianAuth');
                await authManager.logActivity(
                    req.technician.id,
                    activityType,
                    description,
                    {
                        route: req.originalUrl,
                        method: req.method,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    }
                );
            } catch (error) {
                logger.error('Error logging technician activity:', error);
            }
        }
        
        next();
    };
}

module.exports = {
    blockTechnicianAccess,
    blockAdminAccess,
    requireTechnicianRole,
    requireAreaAccess,
    logTechnicianActivity
};
