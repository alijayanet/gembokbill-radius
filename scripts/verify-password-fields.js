/**
 * Verify Password Fields Display
 * Memverifikasi bahwa field password ditampilkan dengan input type="password"
 */

const fs = require('fs');
const path = require('path');

const adminSettingPath = path.join(__dirname, '../views/adminSetting.ejs');
const settingsPath = path.join(__dirname, '../settings.json');

console.log('🔍 Verifying Password Fields Display...\n');

try {
    // Baca file adminSetting.ejs
    const content = fs.readFileSync(adminSettingPath, 'utf8');
    
    // Baca settings.json untuk mengetahui field password yang ada
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    
    // Cari field password
    const passwordFields = Object.keys(settings).filter(key => 
        key.toLowerCase().includes('password')
    );
    
    console.log('🔐 Password Fields Found:');
    passwordFields.forEach(field => {
        console.log(`  - ${field}: ${settings[field] ? '***' : 'empty'}`);
    });
    
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
        
        console.log('\n📋 Password Fields Visibility:');
        passwordFields.forEach(field => {
            const isHidden = hiddenFields.includes(field);
            console.log(`  - ${field}: ${isHidden ? '❌ HIDDEN' : '✅ VISIBLE'}`);
        });
        
        // Cek apakah ada handling khusus untuk password
        const hasPasswordHandling = content.includes('key.includes(\'password\')') || 
                                   content.includes('key.includes(\'Password\')');
        console.log(`\n🔧 Password Handling:`);
        console.log(`  - Special password input handling: ${hasPasswordHandling ? '✅ FOUND' : '❌ MISSING'}`);
        
        // Cek input type="password"
        const hasPasswordInputType = content.includes('type="password"');
        console.log(`  - Input type="password": ${hasPasswordInputType ? '✅ FOUND' : '❌ MISSING'}`);
        
        // Cek warning message
        const hasPasswordWarning = content.includes('Hati-hati saat mengubah password');
        console.log(`  - Password warning message: ${hasPasswordWarning ? '✅ FOUND' : '❌ MISSING'}`);
        
        console.log(`\n🎯 Expected Display Format for Password Fields:`);
        console.log(`  Admin Password`);
        console.log(`  Password untuk login ke admin panel`);
        console.log(`  [password input] ***`);
        console.log(`  ⚠️ Hati-hati saat mengubah password. Pastikan password benar untuk menghindari error koneksi.`);
        
        console.log(`\n✅ Verification Summary:`);
        const visiblePasswordFields = passwordFields.filter(field => !hiddenFields.includes(field));
        if (visiblePasswordFields.length > 0 && hasPasswordHandling && hasPasswordInputType && hasPasswordWarning) {
            console.log(`  ✅ Password fields are visible and properly handled`);
            console.log(`  ✅ Input type="password" is used for security`);
            console.log(`  ✅ Warning message is displayed`);
            console.log(`  ✅ User can edit passwords safely from web interface`);
        } else {
            console.log(`  ⚠️ Some password handling components are missing`);
        }
        
    } else {
        console.log('❌ Could not find hiddenFields configuration');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
