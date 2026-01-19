const express = require('express');
const router = express.Router();
const AgentManager = require('../config/agentManager');
const AgentWhatsAppManager = require('../config/agentWhatsApp');
const { getSettingsWithCache, getSetting } = require('../config/settingsManager');
const logger = require('../config/logger');

// Middleware to prevent caching of agent pages
const noCache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

// Helper function to format phone number for WhatsApp
function formatPhoneNumberForWhatsApp(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    let cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    
    // Add country code if not present
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62')) {
        cleanPhone = '62' + cleanPhone;
    }
    
    return cleanPhone + '@s.whatsapp.net';
}

// Initialize AgentManager
const agentManager = new AgentManager();
// Initialize WhatsApp Manager
const whatsappManager = new AgentWhatsAppManager();

// Set WhatsApp socket when available
if (global.whatsappStatus && global.whatsappStatus.connected) {
    // Try to get socket from various sources
    let sock = null;
    
    // Check if there's a global whatsapp socket
    if (typeof global.getWhatsAppSocket === 'function') {
        sock = global.getWhatsAppSocket();
    } else if (global.whatsappSocket) {
        sock = global.whatsappSocket;
    } else if (global.whatsapp && typeof global.whatsapp.getSock === 'function') {
        sock = global.whatsapp.getSock();
    }
    
    if (sock) {
        whatsappManager.setSocket(sock);
        logger.info('WhatsApp socket set for AgentWhatsAppManager in agentAuth');
    } else {
        logger.warn('WhatsApp socket not available for AgentWhatsAppManager in agentAuth');
    }
}

// Middleware untuk check agent session
const requireAgentAuth = (req, res, next) => {
    if (req.session && req.session.agentId) {
        return next();
    } else {
        return res.redirect('/agent/login');
    }
};

// GET: Login page
router.get('/login', (req, res) => {
    try {
        const settings = getSettingsWithCache();
        res.render('agent/login', {
            error: null,
            success: null,
            appSettings: settings
        });
    } catch (error) {
        logger.error('Error rendering agent login:', error);
        res.status(500).send('Error loading login page');
    }
});

// POST: Agent registration
router.post('/register', async (req, res) => {
    try {
        const { name, username, phone, email, password, confirmPassword, address } = req.body;
        
        // Validation
        if (!name || !username || !phone || !password || !confirmPassword || !address) {
            return res.json({ 
                success: false, 
                message: 'Semua field wajib diisi' 
            });
        }
        
        if (password !== confirmPassword) {
            return res.json({ 
                success: false, 
                message: 'Password dan konfirmasi password tidak sama' 
            });
        }
        
        if (password.length < 6) {
            return res.json({ 
                success: false, 
                message: 'Password minimal 6 karakter' 
            });
        }
        
        // Phone number validation
        const phoneRegex = /^08\d{8,11}$/;
        if (!phoneRegex.test(phone)) {
            return res.json({ 
                success: false, 
                message: 'Format nomor HP tidak valid. Gunakan format 08xxxxxxxxxx' 
            });
        }
        
        // Check if username already exists
        const existingAgent = await agentManager.getAgentByUsername(username);
        if (existingAgent) {
            return res.json({ 
                success: false, 
                message: 'Username sudah digunakan' 
            });
        }
        
        // Check if phone already exists
        const existingPhone = await agentManager.getAgentByPhone(phone);
        if (existingPhone) {
            return res.json({ 
                success: false, 
                message: 'Nomor HP sudah terdaftar' 
            });
        }
        
        // Create agent with active status
        const agentData = {
            username: username,
            name: name,
            phone: phone,
            email: email || null,
            password: password,
            address: address,
            status: 'active' // Langsung aktif tanpa approval admin
        };
        
        const result = await agentManager.createAgent(agentData);
        
        if (result.success) {
            // Notifikasi ke admin
            await agentManager.createAdminNotification(
                'agent_registration',
                'Pendaftaran Agent Baru',
                `Agent baru mendaftar: ${name} (${username}) - ${phone}`,
                result.agentId
            );
            // Notifikasi ke agent
            await agentManager.createNotification(
                result.agentId,
                'registration_success',
                'Pendaftaran Berhasil',
                'Akun Anda sudah aktif. Silakan deposit untuk mulai transaksi.'
            );
            // WhatsApp ke admin
            const adminNumbers = [];
            let i = 0;
            while (true) {
                const adminNum = getSetting(`admins.${i}`);
                if (!adminNum) break;
                adminNumbers.push(adminNum);
                i++;
            }
            const adminWAmsg = `*PENDAFTARAN AGENT BARU*
Nama: ${name}
Username: ${username}
HP: ${phone}
Email: ${email || '-'}
Alamat: ${address}`;
            
            // Log for debugging
            logger.info(`Sending admin notifications to ${adminNumbers.length} admins`);
            
            for (const adminNum of adminNumbers) {
                try {
                    // Format phone number properly for WhatsApp
                    const formattedAdminNum = formatPhoneNumberForWhatsApp(adminNum);
                    if (whatsappManager.sock) {
                        await whatsappManager.sock.sendMessage(formattedAdminNum, { text: adminWAmsg });
                        logger.info(`Admin notification sent to ${formattedAdminNum}`);
                    } else {
                        logger.warn('WhatsApp socket not available for admin notification');
                    }
                } catch (e) { 
                    logger.error(`WA admin notif error for ${adminNum}:`, e); 
                }
            }
            
            // WhatsApp ke agent
            const serverHost = getSetting('server_host', 'localhost');
            const serverPort = getSetting('server_port', '3001');
            const portalUrl = getSetting('portal_url', `http://${serverHost}:${serverPort}/agent/login`);
            const adminContact = getSetting('contact_whatsapp', getSetting('contact_phone', '-'));
            const agentWAmsg = `*PENDAFTARAN BERHASIL*

Selamat datang di Portal Agent!

Akun Anda sudah aktif dan siap digunakan.

*Username:* ${username}
*Login Portal:* ${portalUrl}

Untuk mulai transaksi, silakan lakukan deposit terlebih dahulu melalui menu "Deposit" di portal agent.

Jika butuh bantuan, hubungi admin di WhatsApp: ${adminContact}

Terima kasih telah bergabung!`;
            
            try {
                // Format phone number properly for WhatsApp
                const formattedAgentPhone = formatPhoneNumberForWhatsApp(phone);
                if (whatsappManager.sock) {
                    await whatsappManager.sock.sendMessage(formattedAgentPhone, { text: agentWAmsg });
                    logger.info(`Agent notification sent to ${formattedAgentPhone}`);
                } else {
                    logger.warn('WhatsApp socket not available for agent notification');
                }
            } catch (e) { 
                logger.error(`WA agent notif error for ${phone}:`, e); 
            }
            
            logger.info(`New agent registration: ${name} (${username}) - ${phone}`);
            
            res.json({ 
                success: true, 
                message: 'Pendaftaran berhasil! Akun Anda sudah aktif. Silakan deposit untuk mulai transaksi.' 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Gagal mendaftar. Silakan coba lagi.' 
            });
        }
        
    } catch (error) {
        logger.error('Agent registration error:', error);
        res.json({ 
            success: false, 
            message: 'Terjadi kesalahan saat mendaftar' 
        });
    }
});

// POST: Login process
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('agent/login', {
                error: 'Username dan password harus diisi',
                success: null,
                appSettings: getSettingsWithCache()
            });
        }

        const result = await agentManager.authenticateAgent(username, password);
        
        if (result.success) {
            req.session.agentId = result.agent.id;
            req.session.agentName = result.agent.name;
            req.session.agentUsername = result.agent.username;
            
            logger.info(`Agent ${result.agent.username} logged in successfully`);
            res.redirect('/agent/dashboard');
        } else {
            res.render('agent/login', {
                error: result.message,
                success: null,
                appSettings: getSettingsWithCache()
            });
        }
    } catch (error) {
        logger.error('Agent login error:', error);
        res.render('agent/login', {
            error: 'Terjadi kesalahan saat login',
            success: null,
            appSettings: getSettingsWithCache()
        });
    }
});

// GET: Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Session destroy error:', err);
        }
        res.redirect('/agent/login');
    });
});

// GET: Dashboard
router.get('/dashboard', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        
        // Get agent info and balance
        const agent = await agentManager.getAgentById(agentId);
        const balance = await agentManager.getAgentBalance(agentId);
        const stats = await agentManager.getAgentStats(agentId);
        const notifications = await agentManager.getAgentNotifications(agentId, 10);
        
        // Get recent transactions
        const recentTransactionsResult = await agentManager.getAgentTransactions(agentId, 1, 10, 'all');
        const recentTransactions = recentTransactionsResult.data || [];
        
        res.render('agent/dashboard', {
            agent,
            balance,
            stats,
            notifications,
            recentTransactions,
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// GET: Mobile Dashboard
router.get('/mobile', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        
        // Get agent info and balance
        const agent = await agentManager.getAgentById(agentId);
        const balance = await agentManager.getAgentBalance(agentId);
        const stats = await agentManager.getAgentStats(agentId);
        const notifications = await agentManager.getAgentNotifications(agentId, 10);
        
        // Get recent transactions
        const recentTransactionsResult = await agentManager.getAgentTransactions(agentId, 1, 10, 'all');
        const recentTransactions = recentTransactionsResult.data || [];
        
        res.render('agent/mobile-dashboard', {
            agent,
            balance,
            stats,
            notifications,
            recentTransactions,
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent mobile dashboard error:', error);
        res.status(500).send('Error loading mobile dashboard');
    }
});

// GET: Profile
router.get('/profile', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const agent = await agentManager.getAgentById(agentId);
        
        res.render('agent/profile', {
            agent,
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent profile error:', error);
        res.status(500).send('Error loading profile');
    }
});

// POST: Update profile
router.post('/profile', requireAgentAuth, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const { name, email, address, phone } = req.body;
        
        // Update agent profile
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./data/billing.db');
        
        const updateSql = `
            UPDATE agents 
            SET name = ?, email = ?, address = ?, phone = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        db.run(updateSql, [name, email, address, phone, agentId], function(err) {
            db.close();
            
            if (err) {
                logger.error('Profile update error:', err);
                return res.json({ success: false, message: 'Gagal mengupdate profil' });
            }
            
            res.json({ success: true, message: 'Profil berhasil diupdate' });
        });
    } catch (error) {
        logger.error('Profile update error:', error);
        res.json({ success: false, message: 'Terjadi kesalahan saat mengupdate profil' });
    }
});

// GET: Change password page
router.get('/change-password', requireAgentAuth, noCache, (req, res) => {
    res.render('agent/change-password', {
        appSettings: getSettingsWithCache()
    });
});

// POST: Change password
router.post('/change-password', requireAgentAuth, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: 'Password baru dan konfirmasi tidak sama' });
        }
        
        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'Password minimal 6 karakter' });
        }
        
        // Verify current password
        const agent = await agentManager.getAgentById(agentId);
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./data/billing.db');
        
        const getPasswordSql = 'SELECT password FROM agents WHERE id = ?';
        db.get(getPasswordSql, [agentId], async (err, row) => {
            if (err) {
                db.close();
                return res.json({ success: false, message: 'Terjadi kesalahan' });
            }
            
            const bcrypt = require('bcrypt');
            const isValid = await bcrypt.compare(currentPassword, row.password);
            
            if (!isValid) {
                db.close();
                return res.json({ success: false, message: 'Password lama salah' });
            }
            
            // Update password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateSql = 'UPDATE agents SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            
            db.run(updateSql, [hashedPassword, agentId], function(err) {
                db.close();
                
                if (err) {
                    return res.json({ success: false, message: 'Gagal mengupdate password' });
                }
                
                res.json({ success: true, message: 'Password berhasil diubah' });
            });
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.json({ success: false, message: 'Terjadi kesalahan saat mengubah password' });
    }
});

module.exports = { router, requireAgentAuth };

