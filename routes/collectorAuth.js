/**
 * Collector Authentication Routes
 * Routes untuk login dan logout tukang tagih
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getSetting } = require('../config/settingsManager');

// Middleware untuk mengecek session tukang tagih
const collectorAuth = (req, res, next) => {
    const token = req.session.collectorToken;
    
    if (!token) {
        return res.redirect('/collector/login');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.collector = decoded;
        next();
    } catch (error) {
        req.session.collectorToken = null;
        return res.redirect('/collector/login');
    }
};

// Login page
router.get('/login', async (req, res) => {
    try {
        const appSettings = await getAppSettings();
        res.render('collector/login', {
            title: 'Login Tukang Tagih',
            appSettings: appSettings
        });
    } catch (error) {
        console.error('Error loading collector login:', error);
        res.status(500).render('error', { 
            message: 'Error loading login page',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Login process
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        if (!phone || !password) {
            return res.json({
                success: false,
                message: 'Nomor telepon dan password harus diisi'
            });
        }
        
        // Find collector by phone (check both collectors and technicians tables)
        let collector = await db.get('SELECT * FROM collectors WHERE phone = ? AND status = "active"', [phone]);
        
        // If not found in collectors table, check technicians table with role='collector'
        if (!collector) {
            collector = await db.get('SELECT * FROM technicians WHERE phone = ? AND role = "collector" AND is_active = 1', [phone]);
        }
        
        if (!collector) {
            return res.json({
                success: false,
                message: 'Nomor telepon tidak ditemukan atau akun tidak aktif'
            });
        }
        
        // Check password using bcrypt
        const validPassword = collector.password ? bcrypt.compareSync(password, collector.password) : false;
        
        if (!validPassword) {
            return res.json({
                success: false,
                message: 'Password salah'
            });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { 
                id: collector.id, 
                name: collector.name, 
                phone: collector.phone,
                role: 'collector'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // Store token in session
        req.session.collectorToken = token;
        
        res.json({
            success: true,
            message: 'Login berhasil',
            collector: {
                id: collector.id,
                name: collector.name,
                phone: collector.phone
            }
        });
        
    } catch (error) {
        console.error('Error in collector login:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.collectorToken = null;
    res.json({
        success: true,
        message: 'Logout berhasil'
    });
});

// Logout redirect
router.get('/logout', (req, res) => {
    req.session.collectorToken = null;
    res.redirect('/collector/login');
});

// Helper function to get app settings
async function getAppSettings() {
    try {
        return {
            companyHeader: getSetting('company_header', 'Sistem Billing'),
            companyName: getSetting('company_name', 'Sistem Billing'),
            footerInfo: getSetting('footer_info', ''),
            logoFilename: getSetting('logo_filename', 'logo.png'),
            company_slogan: getSetting('company_slogan', ''),
            company_website: getSetting('company_website', ''),
            invoice_notes: getSetting('invoice_notes', ''),
            contact_phone: getSetting('contact_phone', ''),
            contact_email: getSetting('contact_email', ''),
            contact_address: getSetting('contact_address', ''),
            contact_whatsapp: getSetting('contact_whatsapp', '')
        };
    } catch (error) {
        console.error('Error getting app settings:', error);
        return {
            companyHeader: 'Sistem Billing',
            companyName: 'Sistem Billing'
        };
    }
}

module.exports = { router, collectorAuth };
