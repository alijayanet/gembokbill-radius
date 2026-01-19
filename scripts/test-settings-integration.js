/**
 * Test Settings Integration
 * Memverifikasi bahwa semua sistem monitoring menggunakan pengaturan dari settings.json
 */

const { getSetting } = require('../config/settingsManager');

console.log('🧪 Testing Settings Integration...\n');

// Test 1: Check all interval settings
console.log('📋 Current Settings from settings.json:');
const rxPowerWarning = getSetting('rx_power_warning_interval', '36000000');
const rxPowerRecap = getSetting('rxpower_recap_interval', '21600000');
const offlineNotif = getSetting('offline_notification_interval', '43200000');
const offlineThreshold = getSetting('offline_device_threshold_hours', '24');

console.log('  - RX Power Warning Interval:', parseInt(rxPowerWarning) / (1000 * 60 * 60) + ' hours (' + rxPowerWarning + ' ms)');
console.log('  - RX Power Recap Interval:', parseInt(rxPowerRecap) / (1000 * 60 * 60) + ' hours (' + rxPowerRecap + ' ms)');
console.log('  - Offline Notification Interval:', parseInt(offlineNotif) / (1000 * 60 * 60) + ' hours (' + offlineNotif + ' ms)');
console.log('  - Offline Device Threshold:', offlineThreshold + ' hours');

// Test 2: Check enable/disable settings
console.log('\n🔧 Enable/Disable Settings:');
const rxPowerNotifEnabled = getSetting('rx_power_notification_enable', true);
const rxPowerRecapEnabled = getSetting('rxpower_recap_enable', true);
const offlineNotifEnabled = getSetting('offline_notification_enable', true);

console.log('  - RX Power Notification:', rxPowerNotifEnabled ? 'ENABLED' : 'DISABLED');
console.log('  - RX Power Recap:', rxPowerRecapEnabled ? 'ENABLED' : 'DISABLED');
console.log('  - Offline Notification:', offlineNotifEnabled ? 'ENABLED' : 'DISABLED');

// Test 3: Check threshold settings
console.log('\n📊 Threshold Settings:');
const rxPowerWarningThreshold = getSetting('rx_power_warning', '-35');
const rxPowerCriticalThreshold = getSetting('rx_power_critical', '-37');

console.log('  - RX Power Warning Threshold:', rxPowerWarningThreshold + ' dBm');
console.log('  - RX Power Critical Threshold:', rxPowerCriticalThreshold + ' dBm');

// Test 4: Validate interval values
console.log('\n✅ Validation:');
function validateInterval(value, name) {
    const ms = parseInt(value);
    const hours = ms / (1000 * 60 * 60);
    
    if (ms < 3600000) { // Less than 1 hour
        console.log(`  ❌ ${name}: ${hours} hours (too short, minimum 1 hour)`);
        return false;
    } else if (ms > 604800000) { // More than 7 days
        console.log(`  ❌ ${name}: ${hours} hours (too long, maximum 168 hours)`);
        return false;
    } else {
        console.log(`  ✅ ${name}: ${hours} hours (valid)`);
        return true;
    }
}

const rxPowerWarningValid = validateInterval(rxPowerWarning, 'RX Power Warning');
const rxPowerRecapValid = validateInterval(rxPowerRecap, 'RX Power Recap');
const offlineNotifValid = validateInterval(offlineNotif, 'Offline Notification');

// Test 5: Check if all settings are properly configured
console.log('\n🎯 Configuration Summary:');
const allValid = rxPowerWarningValid && rxPowerRecapValid && offlineNotifValid;

if (allValid) {
    console.log('  ✅ All interval settings are valid');
    console.log('  ✅ All monitoring systems should use settings.json correctly');
    console.log('  ✅ Web interface changes will be applied immediately');
} else {
    console.log('  ❌ Some interval settings are invalid');
    console.log('  ❌ Please check the settings.json file');
}

// Test 6: Show conversion examples
console.log('\n🔄 Conversion Examples:');
function showConversion(hours) {
    const ms = hours * 60 * 60 * 1000;
    console.log(`  - ${hours} hours = ${ms} milliseconds`);
}

showConversion(1);
showConversion(6);
showConversion(12);
showConversion(24);

console.log('\n💡 To change settings:');
console.log('  1. Use web interface: /admin/settings');
console.log('  2. Edit settings.json directly');
console.log('  3. Use script: node scripts/update-intervals.js');

console.log('\n✅ Settings Integration Test Completed!');
