let sock = null;
const { getSetting } = require('./settingsManager');

// Fungsi untuk set instance sock
function setSock(sockInstance) {
    sock = sockInstance;
}

// Helper function untuk format nomor telepon
function formatPhoneNumber(number) {
    // Hapus karakter non-digit
    let cleaned = number.replace(/\D/g, '');
    
    // Hapus awalan 0 jika ada
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Tambahkan kode negara 62 jika belum ada
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    
    return cleaned;
}

// Helper function untuk mendapatkan header dan footer dari settings
function getHeaderFooter() {
    try {
        const { getSettingsWithCache } = require('./settingsManager');
        const settings = getSettingsWithCache();
        
        return {
            header: settings.company_header || 'ALIJAYA BOT MANAGEMENT ISP',
            footer: settings.footer_info || 'Internet Tanpa Batas'
        };
    } catch (error) {
        return {
            header: 'ALIJAYA BOT MANAGEMENT ISP',
            footer: 'Internet Tanpa Batas'
        };
    }
}

// Helper function untuk memformat pesan dengan header dan footer
function formatMessageWithHeaderFooter(message, includeHeader = true, includeFooter = true) {
    const { header, footer } = getHeaderFooter();
    
    let formattedMessage = '';
    
    if (includeHeader) {
        formattedMessage += `🏢 *${header}*\n\n`;
    }
    
    formattedMessage += message;
    
    if (includeFooter) {
        formattedMessage += `\n\n${footer}`;
    }
    
    return formattedMessage;
}

// Fungsi untuk mengirim pesan
async function sendMessage(number, message) {
    if (!sock) {
        console.error('WhatsApp belum terhubung');
        return false;
    }
    try {
        let jid;
        if (typeof number === 'string' && number.endsWith('@g.us')) {
            // Jika group JID, gunakan langsung
            jid = number;
        } else {
            const formattedNumber = formatPhoneNumber(number);
            jid = `${formattedNumber}@s.whatsapp.net`;
        }
        
        // Format pesan dengan header dan footer
        let formattedMessage;
        if (typeof message === 'string') {
            formattedMessage = { text: formatMessageWithHeaderFooter(message) };
        } else if (message.text) {
            formattedMessage = { text: formatMessageWithHeaderFooter(message.text) };
        } else {
            formattedMessage = message;
        }
        
        await sock.sendMessage(jid, formattedMessage);
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
}

// Fungsi untuk mengirim pesan ke grup nomor
async function sendGroupMessage(numbers, message) {
    try {
        if (!sock) {
            console.error('Sock instance not set');
            return { success: false, sent: 0, failed: 0, results: [] };
        }

        const results = [];
        let sent = 0;
        let failed = 0;

        // Parse numbers jika berupa string
        let numberArray = numbers;
        if (typeof numbers === 'string') {
            numberArray = numbers.split(',').map(n => n.trim());
        }

        for (const number of numberArray) {
            try {
                // Validasi dan format nomor
                let cleanNumber = number.replace(/\D/g, '');
                
                // Jika dimulai dengan 0, ganti dengan 62
                if (cleanNumber.startsWith('0')) {
                    cleanNumber = '62' + cleanNumber.substring(1);
                }
                
                // Jika tidak dimulai dengan 62, tambahkan
                if (!cleanNumber.startsWith('62')) {
                    cleanNumber = '62' + cleanNumber;
                }
                
                // Validasi panjang nomor (minimal 10 digit setelah 62)
                if (cleanNumber.length < 12) {
                    console.warn(`Skipping invalid WhatsApp number: ${number} (too short)`);
                    failed++;
                    results.push({ number, success: false, error: 'Invalid number format' });
                    continue;
                }

                // Cek apakah nomor terdaftar di WhatsApp
                const [result] = await sock.onWhatsApp(cleanNumber);
                if (!result || !result.exists) {
                    console.warn(`Skipping invalid WhatsApp number: ${cleanNumber} (not registered)`);
                    failed++;
                    results.push({ number: cleanNumber, success: false, error: 'Not registered on WhatsApp' });
                    continue;
                }

                // Kirim pesan
                await sock.sendMessage(`${cleanNumber}@s.whatsapp.net`, { text: formatMessageWithHeaderFooter(message) });
                console.log(`Message sent to: ${cleanNumber}`);
                sent++;
                results.push({ number: cleanNumber, success: true });

            } catch (error) {
                console.error(`Error sending message to ${number}:`, error.message);
                failed++;
                results.push({ number, success: false, error: error.message });
            }
        }

        return {
            success: sent > 0,
            sent,
            failed,
            results
        };
    } catch (error) {
        console.error('Error in sendGroupMessage:', error);
        return { success: false, sent: 0, failed: numberArray ? numberArray.length : 0, results: [] };
    }
}

// Fungsi untuk mengirim pesan ke grup teknisi
async function sendTechnicianMessage(message, priority = 'normal') {
    try {
        // Ambil daftar teknisi dari database dengan whatsapp_group_id
        const sqlite3 = require('sqlite3').verbose();
        const path = require('path');

        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);

        const technicians = await new Promise((resolve, reject) => {
            const query = `
                SELECT phone, name, role, whatsapp_group_id
                FROM technicians
                WHERE is_active = 1
                ORDER BY role, name
            `;

            db.all(query, [], (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const technicianNumbers = technicians.map(tech => tech.phone);
        const technicianGroupId = getSetting('technician_group_id', '');
        let sentToGroup = false;
        let sentToNumbers = false;
        let sentToIndividualGroups = false;

        // Penambahan prioritas pesan
        let priorityIcon = '';
        if (priority === 'high') {
            priorityIcon = '🟠 *PENTING* ';
        } else if (priority === 'low') {
            priorityIcon = '🟢 *Info* ';
        }
        const priorityMessage = priorityIcon + message;

        // 1. Kirim ke grup utama (dari settings.json) jika ada
        if (technicianGroupId) {
            try {
                await sendMessage(technicianGroupId, priorityMessage);
                sentToGroup = true;
                console.log(`✅ Pesan dikirim ke grup teknisi utama: ${technicianGroupId}`);
            } catch (e) {
                console.error('❌ Gagal mengirim ke grup teknisi utama:', e);
            }
        }

        // 2. Kirim ke grup individual teknisi jika ada
        const techniciansWithGroups = technicians.filter(tech => tech.whatsapp_group_id && tech.whatsapp_group_id.trim() !== '');
        if (techniciansWithGroups.length > 0) {
            console.log(`📱 Mengirim ke ${techniciansWithGroups.length} grup teknisi individual...`);

            for (const tech of techniciansWithGroups) {
                try {
                    await sendMessage(tech.whatsapp_group_id, priorityMessage);
                    console.log(`✅ Pesan dikirim ke grup ${tech.name}: ${tech.whatsapp_group_id}`);
                    sentToIndividualGroups = true;
                } catch (e) {
                    console.error(`❌ Gagal mengirim ke grup ${tech.name} (${tech.whatsapp_group_id}):`, e);
                }
            }
        }

        // 3. Kirim ke nomor teknisi individual jika ada
        if (technicianNumbers && technicianNumbers.length > 0) {
            console.log(`📤 Mengirim ke ${technicianNumbers.length} nomor teknisi: ${technicianNumbers.join(', ')}`);
            const result = await sendGroupMessage(technicianNumbers, priorityMessage);
            sentToNumbers = result.success;
            console.log(`📊 Hasil pengiriman ke nomor teknisi: ${result.sent} berhasil, ${result.failed} gagal`);

            if (result.sent > 0) {
                sentToNumbers = true;
            }
        } else {
            console.log(`⚠️ Tidak ada nomor teknisi yang terdaftar, fallback ke admin`);
            // Jika tidak ada nomor teknisi, fallback ke admin
            const adminNumber = getSetting('admins.0', '');
            if (adminNumber) {
                console.log(`📤 Fallback: Mengirim ke admin ${adminNumber}`);
                const adminResult = await sendMessage(adminNumber, priorityMessage);
                sentToNumbers = adminResult;
                console.log(`📊 Hasil fallback admin: ${adminResult ? 'berhasil' : 'gagal'}`);
            } else {
                console.log(`❌ Tidak ada admin number yang tersedia untuk fallback`);
            }
        }

        const overallSuccess = sentToGroup || sentToIndividualGroups || sentToNumbers;

        console.log(`\n📊 RINGKASAN PENGIRIMAN TEKNISI:`);
        console.log(`   - Grup utama: ${sentToGroup ? '✅' : '❌'}`);
        console.log(`   - Grup individual: ${sentToIndividualGroups ? '✅' : '❌'} (${techniciansWithGroups.length} grup)`);
        console.log(`   - Nomor individual: ${sentToNumbers ? '✅' : '❌'} (${technicianNumbers.length} nomor)`);
        console.log(`   - Status keseluruhan: ${overallSuccess ? '✅ BERHASIL' : '❌ GAGAL'}`);

        return overallSuccess;
    } catch (error) {
        console.error('Error sending message to technician group:', error);
        return false;
    }
}

module.exports = {
    setSock,
    sendMessage,
    sendGroupMessage,
    sendTechnicianMessage,
    formatMessageWithHeaderFooter,
    getHeaderFooter
};
