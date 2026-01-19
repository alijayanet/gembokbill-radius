/**
 * Test Interval System
 * Test script untuk memverifikasi sistem interval management
 */

const intervalManager = require('../config/intervalManager');
const { getSetting } = require('../config/settingsManager');

console.log('🧪 Testing Interval System...\n');

// Test 1: Get current settings
console.log('📋 Current Interval Settings:');
const settings = intervalManager.getCurrentSettings();
console.log('  - RX Power Warning:', settings.rxPowerWarning.intervalHours + ' hours (' + settings.rxPowerWarning.enabled + ')');
console.log('  - RX Power Recap:', settings.rxPowerRecap.intervalHours + ' hours (' + settings.rxPowerRecap.enabled + ')');
console.log('  - Offline Notification:', settings.offlineNotification.intervalHours + ' hours (' + settings.offlineNotification.enabled + ')');

// Test 2: Get status
console.log('\n📊 Interval Manager Status:');
const status = intervalManager.getStatus();
console.log('  - Initialized:', status.isInitialized);
console.log('  - RX Power Warning:', status.intervals.rxPowerWarning ? 'Running' : 'Stopped');
console.log('  - RX Power Recap:', status.intervals.rxPowerRecap ? 'Running' : 'Stopped');
console.log('  - Offline Notification:', status.intervals.offlineNotification ? 'Running' : 'Stopped');

// Test 3: Initialize if not running
if (!status.isInitialized) {
    console.log('\n🚀 Initializing Interval Manager...');
    intervalManager.initialize();
    
    // Check status again
    const newStatus = intervalManager.getStatus();
    console.log('✅ After initialization:');
    console.log('  - Initialized:', newStatus.isInitialized);
    console.log('  - RX Power Warning:', newStatus.intervals.rxPowerWarning ? 'Running' : 'Stopped');
    console.log('  - RX Power Recap:', newStatus.intervals.rxPowerRecap ? 'Running' : 'Stopped');
    console.log('  - Offline Notification:', newStatus.intervals.offlineNotification ? 'Running' : 'Stopped');
}

// Test 4: Settings validation
console.log('\n🔍 Settings Validation:');
const rxPowerWarningMs = getSetting('rx_power_warning_interval', '36000000');
const rxPowerRecapMs = getSetting('rxpower_recap_interval', '21600000');
const offlineNotifMs = getSetting('offline_notification_interval', '43200000');

console.log('  - RX Power Warning:', parseInt(rxPowerWarningMs) / (1000 * 60 * 60) + ' hours (' + rxPowerWarningMs + ' ms)');
console.log('  - RX Power Recap:', parseInt(rxPowerRecapMs) / (1000 * 60 * 60) + ' hours (' + rxPowerRecapMs + ' ms)');
console.log('  - Offline Notification:', parseInt(offlineNotifMs) / (1000 * 60 * 60) + ' hours (' + offlineNotifMs + ' ms)');

// Test 5: Conversion functions
console.log('\n🔄 Conversion Test:');
function hoursToMs(hours) {
    return hours * 60 * 60 * 1000;
}

function msToHours(ms) {
    return Math.round(ms / (1000 * 60 * 60));
}

console.log('  - 1 hour =', hoursToMs(1) + ' ms');
console.log('  - 6 hours =', hoursToMs(6) + ' ms');
console.log('  - 12 hours =', hoursToMs(12) + ' ms');
console.log('  - 24 hours =', hoursToMs(24) + ' ms');

console.log('  - 3600000 ms =', msToHours(3600000) + ' hours');
console.log('  - 21600000 ms =', msToHours(21600000) + ' hours');
console.log('  - 43200000 ms =', msToHours(43200000) + ' hours');

console.log('\n✅ Interval System Test Completed!');
console.log('💡 You can now change interval settings via the web interface at /admin/settings');
console.log('💡 Changes will be applied immediately without restarting the application');

// Keep the process alive for a few seconds to see the intervals running
setTimeout(() => {
    console.log('\n🛑 Test completed. Interval Manager is running in the background.');
    console.log('💡 To stop intervals, use: intervalManager.stopAll()');
}, 3000);
