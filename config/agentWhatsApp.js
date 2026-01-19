const logger = require('./logger');

// Helper function to get settings with cache
function getSettingsWithCache() {
    try {
        const { getSettings } = require('./settings');
        return getSettings();
    } catch (error) {
        logger.error('Error getting settings:', error);
        return {};
    }
}

class AgentWhatsAppManager {
    constructor() {
        this.sock = null;
        
        // Try to get socket from global if available
        if (typeof global !== 'undefined') {
            if (global.whatsappSocket) {
                this.sock = global.whatsappSocket;
            } else if (typeof global.getWhatsAppSocket === 'function') {
                this.sock = global.getWhatsAppSocket();
            }
        }
    }

    setSocket(sock) {
        this.sock = sock;
    }

    // ===== VOUCHER NOTIFICATIONS =====

    async sendVoucherNotification(agent, customer, voucherData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for voucher notification');
                return { success: false, message: 'WhatsApp tidak tersedia' };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || settings.app_name || 'GEMBOK-BILLING';
            const formattedHeader = companyHeader.includes('📱') ? companyHeader + '\n\n' : `📱 ${companyHeader} 📱\n\n`;
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            // Message untuk agent
            const agentMessage = `${formattedHeader}🎫 **VOUCHER BERHASIL DIJUAL**

📋 **Detail Voucher:**
• Kode: \`${voucherData.voucherCode}\`
• Paket: ${voucherData.packageName}
• Harga: Rp ${voucherData.price.toLocaleString()}
• Komisi: Rp ${voucherData.commission.toLocaleString()}

👤 **Pelanggan:**
• Nama: ${customer.name}
• HP: ${customer.phone || 'Tidak ada'}

✅ Voucher telah berhasil dijual dan komisi telah ditambahkan ke saldo Anda.${footerInfo}`;

            // Message untuk pelanggan
            const customerMessage = `${formattedHeader}🎫 **VOUCHER HOTSPOT ANDA**

📋 **Detail Voucher:**
• Kode: \`${voucherData.voucherCode}\`
• Paket: ${voucherData.packageName}
• Harga: Rp ${voucherData.price.toLocaleString()}

🔑 **Cara Menggunakan:**
1. Hubungkan ke WiFi hotspot
2. Masukkan kode voucher: \`${voucherData.voucherCode}\`
3. Nikmati akses internet sesuai paket

📞 **Bantuan:** Hubungi ${settings.contact_phone || 'Admin'} jika ada masalah.${footerInfo}`;

            // Kirim ke agent
            if (agent.phone) {
                const formattedAgentPhone = this.formatPhoneNumber(agent.phone) + '@s.whatsapp.net';
                await this.sock.sendMessage(formattedAgentPhone, { text: agentMessage });
            }

            // Kirim ke pelanggan jika ada nomor HP
            if (customer.phone) {
                const formattedCustomerPhone = this.formatPhoneNumber(customer.phone) + '@s.whatsapp.net';
                await this.sock.sendMessage(formattedCustomerPhone, { text: customerMessage });
            }

            return { success: true, message: 'Notifikasi berhasil dikirim' };
        } catch (error) {
            logger.error('Send voucher notification error:', error);
            return { success: false, message: 'Gagal mengirim notifikasi' };
        }
    }

    // Send voucher directly to customer
    async sendVoucherToCustomer(customerPhone, customerName, voucherCode, packageName, price, agentInfo = null) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for customer voucher');
                return { success: false, message: 'WhatsApp tidak tersedia' };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || settings.app_name || 'GEMBOK-BILLING';
            const formattedHeader = companyHeader.includes('📱') ? companyHeader + '\n\n' : `📱 ${companyHeader} 📱\n\n`;
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            // Create agent info text
            let agentInfoText = '';
            if (agentInfo && agentInfo.name) {
                agentInfoText = `\n👤 **Dibeli melalui Agent:** ${agentInfo.name}`;
                if (agentInfo.phone) {
                    agentInfoText += `\n📞 **Kontak Agent:** ${agentInfo.phone}`;
                }
            }

            // Message untuk customer (tanpa harga internal)
            const customerMessage = `${formattedHeader}🎫 **VOUCHER HOTSPOT ANDA**

📋 **Detail Voucher:**
• Kode: \`${voucherCode}\`
• Paket: ${packageName}
• Harga: Rp ${price.toLocaleString('id-ID')}${agentInfoText}

🔑 **Cara Menggunakan:**
1. Hubungkan ke WiFi hotspot
2. Masukkan kode voucher: \`${voucherCode}\`
3. Nikmati akses internet sesuai paket

📞 **Bantuan:** Hubungi ${settings.contact_phone || 'Admin'} jika ada masalah.${footerInfo}`;

            // Kirim ke customer
            const formattedCustomerPhone = this.formatPhoneNumber(customerPhone) + '@s.whatsapp.net';
            await this.sock.sendMessage(formattedCustomerPhone, { text: customerMessage });
            
            logger.info(`Voucher sent to customer: ${customerPhone}`);
            return { success: true, message: 'Voucher berhasil dikirim ke customer' };
        } catch (error) {
            logger.error('Send voucher to customer error:', error);
            return { success: false, message: 'Gagal mengirim voucher ke customer' };
        }
    }

    // ===== PAYMENT NOTIFICATIONS =====

    async sendPaymentNotification(agent, customer, paymentData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for payment notification');
                return { success: false, message: 'WhatsApp tidak tersedia' };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || settings.app_name || 'GEMBOK-BILLING';
            const formattedHeader = companyHeader.includes('📱') ? companyHeader + '\n\n' : `📱 ${companyHeader} 📱\n\n`;
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            // Message untuk agent
            const agentMessage = `${formattedHeader}💰 **PEMBAYARAN BERHASIL DIPROSES**

📋 **Detail Pembayaran:**
• Jumlah: Rp ${paymentData.amount.toLocaleString()}
• Metode: ${paymentData.method}
• Komisi: Rp ${paymentData.commission.toLocaleString()}

👤 **Pelanggan:**
• Nama: ${customer.name}
• HP: ${customer.phone || 'Tidak ada'}

✅ Pembayaran telah berhasil diproses dan komisi telah ditambahkan ke saldo Anda.${footerInfo}`;

            // Message untuk pelanggan
            const customerMessage = `${formattedHeader}✅ **PEMBAYARAN DITERIMA**

📋 **Detail Pembayaran:**
• Jumlah: Rp ${paymentData.amount.toLocaleString()}
• Metode: ${paymentData.method}
• Tanggal: ${new Date().toLocaleString('id-ID')}

👤 **Diproses oleh:** ${agent.name}

✅ Terima kasih atas pembayaran Anda. Tagihan telah lunas.${footerInfo}`;

            // Kirim ke agent
            if (agent.phone) {
                const formattedAgentPhone = this.formatPhoneNumber(agent.phone) + '@s.whatsapp.net';
                await this.sock.sendMessage(formattedAgentPhone, { text: agentMessage });
            }

            // Kirim ke pelanggan jika ada nomor HP
            if (customer.phone) {
                const formattedCustomerPhone = this.formatPhoneNumber(customer.phone) + '@s.whatsapp.net';
                await this.sock.sendMessage(formattedCustomerPhone, { text: customerMessage });
            }

            return { success: true, message: 'Notifikasi berhasil dikirim' };
        } catch (error) {
            logger.error('Send payment notification error:', error);
            return { success: false, message: 'Gagal mengirim notifikasi' };
        }
    }

    // ===== BALANCE NOTIFICATIONS =====

    async sendBalanceUpdateNotification(agent, balanceData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for balance notification');
                return { success: false, message: 'WhatsApp tidak tersedia' };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || settings.app_name || 'GEMBOK-BILLING';
            const formattedHeader = companyHeader.includes('📱') ? companyHeader + '\n\n' : `📱 ${companyHeader} 📱\n\n`;
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            const message = `${formattedHeader}💰 **SALDO TELAH DIUPDATE**

📋 **Detail Saldo:**
• Saldo Sebelumnya: Rp ${balanceData.previousBalance.toLocaleString()}
• Perubahan: ${balanceData.change > 0 ? '+' : ''}Rp ${balanceData.change.toLocaleString()}
• Saldo Sekarang: Rp ${balanceData.currentBalance.toLocaleString()}

📝 **Keterangan:** ${balanceData.description}

✅ Saldo Anda telah berhasil diupdate.${footerInfo}`;

            if (agent.phone) {
                const formattedAgentPhone = this.formatPhoneNumber(agent.phone) + '@s.whatsapp.net';
                await this.sock.sendMessage(formattedAgentPhone, { text: message });
            }

            return { success: true, message: 'Notifikasi berhasil dikirim' };
        } catch (error) {
            logger.error('Send balance notification error:', error);
            return { success: false, message: 'Gagal mengirim notifikasi' };
        }
    }

    // ===== REQUEST NOTIFICATIONS =====

    async sendRequestApprovedNotification(agent, requestData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for request notification');
                return { success: false, message: 'WhatsApp tidak tersedia' };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || settings.app_name || 'GEMBOK-BILLING';
            const formattedHeader = companyHeader.includes('📱') ? companyHeader + '\n\n' : `📱 ${companyHeader} 📱\n\n`;
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            const message = `${formattedHeader}✅ **REQUEST SALDO DISETUJUI**

📋 **Detail Request:**
• Jumlah: Rp ${requestData.amount.toLocaleString()}
• Tanggal Request: ${new Date(requestData.requestedAt).toLocaleString('id-ID')}
• Tanggal Disetujui: ${new Date().toLocaleString('id-ID')}

💰 **Saldo Anda:**
• Sebelumnya: Rp ${requestData.previousBalance.toLocaleString()}
• Sekarang: Rp ${requestData.newBalance.toLocaleString()}

📝 **Catatan Admin:** ${requestData.adminNotes || 'Tidak ada catatan'}

✅ Request saldo Anda telah disetujui dan saldo telah ditambahkan.${footerInfo}`;

            if (agent.phone) {
                const formattedAgentPhone = this.formatPhoneNumber(agent.phone) + '@s.whatsapp.net';
                await this.sock.sendMessage(formattedAgentPhone, { text: message });
            }

            return { success: true, message: 'Notifikasi berhasil dikirim' };
        } catch (error) {
            logger.error('Send request approved notification error:', error);
            return { success: false, message: 'Gagal mengirim notifikasi' };
        }
    }

    async sendRequestRejectedNotification(agent, requestData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for request notification');
                return { success: false, message: 'WhatsApp tidak tersedia' };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || settings.app_name || 'GEMBOK-BILLING';
            const formattedHeader = companyHeader.includes('📱') ? companyHeader + '\n\n' : `📱 ${companyHeader} 📱\n\n`;
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            const message = `${formattedHeader}❌ **REQUEST SALDO DITOLAK**

📋 **Detail Request:**
• Jumlah: Rp ${requestData.amount.toLocaleString()}
• Tanggal Request: ${new Date(requestData.requestedAt).toLocaleString('id-ID')}
• Tanggal Ditolak: ${new Date().toLocaleString('id-ID')}

📝 **Alasan Penolakan:**
${requestData.rejectReason}

💡 **Saran:**
• Pastikan request saldo sesuai dengan kebutuhan bisnis
• Hubungi admin untuk informasi lebih lanjut

📞 **Bantuan:** Hubungi ${settings.contact_phone || 'Admin'} untuk konsultasi.${footerInfo}`;

            if (agent.phone) {
                const formattedAgentPhone = this.formatPhoneNumber(agent.phone) + '@s.whatsapp.net';
                await this.sock.sendMessage(formattedAgentPhone, { text: message });
            }

            return { success: true, message: 'Notifikasi berhasil dikirim' };
        } catch (error) {
            logger.error('Send request rejected notification error:', error);
            return { success: false, message: 'Gagal mengirim notifikasi' };
        }
    }

    // ===== BULK NOTIFICATIONS =====

    async sendBulkNotifications(notifications) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for bulk notifications');
                return { success: false, message: 'WhatsApp tidak tersedia' };
            }

            let sent = 0;
            let failed = 0;

            for (const notification of notifications) {
                try {
                    if (notification.phone) {
                        const formattedPhone = this.formatPhoneNumber(notification.phone) + '@s.whatsapp.net';
                        await this.sock.sendMessage(formattedPhone, { text: notification.message });
                        sent++;
                        
                        // Delay between messages to avoid rate limiting
                        await this.delay(1000);
                    }
                } catch (error) {
                    failed++;
                    logger.error('Bulk notification error:', error);
                }
            }

            return { success: true, sent, failed };
        } catch (error) {
            logger.error('Send bulk notifications error:', error);
            return { success: false, message: 'Gagal mengirim notifikasi bulk' };
        }
    }

    // ===== UTILITY METHODS =====

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Format phone number for WhatsApp
    formatPhoneNumber(phone) {
        if (!phone) return null;
        
        // Remove all non-digit characters
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Add country code if not present
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('62')) {
            cleanPhone = '62' + cleanPhone;
        }
        
        return cleanPhone;
    }
}

module.exports = AgentWhatsAppManager;
