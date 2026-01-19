const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { getSetting } = require('../config/settingsManager');

console.log('🔍 WHATSAPP GROUP ID FINDER');
console.log('='.repeat(50));
console.log('Script ini akan membantu Anda mendapatkan Group ID WhatsApp');
console.log('');

async function getWhatsAppGroupId() {
    try {
        console.log('📱 Memulai koneksi WhatsApp...');

        // Buat direktori session
        const sessionDir = getSetting('whatsapp_session_path', './whatsapp-session');
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // Load auth state
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        // Penanganan versi dengan error handling yang lebih baik
        let version;
        try {
            const versionResult = await fetchLatestBaileysVersion();
            // Tangani berbagai tipe return value
            if (Array.isArray(versionResult)) {
                version = versionResult;
            } else if (versionResult && Array.isArray(versionResult.version)) {
                version = versionResult.version;
            } else {
                // Fallback ke versi default jika fetching gagal
                version = [2, 3000, 1023223821];
            }
            console.log(`📱 Using WhatsApp Web version: ${version.join('.')}`);
        } catch (error) {
            console.warn(`⚠️ Failed to fetch latest WhatsApp version, using fallback:`, error.message);
            version = [2, 3000, 1023223821];
        }

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: pino({ level: 'silent' }),
            browser: ['Group ID Finder', 'Chrome', '1.0.0'],
            version: version
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) && 
                                      (lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut);
                
                if (shouldReconnect) {
                    console.log('🔁 Mencoba koneksi ulang...');
                    setTimeout(getWhatsAppGroupId, 3000);
                } else {
                    console.log('❌ Koneksi ditutup secara permanen');
                    process.exit(1);
                }
            }
            
            if (connection === 'open') {
                console.log('✅ WhatsApp berhasil terhubung!');
                console.log('🔍 Mengambil daftar grup...');
                
                try {
                    const groups = await sock.groupFetchAllParticipating();
                    console.log(`\n📋 Ditemukan ${Object.keys(groups).length} grup:`);
                    console.log('═'.repeat(50));
                    
                    for (const groupId in groups) {
                        const group = groups[groupId];
                        console.log(`📝 Nama Grup: ${group.subject}`);
                        console.log(`🆔 Group ID: ${groupId}`);
                        console.log(`👥 Anggota: ${group.participants.length}`);
                        console.log('─'.repeat(30));
                    }
                    
                    console.log('\n✅ Proses selesai. Anda dapat menyalin Group ID yang dibutuhkan.');
                } catch (error) {
                    console.error('❌ Error mengambil grup:', error.message);
                }
                
                // Tutup koneksi setelah selesai
                setTimeout(() => {
                    sock.end();
                    console.log('🔚 Koneksi ditutup');
                    process.exit(0);
                }, 5000);
            }
        });
    } catch (error) {
        console.error('❌ Error koneksi WhatsApp:', error.message);
        process.exit(1);
    }
}

// Jalankan fungsi
getWhatsAppGroupId();