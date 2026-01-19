/**
 * Verify Web Admin Settings Display
 * Memverifikasi bahwa web admin settings hanya menampilkan format jam untuk interval settings
 */

const fs = require('fs');
const path = require('path');

const adminSettingPath = path.join(__dirname, '../views/adminSetting.ejs');

console.log('🔍 Verifying Web Admin Settings Display...\n');

try {
    // Baca file adminSetting.ejs
    const content = fs.readFileSync(adminSettingPath, 'utf8');
    
    // Cek apakah field interval millisecond sudah disembunyikan
    const hiddenFieldsPattern = /const hiddenFields = \[([\s\S]*?)\];/;
    const hiddenFieldsMatch = content.match(hiddenFieldsPattern);
    
    if (hiddenFieldsMatch) {
        const hiddenFieldsContent = hiddenFieldsMatch[1];
        console.log('📋 Hidden Fields Configuration:');
        
        // Cek field interval millisecond
        const rxPowerWarningInterval = hiddenFieldsContent.includes('rx_power_warning_interval');
        const rxPowerRecapInterval = hiddenFieldsContent.includes('rxpower_recap_interval');
        const offlineNotifInterval = hiddenFieldsContent.includes('offline_notification_interval');
        
        console.log(`  - rx_power_warning_interval: ${rxPowerWarningInterval ? '✅ HIDDEN' : '❌ VISIBLE'}`);
        console.log(`  - rxpower_recap_interval: ${rxPowerRecapInterval ? '✅ HIDDEN' : '❌ VISIBLE'}`);
        console.log(`  - offline_notification_interval: ${offlineNotifInterval ? '✅ HIDDEN' : '❌ VISIBLE'}`);
        
        // Cek field interval hours
        const rxPowerWarningIntervalHours = hiddenFieldsContent.includes('rx_power_warning_interval_hours');
        const rxPowerRecapIntervalHours = hiddenFieldsContent.includes('rxpower_recap_interval_hours');
        const offlineNotifIntervalHours = hiddenFieldsContent.includes('offline_notification_interval_hours');
        
        console.log('\n📋 Visible Fields (Hours Format):');
        console.log(`  - rx_power_warning_interval_hours: ${!rxPowerWarningIntervalHours ? '✅ VISIBLE' : '❌ HIDDEN'}`);
        console.log(`  - rxpower_recap_interval_hours: ${!rxPowerRecapIntervalHours ? '✅ VISIBLE' : '❌ HIDDEN'}`);
        console.log(`  - offline_notification_interval_hours: ${!offlineNotifIntervalHours ? '✅ VISIBLE' : '❌ HIDDEN'}`);
        
        // Summary
        const allMillisecondHidden = rxPowerWarningInterval && rxPowerRecapInterval && offlineNotifInterval;
        const allHoursVisible = !rxPowerWarningIntervalHours && !rxPowerRecapIntervalHours && !offlineNotifIntervalHours;
        
        console.log('\n📊 Summary:');
        if (allMillisecondHidden && allHoursVisible) {
            console.log('  ✅ Perfect! All millisecond format fields are hidden');
            console.log('  ✅ All hours format fields are visible');
            console.log('  ✅ Web admin settings will show only hours format');
        } else {
            console.log('  ⚠️  Configuration needs adjustment:');
            if (!allMillisecondHidden) {
                console.log('     - Some millisecond format fields are still visible');
            }
            if (!allHoursVisible) {
                console.log('     - Some hours format fields are hidden');
            }
        }
        
    } else {
        console.log('❌ Could not find hiddenFields configuration');
    }
    
    // Cek label field
    console.log('\n🏷️  Field Labels:');
    const fieldLabelsPattern = /const fieldLabels = \{([\s\S]*?)\};/;
    const fieldLabelsMatch = content.match(fieldLabelsPattern);
    
    if (fieldLabelsMatch) {
        const fieldLabelsContent = fieldLabelsMatch[1];
        
        // Cek label untuk field hours
        const rxPowerWarningLabel = fieldLabelsContent.includes('rx_power_warning_interval_hours');
        const rxPowerRecapLabel = fieldLabelsContent.includes('rxpower_recap_interval_hours');
        const offlineNotifLabel = fieldLabelsContent.includes('offline_notification_interval_hours');
        
        console.log(`  - rx_power_warning_interval_hours label: ${rxPowerWarningLabel ? '✅ FOUND' : '❌ MISSING'}`);
        console.log(`  - rxpower_recap_interval_hours label: ${rxPowerRecapLabel ? '✅ FOUND' : '❌ MISSING'}`);
        console.log(`  - offline_notification_interval_hours label: ${offlineNotifLabel ? '✅ FOUND' : '❌ MISSING'}`);
        
        // Cek apakah label menggunakan bahasa Indonesia
        const indonesianLabels = fieldLabelsContent.includes('Interval Peringatan') || 
                                fieldLabelsContent.includes('Interval Ringkasan') || 
                                fieldLabelsContent.includes('Interval Notifikasi');
        
        console.log(`  - Indonesian labels: ${indonesianLabels ? '✅ FOUND' : '❌ MISSING'}`);
    }
    
    console.log('\n🎯 Expected Result:');
    console.log('  - User will see: "Interval Peringatan RX Power (Jam): 10"');
    console.log('  - User will see: "Interval Ringkasan RX Power (Jam): 6"');
    console.log('  - User will see: "Interval Notifikasi Offline (Jam): 12"');
    console.log('  - User will NOT see: "rxpower_recap_interval: 21600000"');
    console.log('  - User will NOT see: "offline_notification_interval: 43200000"');
    
} catch (error) {
    console.error('❌ Error reading adminSetting.ejs:', error.message);
}
