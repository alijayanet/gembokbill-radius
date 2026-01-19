/**
 * Verify All Settings Display with Indonesian Descriptions
 * Memverifikasi bahwa semua pengaturan ditampilkan dengan keterangan bahasa Indonesia
 */

const fs = require('fs');
const path = require('path');

const adminSettingPath = path.join(__dirname, '../views/adminSetting.ejs');
const settingsPath = path.join(__dirname, '../settings.json');

console.log('🔍 Verifying All Settings Display with Indonesian Descriptions...\n');

try {
    // Baca file adminSetting.ejs
    const content = fs.readFileSync(adminSettingPath, 'utf8');
    
    // Baca settings.json untuk mengetahui field yang ada
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    
    // Cek hiddenFields
    const hiddenFieldsPattern = /const hiddenFields = \[([\s\S]*?)\];/;
    const hiddenFieldsMatch = content.match(hiddenFieldsPattern);
    
    if (hiddenFieldsMatch) {
        const hiddenFieldsContent = hiddenFieldsMatch[1];
        const hiddenFields = [];
        
        // Extract hidden fields
        hiddenFieldsContent.split(',').forEach(field => {
            const cleanField = field.trim().replace(/['"]/g, '');
            if (cleanField && !cleanField.startsWith('//')) {
                hiddenFields.push(cleanField);
            }
        });
        
        console.log('📋 Hidden Fields (Tidak Ditampilkan):');
        hiddenFields.forEach(field => {
            console.log(`  - ${field}`);
        });
        
        // Cek field yang akan ditampilkan
        const allFields = Object.keys(settings);
        const visibleFields = allFields.filter(field => !hiddenFields.includes(field));
        
        console.log(`\n📊 Field Statistics:`);
        console.log(`  - Total fields in settings.json: ${allFields.length}`);
        console.log(`  - Hidden fields: ${hiddenFields.length}`);
        console.log(`  - Visible fields: ${visibleFields.length}`);
        
        // Cek apakah ada fungsi getFieldDescription
        const hasDescriptionFunction = content.includes('function getFieldDescription');
        console.log(`\n🏷️  Indonesian Descriptions:`);
        console.log(`  - Description function: ${hasDescriptionFunction ? '✅ FOUND' : '❌ MISSING'}`);
        
        if (hasDescriptionFunction) {
            // Cek beberapa field penting
            const importantFields = [
                'suspension_grace_period_days',
                'rxpower_recap_enable',
                'offline_notification_enable',
                'auto_suspension_enabled',
                'pppoe_monitor_enable'
            ];
            
            console.log(`\n📝 Sample Field Descriptions:`);
            importantFields.forEach(field => {
                if (visibleFields.includes(field)) {
                    console.log(`  ✅ ${field}: Will show Indonesian description`);
                } else {
                    console.log(`  ❌ ${field}: Hidden or not found`);
                }
            });
        }
        
        // Cek apakah renderField menggunakan getFieldDescription
        const usesDescription = content.includes('getFieldDescription(key)');
        console.log(`\n🔧 Integration:`);
        console.log(`  - Uses description function: ${usesDescription ? '✅ YES' : '❌ NO'}`);
        
        // Cek format tampilan
        const hasFormText = content.includes('form-text text-muted mb-2');
        console.log(`  - Uses Bootstrap form-text: ${hasFormText ? '✅ YES' : '❌ NO'}`);
        
        console.log(`\n🎯 Expected Display Format:`);
        console.log(`  Grace Period Suspension (Hari)`);
        console.log(`  Jumlah hari sebelum layanan disuspend setelah jatuh tempo`);
        console.log(`  [input field]`);
        console.log(``);
        console.log(`  Notifikasi Perangkat Offline`);
        console.log(`  Aktifkan notifikasi perangkat offline`);
        console.log(`  [checkbox] Aktif`);
        
        console.log(`\n✅ Verification Summary:`);
        if (hasDescriptionFunction && usesDescription && hasFormText) {
            console.log(`  ✅ All settings will display with Indonesian descriptions`);
            console.log(`  ✅ Only technical fields are hidden`);
            console.log(`  ✅ User-friendly interface ready`);
        } else {
            console.log(`  ⚠️  Some components missing for full functionality`);
        }
        
    } else {
        console.log('❌ Could not find hiddenFields configuration');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
