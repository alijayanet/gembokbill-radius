const AgentManager = require('./agentManager');
const { getSettingsWithCache, getSetting } = require('./settingsManager');
const logger = require('./logger');

class AgentAdminCommands {
    constructor() {
        this.agentManager = new AgentManager();
    }

    // Handle agent admin commands
    async handleAgentAdminCommands(remoteJid, senderNumber, command, messageText, whatsappManager) {
        try {
            logger.info(`🤖 [AGENT COMMANDS] Processing command: "${command}" from ${senderNumber}`);
            
            // Check if sender is admin
            const adminNumbers = [];
            let i = 0;
            while (true) {
                const adminNum = getSetting(`admins.${i}`);
                if (!adminNum) break;
                adminNumbers.push(adminNum);
                i++;
            }
            
            logger.info(`🤖 [AGENT COMMANDS] Admin numbers: ${JSON.stringify(adminNumbers)}`);
            
            const cleanSenderNumber = senderNumber.replace('@s.whatsapp.net', '');
            const isAdmin = adminNumbers.includes(cleanSenderNumber);
            
            logger.info(`🤖 [AGENT COMMANDS] Sender: ${cleanSenderNumber}, isAdmin: ${isAdmin}`);
            
            if (!isAdmin) {
                await this.sendMessage(remoteJid, '❌ Anda tidak memiliki akses untuk perintah agent. Hanya admin yang dapat menggunakan perintah ini.');
                return;
            }
            
            // List agents command
            if (command === 'daftaragent' || command === 'listagent' || command === 'listagents') {
                await this.handleListAgents(remoteJid);
                return;
            }

            // Add agent command
            if (command.startsWith('tambahagent ') || command.startsWith('addagent ')) {
                const params = messageText.split(' ').slice(1);
                if (params.length >= 4) {
                    const [username, name, phone, password] = params;
                    await this.handleAddAgent(remoteJid, username, name, phone, password);
                } else {
                    await this.sendMessage(remoteJid, 
                        `❌ *FORMAT SALAH*

Format: *tambahagent [username] [nama] [phone] [password]*

Contoh: tambahagent john John Doe 081234567890 password123`);
                }
                return;
            }

            // Agent balance command
            if (command.startsWith('saldoagent ') || command.startsWith('agentbalance ')) {
                const agentIdentifier = messageText.split(' ')[1];
                await this.handleAgentBalance(remoteJid, agentIdentifier);
                return;
            }

            // Add agent balance command
            if (command.startsWith('tambahsaldoagent ') || command.startsWith('addagentbalance ')) {
                const params = messageText.split(' ').slice(1);
                if (params.length >= 2) {
                    const [agentIdentifier, amount] = params;
                    const notes = params.slice(2).join(' ') || 'Saldo ditambahkan via WhatsApp';
                    await this.handleAddAgentBalance(remoteJid, agentIdentifier, amount, notes);
                } else {
                    await this.sendMessage(remoteJid, 
                        `❌ *FORMAT SALAH*

Format: *tambahsaldoagent [nama_agen/agent_id] [jumlah] [catatan]*

Contoh: 
• tambahsaldoagent budi 100000 Top up saldo
• tambahsaldoagent 1 100000 Top up saldo`);
                }
                return;
            }

            // Agent stats command
            if (command === 'statistikagent' || command === 'agentstats') {
                await this.handleAgentStats(remoteJid);
                return;
            }

            // Agent requests command
            if (command === 'requestagent' || command === 'agentrequests') {
                await this.handleAgentRequests(remoteJid);
                return;
            }

            // Approve agent request command
            if (command.startsWith('setujuirequest ') || command.startsWith('approveagentrequest ')) {
                const requestId = messageText.split(' ')[1];
                const notes = messageText.split(' ').slice(2).join(' ') || 'Request disetujui via WhatsApp';
                await this.handleApproveAgentRequest(remoteJid, requestId, notes);
                return;
            }

            // Reject agent request command
            if (command.startsWith('tolakrequest ') || command.startsWith('rejectagentrequest ')) {
                const params = messageText.split(' ').slice(1);
                if (params.length >= 2) {
                    const [requestId, ...reasonParts] = params;
                    const reason = reasonParts.join(' ') || 'Request ditolak via WhatsApp';
                    await this.handleRejectAgentRequest(remoteJid, requestId, reason);
                } else {
                    await this.sendMessage(remoteJid, 
                        `❌ *FORMAT SALAH*

Format: *tolakrequest [request_id] [alasan]*

Contoh: tolakrequest 1 Data tidak lengkap`);
                }
                return;
            }

            // Help command
            if (command === 'agent' || command === 'bantuanagent' || command === 'agenthelp') {
                await this.handleAgentHelp(remoteJid);
                return;
            }

            // If no command matches, send unknown command message
            // JANGAN kirim pesan untuk command yang tidak dikenali
            // Ini akan mencegah respon otomatis terhadap setiap pesan
            console.log(`Perintah agent tidak dikenali: ${command}`);
            // await this.sendMessage(remoteJid, 
            //     `❓ *PERINTAH AGENT TIDAK DIKENAL*\n\nPerintah "${command}" tidak dikenali.\n\nKetik *agent* untuk melihat daftar perintah agent.`
            // );

        } catch (error) {
            logger.error('Agent admin command error:', error);
            // JANGAN kirim pesan error ke pengirim - hanya log error saja
            // Ini akan mencegah respon otomatis terhadap setiap pesan
            console.error('Error processing agent admin command:', error);
            // await this.sendMessage(remoteJid, '❌ Terjadi kesalahan saat memproses perintah agent.');
        }
    }

    // List all agents
    async handleListAgents(remoteJid) {
        try {
            const agents = await this.agentManager.getAllAgents();
            
            if (agents.length === 0) {
                await this.sendMessage(remoteJid, '📋 *DAFTAR AGENT*\n\nBelum ada agent terdaftar.');
                return;
            }

            let message = '📋 *DAFTAR AGENT*\n\n';
            agents.forEach((agent, index) => {
                const status = agent.status === 'active' ? '✅' : 
                             agent.status === 'inactive' ? '⏸️' : 
                             agent.status === 'suspended' ? '⛔' : '❓';
                
                message += `${index + 1}. *${agent.name}*\n`;
                message += `   ID: ${agent.id}\n`;
                message += `   Username: ${agent.username}\n`;
                message += `   HP: ${agent.phone}\n`;
                message += `   Status: ${status} ${agent.status}\n`;
                message += `   Saldo: Rp ${(agent.balance || 0).toLocaleString()}\n`;
                message += `   Komisi: ${agent.commission_rate}%\n\n`;
            });

            message += `\n📊 *Total Agent: ${agents.length}*`;
            
            await this.sendMessage(remoteJid, message);
        } catch (error) {
            logger.error('List agents error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal mengambil daftar agent.');
        }
    }

    // Add new agent
    async handleAddAgent(remoteJid, username, name, phone, password) {
        try {
            const agentData = {
                username,
                name,
                phone,
                password,
                status: 'active'
            };

            const result = await this.agentManager.createAgent(agentData);
            
            if (result.success) {
                // Create notification for agent
                await this.agentManager.createNotification(
                    result.agentId,
                    'registration_success',
                    'Akun Agent Dibuat',
                    `Akun agent Anda telah dibuat oleh admin. Username: ${username}`
                );

                await this.sendMessage(remoteJid, 
                    `✅ *AGENT BERHASIL DITAMBAHKAN*\n\n` +
                    `👤 Nama: ${name}\n` +
                    `🆔 Username: ${username}\n` +
                    `📱 HP: ${phone}\n` +
                    `🆔 ID: ${result.agentId}\n\n` +
                    `Agent dapat login menggunakan username dan password yang diberikan.`
                );
            } else {
                await this.sendMessage(remoteJid, 
                    `❌ *GAGAL MENAMBAHKAN AGENT*\n\n${result.message}`
                );
            }
        } catch (error) {
            logger.error('Add agent error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal menambahkan agent.');
        }
    }

    // Get agent balance
    async handleAgentBalance(remoteJid, agentIdentifier) {
        try {
            let agent;
            
            // Check if agentIdentifier is numeric (ID) or string (name/username)
            if (/^\d+$/.test(agentIdentifier)) {
                // Numeric - treat as ID
                agent = await this.agentManager.getAgentById(agentIdentifier);
            } else {
                // String - search by name or username
                agent = await this.agentManager.getAgentByNameOrUsername(agentIdentifier);
            }
            
            if (!agent) {
                await this.sendMessage(remoteJid, `❌ Agent "${agentIdentifier}" tidak ditemukan.`);
                return;
            }

            const balance = await this.agentManager.getAgentBalance(agent.id);
            
            await this.sendMessage(remoteJid, 
                `💰 *SALDO AGENT*\n\n` +
                `👤 Nama: ${agent.name}\n` +
                `🆔 Username: ${agent.username}\n` +
                `📱 HP: ${agent.phone}\n` +
                `💰 Saldo: Rp ${balance.toLocaleString()}\n` +
                `📊 Komisi: ${agent.commission_rate}%\n` +
                `📅 Terakhir Update: ${new Date().toLocaleString('id-ID')}`
            );
        } catch (error) {
            logger.error('Agent balance error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal mengambil saldo agent.');
        }
    }

    // Add agent balance
    async handleAddAgentBalance(remoteJid, agentIdentifier, amount, notes) {
        try {
            let agent;
            
            // Check if agentIdentifier is numeric (ID) or string (name/username)
            if (/^\d+$/.test(agentIdentifier)) {
                // Numeric - treat as ID
                agent = await this.agentManager.getAgentById(agentIdentifier);
            } else {
                // String - search by name or username
                agent = await this.agentManager.getAgentByNameOrUsername(agentIdentifier);
            }
            
            if (!agent) {
                await this.sendMessage(remoteJid, `❌ Agent "${agentIdentifier}" tidak ditemukan.`);
                return;
            }

            const amountNum = parseInt(amount);
            if (isNaN(amountNum) || amountNum < 1000) {
                await this.sendMessage(remoteJid, '❌ Jumlah saldo minimal Rp 1.000.');
                return;
            }

            const result = await this.agentManager.addBalance(agent.id, amountNum, notes);
            
            if (result.success) {
                // Send WhatsApp notification to agent
                try {
                    const AgentWhatsAppManager = require('./agentWhatsApp');
                    const whatsappManager = new AgentWhatsAppManager();
                    
                    if (whatsappManager.sock) {
                        const balanceData = {
                            previousBalance: agent.balance - amountNum,
                            currentBalance: agent.balance,
                            change: amountNum,
                            description: notes
                        };
                        
                        await whatsappManager.sendBalanceUpdateNotification(agent, balanceData);
                    }
                } catch (whatsappError) {
                    logger.error('WhatsApp notification error:', whatsappError);
                }

                await this.sendMessage(remoteJid, 
                    `✅ *SALDO AGENT BERHASIL DITAMBAHKAN*\n\n` +
                    `👤 Agent: ${agent.name}\n` +
                    `💰 Jumlah: Rp ${amountNum.toLocaleString()}\n` +
                    `📝 Catatan: ${notes}\n` +
                    `💰 Saldo Baru: Rp ${agent.balance.toLocaleString()}`
                );
            } else {
                await this.sendMessage(remoteJid, 
                    `❌ *GAGAL MENAMBAHKAN SALDO*\n\n${result.message}`
                );
            }
        } catch (error) {
            logger.error('Add agent balance error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal menambahkan saldo agent.');
        }
    }

    // Get agent statistics
    async handleAgentStats(remoteJid) {
        try {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database('./data/billing.db');
            
            const stats = {};
            
            // Get agent counts
            const agentCounts = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT status, COUNT(*) as count 
                    FROM agents 
                    GROUP BY status
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            // Get total balance requests
            const balanceRequests = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                    FROM agent_balance_requests
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            // Get total voucher sales
            const voucherSales = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT COUNT(*) as total, SUM(price) as total_value
                    FROM agent_voucher_sales
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            // Get total monthly payments
            const monthlyPayments = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT COUNT(*) as total, SUM(payment_amount) as total_value
                    FROM agent_monthly_payments
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            db.close();
            
            let message = '📊 *STATISTIK AGENT*\n\n';
            
            // Agent counts
            message += '👥 *AGENT:*\n';
            agentCounts.forEach(row => {
                const status = row.status === 'active' ? '✅' : 
                             row.status === 'inactive' ? '⏸️' : 
                             row.status === 'suspended' ? '⛔' : '❓';
                message += `${status} ${row.status}: ${row.count}\n`;
            });
            
            message += '\n💰 *REQUEST SALDO:*\n';
            message += `📋 Total: ${balanceRequests.total}\n`;
            message += `⏳ Pending: ${balanceRequests.pending}\n`;
            message += `✅ Approved: ${balanceRequests.approved}\n`;
            message += `❌ Rejected: ${balanceRequests.rejected}\n`;
            
            message += '\n🎫 *VOUCHER SALES:*\n';
            message += `📊 Total: ${voucherSales.total}\n`;
            message += `💰 Nilai: Rp ${(voucherSales.total_value || 0).toLocaleString()}\n`;
            
            message += '\n💳 *MONTHLY PAYMENTS:*\n';
            message += `📊 Total: ${monthlyPayments.total}\n`;
            message += `💰 Nilai: Rp ${(monthlyPayments.total_value || 0).toLocaleString()}\n`;
            
            await this.sendMessage(remoteJid, message);
        } catch (error) {
            logger.error('Agent stats error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal mengambil statistik agent.');
        }
    }

    // Get agent balance requests
    async handleAgentRequests(remoteJid) {
        try {
            const requests = await this.agentManager.getBalanceRequests('pending');
            
            if (requests.length === 0) {
                await this.sendMessage(remoteJid, '📋 *REQUEST SALDO AGENT*\n\nTidak ada request pending.');
                return;
            }

            let message = '📋 *REQUEST SALDO AGENT (PENDING)*\n\n';
            requests.forEach((request, index) => {
                message += `${index + 1}. *${request.agent_name}*\n`;
                message += `   ID Request: ${request.id}\n`;
                message += `   HP: ${request.agent_phone}\n`;
                message += `   Jumlah: Rp ${request.amount.toLocaleString()}\n`;
                message += `   Tanggal: ${new Date(request.requested_at).toLocaleString('id-ID')}\n\n`;
            });

            message += `\n💡 *CARA APPROVE/REJECT:*\n`;
            message += `• Approve: *approveagentrequest [id] [catatan]*\n`;
            message += `• Reject: *rejectagentrequest [id] [alasan]*\n`;
            message += `\nContoh: approveagentrequest 1 Top up saldo`;
            
            await this.sendMessage(remoteJid, message);
        } catch (error) {
            logger.error('Agent requests error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal mengambil request agent.');
        }
    }

    // Approve agent request
    async handleApproveAgentRequest(remoteJid, requestId, notes) {
        try {
            const result = await this.agentManager.approveBalanceRequest(requestId, 1, notes);
            
            if (result.success) {
                await this.sendMessage(remoteJid, 
                    `✅ *REQUEST SALDO DISETUJUI*\n\n` +
                    `🆔 Request ID: ${requestId}\n` +
                    `📝 Catatan: ${notes}\n\n` +
                    `Agent akan menerima notifikasi WhatsApp.`
                );
            } else {
                await this.sendMessage(remoteJid, 
                    `❌ *GAGAL MENYETUJUI REQUEST*\n\n${result.message}`
                );
            }
        } catch (error) {
            logger.error('Approve agent request error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal menyetujui request agent.');
        }
    }

    // Reject agent request
    async handleRejectAgentRequest(remoteJid, requestId, reason) {
        try {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database('./data/billing.db');
            
            const updateSql = `
                UPDATE agent_balance_requests 
                SET status = 'rejected', processed_at = CURRENT_TIMESTAMP, admin_notes = ?
                WHERE id = ?
            `;
            
            db.run(updateSql, [reason, requestId], async (err) => {
                db.close();
                
                if (err) {
                    await this.sendMessage(remoteJid, '❌ Gagal menolak request saldo.');
                    return;
                }
                
                // Send WhatsApp notification to agent
                try {
                    const AgentWhatsAppManager = require('./agentWhatsApp');
                    const whatsappManager = new AgentWhatsAppManager();
                    
                    // Get request details for notification
                    const request = await new Promise((resolve, reject) => {
                        const db2 = new sqlite3.Database('./data/billing.db');
                        db2.get(`
                            SELECT abr.*, a.name as agent_name, a.phone as agent_phone
                            FROM agent_balance_requests abr
                            JOIN agents a ON abr.agent_id = a.id
                            WHERE abr.id = ?
                        `, [requestId], (err, row) => {
                            db2.close();
                            if (err) reject(err);
                            else resolve(row);
                        });
                    });
                    
                    if (request && whatsappManager.sock) {
                        const agent = {
                            name: request.agent_name,
                            phone: request.agent_phone
                        };
                        
                        const requestData = {
                            amount: request.amount,
                            requestedAt: request.requested_at,
                            rejectReason: reason
                        };
                        
                        await whatsappManager.sendRequestRejectedNotification(agent, requestData);
                    }
                } catch (whatsappError) {
                    logger.error('WhatsApp notification error:', whatsappError);
                }
                
                await this.sendMessage(remoteJid, 
                    `❌ *REQUEST SALDO DITOLAK*\n\n` +
                    `🆔 Request ID: ${requestId}\n` +
                    `📝 Alasan: ${reason}\n\n` +
                    `Agent akan menerima notifikasi WhatsApp.`
                );
            });
        } catch (error) {
            logger.error('Reject agent request error:', error);
            await this.sendMessage(remoteJid, '❌ Gagal menolak request agent.');
        }
    }

    // Show agent help
    async handleAgentHelp(remoteJid) {
        const settings = getSettingsWithCache();
        const companyHeader = settings.company_header || settings.app_name || 'GEMBOK-BILLING';
        const formattedHeader = companyHeader.includes('📱') ? companyHeader + '\n\n' : `📱 ${companyHeader} 📱\n\n`;
        
        const message = `${formattedHeader}🤖 *PERINTAH ADMIN AGENT*

👥 *MANAJEMEN AGENT:*
• *daftaragent* — Daftar semua agent
• *tambahagent [username] [nama] [phone] [password]* — Tambah agent baru
• *saldoagent [nama_agen/agent_id]* — Cek saldo agent
• *tambahsaldoagent [nama_agen/agent_id] [jumlah] [catatan]* — Tambah saldo agent

📊 *LAPORAN & STATISTIK:*
• *statistikagent* — Statistik lengkap agent
• *requestagent* — Daftar request saldo pending

✅ *APPROVAL:*
• *setujuirequest [request_id] [catatan]* — Setujui request saldo
• *tolakrequest [request_id] [alasan]* — Tolak request saldo

📝 *CONTOH PENGGUNAAN:*
• daftaragent
• tambahagent john "John Doe" 081234567890 password123
• saldoagent budi
• tambahsaldoagent budi 100000 Top up saldo
• saldoagent 1
• tambahsaldoagent 1 100000 Top up saldo
• statistikagent
• requestagent
• setujuirequest 1 Request disetujui
• tolakrequest 1 Data tidak lengkap

❓ *BANTUAN:* Ketik *agent* untuk melihat menu ini lagi.`;

        await this.sendMessage(remoteJid, message);
    }

    // Send message helper
    async sendMessage(remoteJid, message) {
        // This will be handled by the main WhatsApp handler
        // The sendMessage function is set by whatsapp-message-handlers.js
        if (this._sendMessage && typeof this._sendMessage === 'function') {
            await this._sendMessage(remoteJid, message);
        } else {
            console.log(`WhatsApp to ${remoteJid}: ${message}`);
        }
        return true;
    }
}

module.exports = AgentAdminCommands;
