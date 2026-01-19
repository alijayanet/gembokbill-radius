const express = require('express');
const router = express.Router();
const AgentManager = require('../config/agentManager');
const { getSettingsWithCache } = require('../config/settingsManager');
const logger = require('../config/logger');
const { requireAgentAuth } = require('./agentAuth');
const AgentWhatsAppManager = require('../config/agentWhatsApp');

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
        logger.info('WhatsApp socket set for AgentWhatsAppManager in agent route');
    } else {
        logger.warn('WhatsApp socket not available for AgentWhatsAppManager in agent route');
    }
}

// ===== VOUCHER SALES =====

// GET: Voucher sales page
router.get('/vouchers', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const balance = await agentManager.getAgentBalance(agentId);
        
        // Get voucher packages from voucher_pricing table
        const voucherPackages = await agentManager.getAvailablePackages();
        
        res.render('agent/vouchers', {
            balance,
            voucherPackages,
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent vouchers error:', error);
        res.status(500).send('Error loading vouchers page');
    }
});

// POST: Sell voucher
router.post('/sell-voucher', requireAgentAuth, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const { packageId, customerName, customerPhone, sendNotification } = req.body;
        
        // Get package data from voucher_pricing table
        const packageData = await agentManager.getPackageById(packageId);
        if (!packageData) {
            return res.json({ success: false, message: 'Paket voucher tidak valid' });
        }
        
        // Check agent balance
        const balance = await agentManager.getAgentBalance(agentId);
        if (balance < packageData.agentPrice) {
            return res.json({ 
                success: false, 
                message: `Saldo tidak mencukupi. Saldo: Rp ${balance.toLocaleString()}, Dibutuhkan: Rp ${packageData.agentPrice.toLocaleString()}` 
            });
        }
        
          // Generate voucher code using package settings
          const voucherCode = agentManager.generateVoucherCode(packageData);
          
          // Sell voucher
          const result = await agentManager.sellVoucher(
              agentId, 
              voucherCode, 
              packageId, 
              customerName, 
              customerPhone
          );
        
        if (result.success) {
            // Create notification
            await agentManager.createNotification(
                agentId,
                'voucher_sold',
                'Voucher Berhasil Dijual',
                `Voucher ${packageData.name} dengan kode ${result.voucherCode} berhasil dijual`
            );
            
            // Send WhatsApp notification
            try {
                const agent = await agentManager.getAgentById(agentId);
                const voucherData = {
                    voucherCode: result.voucherCode,
                    packageName: packageData.name,
                    price: packageData.price,
                    commission: result.commission
                };
                
                await whatsappManager.sendVoucherNotification(agent, {
                    name: customerName,
                    phone: customerPhone
                }, voucherData);
            } catch (whatsappError) {
                logger.error('WhatsApp notification error:', whatsappError);
                // Don't fail the transaction if WhatsApp fails
            }
            
            res.json({
                success: true,
                message: 'Voucher berhasil dijual',
                voucherCode: result.voucherCode,
                voucherPassword: result.voucherPassword || result.voucherCode,
                mikrotikUsername: result.mikrotikUsername || result.voucherCode,
                mikrotikPassword: result.mikrotikPassword || result.voucherCode,
                packageName: result.packageName || packageData.name,
                customerPrice: result.customerPrice || packageData.customerPrice,
                agentPrice: result.agentPrice || packageData.agentPrice,
                commissionAmount: result.commissionAmount || (packageData.customerPrice - packageData.agentPrice),
                mikrotikAdded: result.mikrotikAdded || false
            });
        } else {
            res.json({ success: false, message: 'Gagal menjual voucher' });
        }
    } catch (error) {
        logger.error('Sell voucher error:', error);
        res.json({ success: false, message: 'Terjadi kesalahan saat menjual voucher' });
    }
});

// GET: Voucher sales history
router.get('/voucher-history', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        
        const sales = await agentManager.getAgentVoucherSales(agentId, limit, offset);
        const totalSales = sales.length;
        
        res.render('agent/voucher-history', {
            sales,
            currentPage: page,
            totalPages: Math.ceil(totalSales / limit),
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Voucher history error:', error);
        res.status(500).send('Error loading voucher history');
    }
});

// ===== MONTHLY PAYMENTS =====

// GET: Monthly payments page
router.get('/payments', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const balance = await agentManager.getAgentBalance(agentId);
        
        res.render('agent/payments', {
            balance,
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent payments error:', error);
        res.status(500).send('Error loading payments page');
    }
});

// POST: Process monthly payment
router.post('/process-payment', requireAgentAuth, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const { customerId, invoiceId, paymentAmount, paymentMethod, notes } = req.body;
        
        if (!customerId || !paymentAmount) {
            return res.json({ success: false, message: 'Data pembayaran tidak lengkap' });
        }
        
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.json({ success: false, message: 'Jumlah pembayaran tidak valid' });
        }
        
        // Hapus mode partial, hanya proses pembayaran full
        // Cari invoice unpaid tertua
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./data/billing.db');
        db.get('SELECT id, status FROM invoices WHERE customer_id = ? AND status = "unpaid" ORDER BY due_date ASC, id ASC LIMIT 1', [customerId], async (err, invoice) => {
            db.close();
            if (err) {
                return res.json({ success: false, message: 'Error cek status invoice' });
            }
            if (!invoice) {
                return res.json({ success: false, message: 'Tidak ada tagihan unpaid untuk pelanggan ini' });
            }
            if (invoice.status === 'paid') {
                return res.json({ success: false, message: 'Gagal: Tagihan sudah lunas!' });
            }
            // Process full payment ke invoice unpaid tertua
            const result = await agentManager.processMonthlyPayment(
                agentId,
                customerId,
                invoice.id,
                amount,
                paymentMethod || 'cash'
            );
            await handlePaymentResult(result);
        });
        return; // Exit early for full payment
        
        async function handlePaymentResult(result) {
            
            if (result.success) {
            // Create notification
            await agentManager.createNotification(
                agentId,
                'payment_received',
                'Pembayaran Berhasil Diproses',
                `Pembayaran sebesar Rp ${amount.toLocaleString()} berhasil diproses. Komisi: Rp ${result.commission.toLocaleString()}`
            );
            
            // Auto-restore customer service if all invoices are paid
            try {
                const billingManager = require('../config/billing');
                const serviceSuspension = require('../config/serviceSuspension');
                
                const refreshedCustomer = await billingManager.getCustomerById(customerId);
                if (refreshedCustomer && refreshedCustomer.status === 'suspended') {
                    const customerInvoices = await billingManager.getInvoicesByCustomer(customerId);
                    const unpaidInvoices = customerInvoices.filter(i => i.status === 'unpaid');
                    
                    if (unpaidInvoices.length === 0) {
                        logger.info(`[AGENT] Auto-restore customer ${refreshedCustomer.username} - no unpaid invoices`);
                        const restoreResult = await serviceSuspension.restoreCustomerService(
                            refreshedCustomer, 
                            `Payment via Agent (${paymentMethod || 'cash'})`
                        );
                        
                        if (restoreResult.success) {
                            logger.info(`[AGENT] Customer ${refreshedCustomer.username} successfully restored`);
                            result.restoreInfo = {
                                success: true,
                                message: `Layanan pelanggan ${refreshedCustomer.username} berhasil dipulihkan`
                            };
                        } else {
                            logger.error(`[AGENT] Failed to restore customer ${refreshedCustomer.username}:`, restoreResult);
                            result.restoreInfo = {
                                success: false,
                                message: `Gagal memulihkan layanan pelanggan ${refreshedCustomer.username}`
                            };
                        }
                    } else {
                        logger.info(`[AGENT] Customer ${refreshedCustomer.username} still has ${unpaidInvoices.length} unpaid invoices - keeping suspended`);
                    }
                }
            } catch (restoreError) {
                logger.error('[AGENT] Auto-restore failed after payment:', restoreError);
                // Don't fail the payment if restore fails
            }
            
            // Send WhatsApp notification
            try {
                const agent = await agentManager.getAgentById(agentId);
                const paymentData = {
                    amount: amount,
                    method: paymentMethod || 'cash',
                    commission: result.commission
                };
                // Get customer data from database
                const sqlite3 = require('sqlite3').verbose();
                const db = new sqlite3.Database('./data/billing.db');
                db.get('SELECT name, phone FROM customers WHERE id = ?', [customerId], (err, customer) => {
                    db.close();
                    if (!err && customer) {
                        whatsappManager.sendPaymentNotification(agent, customer, paymentData)
                            .catch(e => logger.error('WhatsApp notification error:', e));
                    }
                    // Response dikirim di sini setelah WhatsApp (atau error)
                    res.json({
                        success: true,
                        message: 'Pembayaran berhasil diproses',
                        commission: result.commission
                    });
                });
            } catch (whatsappError) {
                logger.error('WhatsApp notification error:', whatsappError);
                // Jika error WhatsApp, tetap kirim response
                res.json({
                    success: true,
                    message: 'Pembayaran berhasil diproses',
                    commission: result.commission
                });
            }
        } else {
            res.json({ success: false, message: 'Gagal memproses pembayaran' });
        }
        }
    } catch (error) {
        logger.error('Process payment error:', error);
        res.json({ success: false, message: 'Terjadi kesalahan saat memproses pembayaran' });
    }
});

// GET: Payment history
router.get('/payment-history', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        
        const payments = await agentManager.getAgentMonthlyPayments(agentId, limit, offset);
        const totalPayments = payments.length;
        
        res.render('agent/payment-history', {
            payments,
            currentPage: page,
            totalPages: Math.ceil(totalPayments / limit),
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Payment history error:', error);
        res.status(500).send('Error loading payment history');
    }
});

// ===== BALANCE MANAGEMENT =====

// GET: Balance page
router.get('/balance', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const balance = await agentManager.getAgentBalance(agentId);
        const result = await agentManager.getAgentTransactions(agentId, 1, 50, 'all');
        
        res.render('agent/balance', {
            balance,
            transactions: result.data || [],
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent balance error:', error);
        res.status(500).send('Error loading balance page');
    }
});

// POST: Request balance
router.post('/request-balance', requireAgentAuth, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const { requestAmount, requestReason, requestNotes } = req.body;
        
        const amount = parseFloat(requestAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.json({ success: false, message: 'Jumlah saldo tidak valid' });
        }
        
        if (amount < 10000) {
            return res.json({ success: false, message: 'Minimum request saldo adalah Rp 10.000' });
        }
        
        if (amount > 1000000) {
            return res.json({ success: false, message: 'Maximum request saldo adalah Rp 1.000.000' });
        }
        
        // Format notes from reason and additional notes
        let notes = '';
        if (requestReason) {
            notes += `Alasan: ${requestReason}`;
        }
        if (requestNotes) {
            notes += notes ? ` - Catatan: ${requestNotes}` : `Catatan: ${requestNotes}`;
        }
        
        const result = await agentManager.requestBalance(agentId, amount, notes);
        
        if (result.success) {
            // Create notification with valid type
            await agentManager.createNotification(
                agentId,
                'balance_updated',
                'Request Saldo Dikirim',
                `Request saldo sebesar Rp ${requestAmount.toLocaleString()} telah dikirim ke admin`
            );
            
            // Send WhatsApp notification to admin
            try {
                const settings = getSettingsWithCache();
                const adminPhone = settings.admin_phone || settings.contact_phone;
                
                if (adminPhone && whatsappManager.sock) {
                    const agent = await agentManager.getAgentById(agentId);
                    const adminMessage = `🔔 **REQUEST SALDO AGENT**

👤 **Agent:** ${agent.name}
📱 **HP:** ${agent.phone}
💰 **Jumlah:** Rp ${requestAmount.toLocaleString()}
📅 **Tanggal:** ${new Date().toLocaleString('id-ID')}

Silakan login ke admin panel untuk memproses request ini.`;
                    
                    await whatsappManager.sock.sendMessage(adminPhone + '@s.whatsapp.net', { text: adminMessage });
                }
            } catch (whatsappError) {
                logger.error('WhatsApp admin notification error:', whatsappError);
                // Don't fail the transaction if WhatsApp fails
            }
            
            res.json({
                success: true,
                message: 'Request saldo berhasil dikirim ke admin'
            });
        } else {
            res.json({ success: false, message: 'Gagal mengirim request saldo' });
        }
    } catch (error) {
        logger.error('Request balance error:', error);
        res.json({ success: false, message: 'Terjadi kesalahan saat mengirim request saldo' });
    }
});

// ===== TRANSACTIONS =====

// GET: All transactions
router.get('/transactions', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const filter = req.query.filter || 'all';
        
        const result = await agentManager.getAgentTransactions(agentId, page, limit, filter);
        
        res.render('agent/transactions', {
            transactions: result.data || [],
            currentPage: result.pagination.page,
            totalPages: Math.ceil(result.pagination.total / result.pagination.limit),
            totalTransactions: result.pagination.total,
            currentFilter: filter,
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent transactions error:', error);
        res.status(500).send('Error loading transactions');
    }
});

// ===== NOTIFICATIONS =====

// GET: Notifications
router.get('/notifications', requireAgentAuth, noCache, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const notifications = await agentManager.getAgentNotifications(agentId, 100);
        
        res.render('agent/notifications', {
            notifications,
            appSettings: getSettingsWithCache()
        });
    } catch (error) {
        logger.error('Agent notifications error:', error);
        res.status(500).send('Error loading notifications');
    }
});

// POST: Mark notification as read
router.post('/mark-notification-read', requireAgentAuth, async (req, res) => {
    try {
        const { notificationId } = req.body;
        
        const result = await agentManager.markNotificationAsRead(notificationId);
        
        res.json({ success: result.success });
    } catch (error) {
        logger.error('Mark notification read error:', error);
        res.json({ success: false });
    }
});

// ===== API ENDPOINTS =====

// GET: Agent stats API
router.get('/api/stats', requireAgentAuth, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const stats = await agentManager.getAgentStats(agentId);
        
        res.json({ success: true, stats });
    } catch (error) {
        logger.error('Agent stats API error:', error);
        res.json({ success: false, error: 'Failed to get stats' });
    }
});

// GET: Recent transactions API
router.get('/api/recent-transactions', requireAgentAuth, async (req, res) => {
    try {
        const agentId = req.session.agentId;
        const limit = parseInt(req.query.limit) || 10;
        const result = await agentManager.getAgentTransactions(agentId, 1, limit, 'all');
        
        res.json({ success: true, transactions: result.data || [] });
    } catch (error) {
        logger.error('Recent transactions API error:', error);
        res.json({ success: false, error: 'Failed to get transactions' });
    }
});

// API: Search customer by name, id, or phone
router.get('/api/search-customer', requireAgentAuth, async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) return res.json({ success: false, customers: [] });
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./data/billing.db');
        const likeQ = `%${q}%`;
        let sql, params;
        if (/^\d+$/.test(q)) {
            sql = `SELECT c.id, c.name, c.phone, c.address, c.status, 
                   (SELECT status FROM invoices WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as payment_status,
                   (SELECT amount FROM invoices WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as last_invoice_amount,
                   (SELECT id FROM invoices WHERE customer_id = c.id AND status = 'unpaid' ORDER BY due_date ASC LIMIT 1) as unpaid_invoice_id,
                   (SELECT amount FROM invoices WHERE customer_id = c.id AND status = 'unpaid' ORDER BY due_date ASC LIMIT 1) as unpaid_invoice_amount
                   FROM customers c WHERE c.id = ? OR c.phone LIKE ? OR c.name LIKE ? LIMIT 10`;
            params = [parseInt(q), likeQ, likeQ];
        } else {
            sql = `SELECT c.id, c.name, c.phone, c.address, c.status,
                   (SELECT status FROM invoices WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as payment_status,
                   (SELECT amount FROM invoices WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as last_invoice_amount,
                   (SELECT id FROM invoices WHERE customer_id = c.id AND status = 'unpaid' ORDER BY due_date ASC LIMIT 1) as unpaid_invoice_id,
                   (SELECT amount FROM invoices WHERE customer_id = c.id AND status = 'unpaid' ORDER BY due_date ASC LIMIT 1) as unpaid_invoice_amount
                   FROM customers c WHERE c.name LIKE ? OR c.phone LIKE ? LIMIT 10`;
            params = [likeQ, likeQ];
        }
        db.all(sql, params, (err, rows) => {
            db.close();
            if (err) {
                return res.json({ success: false, customers: [] });
            }
            res.json({ success: true, customers: rows });
        });
    } catch (e) {
        res.json({ success: false, customers: [] });
    }
});

module.exports = router;

