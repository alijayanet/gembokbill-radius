/**
 * Improve Interval Settings Format
 * Add hour-based settings alongside millisecond settings for better readability
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Improving interval settings format...');

// Read current settings.json
const settingsPath = path.join(__dirname, '../settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

// Function to convert milliseconds to hours
function msToHours(ms) {
    return Math.round(ms / (1000 * 60 * 60));
}

// Function to convert hours to milliseconds
function hoursToMs(hours) {
    return hours * 60 * 60 * 1000;
}

// Current interval settings
const currentIntervals = {
    'rx_power_warning_interval': parseInt(settings.rx_power_warning_interval),
    'rxpower_recap_interval': parseInt(settings.rxpower_recap_interval),
    'offline_notification_interval': parseInt(settings.offline_notification_interval)
};

console.log('📊 Current interval settings:');
Object.entries(currentIntervals).forEach(([key, ms]) => {
    const hours = msToHours(ms);
    console.log(`  - ${key}: ${hours} hours (${ms} ms)`);
});

// Add hour-based settings for better readability
const newSettings = { ...settings };

// Add hour-based equivalents
newSettings.rx_power_warning_interval_hours = msToHours(currentIntervals.rx_power_warning_interval).toString();
newSettings.rxpower_recap_interval_hours = msToHours(currentIntervals.rxpower_recap_interval).toString();
newSettings.offline_notification_interval_hours = msToHours(currentIntervals.offline_notification_interval).toString();

// Add helpful comments
newSettings._interval_settings_info = {
    "note": "Interval settings are available in both milliseconds and hours format",
    "milliseconds_format": "Used by the application for precise timing",
    "hours_format": "Added for easier configuration and understanding",
    "conversion": "1 hour = 3,600,000 milliseconds"
};

// Add suggested values
newSettings._suggested_interval_hours = {
    "rx_power_warning_interval": "6 hours (current: " + msToHours(currentIntervals.rx_power_warning_interval) + " hours)",
    "rxpower_recap_interval": "6 hours (current: " + msToHours(currentIntervals.rxpower_recap_interval) + " hours)",
    "offline_notification_interval": "12 hours (current: " + msToHours(currentIntervals.offline_notification_interval) + " hours)"
};

// Backup original settings
const backupPath = path.join(__dirname, '../settings.json.backup');
if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, fs.readFileSync(settingsPath));
    console.log('💾 Original settings backed up to:', backupPath);
}

// Write improved settings
fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));

console.log('✅ Settings improved successfully!');
console.log('\n📋 Added hour-based settings:');
console.log(`  - rx_power_warning_interval_hours: ${newSettings.rx_power_warning_interval_hours} hours`);
console.log(`  - rxpower_recap_interval_hours: ${newSettings.rxpower_recap_interval_hours} hours`);
console.log(`  - offline_notification_interval_hours: ${newSettings.offline_notification_interval_hours} hours`);

console.log('\n💡 You can now easily see the interval values in hours format!');
console.log('📝 To change intervals, update the millisecond values using the hour equivalents:');
console.log('   - 1 hour = 3,600,000 ms');
console.log('   - 6 hours = 21,600,000 ms');
console.log('   - 12 hours = 43,200,000 ms');
console.log('   - 24 hours = 86,400,000 ms');
