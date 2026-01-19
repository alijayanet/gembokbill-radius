/**
 * Check Settings Duplicates
 * Memverifikasi bahwa tidak ada field duplikat di settings.json
 */

const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../settings.json');

console.log('🔍 Checking for duplicates in settings.json...\n');

try {
    // Baca file settings.json
    const rawSettings = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(rawSettings);
    
    // Dapatkan semua keys
    const keys = Object.keys(settings);
    console.log(`📋 Total fields in settings.json: ${keys.length}`);
    
    // Cek duplikasi
    const duplicates = [];
    const seen = new Set();
    
    for (const key of keys) {
        if (seen.has(key)) {
            duplicates.push(key);
        } else {
            seen.add(key);
        }
    }
    
    if (duplicates.length > 0) {
        console.log('❌ Duplicates found:');
        duplicates.forEach(dup => {
            console.log(`   - ${dup}`);
        });
    } else {
        console.log('✅ No duplicates found!');
    }
    
    // Cek field yang tidak perlu (internal/helper fields)
    console.log('\n🔍 Checking for unnecessary internal fields...');
    const unnecessaryFields = keys.filter(key => 
        key.startsWith('_') || 
        (key.includes('_info') && key.startsWith('_')) || 
        key.includes('_suggested') ||
        key.includes('_conversion')
    );
    
    if (unnecessaryFields.length > 0) {
        console.log('⚠️  Unnecessary internal fields found:');
        unnecessaryFields.forEach(field => {
            console.log(`   - ${field}: ${JSON.stringify(settings[field])}`);
        });
    } else {
        console.log('✅ No unnecessary internal fields found!');
    }
    
    // Cek field yang mungkin duplikat (berbeda format tapi sama fungsi)
    console.log('\n🔍 Checking for potential duplicate functionality...');
    const potentialDuplicates = [];
    
    // Cek WhatsApp rate limit
    const hasWhatsAppRateLimitObject = settings.whatsapp_rate_limit && typeof settings.whatsapp_rate_limit === 'object';
    const hasWhatsAppRateLimitFields = keys.some(key => key.startsWith('whatsapp_rate_limit.'));
    
    if (hasWhatsAppRateLimitObject && hasWhatsAppRateLimitFields) {
        potentialDuplicates.push('WhatsApp rate limit (object vs individual fields)');
    }
    
    // Cek interval settings - ini bukan duplikasi karena diperlukan untuk kompatibilitas
    const hasIntervalMs = keys.some(key => key.includes('_interval') && !key.includes('_hours'));
    const hasIntervalHours = keys.some(key => key.includes('_interval_hours'));
    
    if (hasIntervalMs && hasIntervalHours) {
        console.log('ℹ️  Interval settings have both milliseconds and hours format (required for compatibility)');
    }
    
    if (potentialDuplicates.length > 0) {
        console.log('⚠️  Potential duplicate functionality:');
        potentialDuplicates.forEach(dup => {
            console.log(`   - ${dup}`);
        });
    } else {
        console.log('✅ No potential duplicate functionality found!');
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   - Total fields: ${keys.length}`);
    console.log(`   - Duplicates: ${duplicates.length}`);
    console.log(`   - Unnecessary fields: ${unnecessaryFields.length}`);
    console.log(`   - Potential duplicates: ${potentialDuplicates.length}`);
    
    if (duplicates.length === 0 && unnecessaryFields.length === 0 && potentialDuplicates.length === 0) {
        console.log('\n🎉 settings.json is clean and well-organized!');
    } else {
        console.log('\n⚠️  settings.json needs cleanup');
    }
    
} catch (error) {
    console.error('❌ Error reading settings.json:', error.message);
}
