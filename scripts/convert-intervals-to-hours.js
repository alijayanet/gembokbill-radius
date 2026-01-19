/**
 * Convert Interval Settings from Milliseconds to Hours
 * Convert interval settings in settings.json to be more readable
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Converting interval settings from milliseconds to hours...');

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

// Current interval settings that need conversion
const intervalSettings = {
    'rx_power_warning_interval': {
        current: settings.rx_power_warning_interval,
        description: 'RX Power Warning Interval',
        currentHours: msToHours(parseInt(settings.rx_power_warning_interval))
    },
    'rxpower_recap_interval': {
        current: settings.rxpower_recap_interval,
        description: 'RX Power Recap Interval',
        currentHours: msToHours(parseInt(settings.rxpower_recap_interval))
    },
    'offline_notification_interval': {
        current: settings.offline_notification_interval,
        description: 'Offline Notification Interval',
        currentHours: msToHours(parseInt(settings.offline_notification_interval))
    }
};

console.log('📊 Current interval settings:');
Object.entries(intervalSettings).forEach(([key, value]) => {
    console.log(`  - ${value.description}: ${value.currentHours} hours (${value.current} ms)`);
});

// Suggest new values in hours
const suggestedHours = {
    'rx_power_warning_interval': 6,    // 6 hours
    'rxpower_recap_interval': 6,       // 6 hours  
    'offline_notification_interval': 12 // 12 hours
};

console.log('\n💡 Suggested new values in hours:');
Object.entries(suggestedHours).forEach(([key, hours]) => {
    const ms = hoursToMs(hours);
    console.log(`  - ${intervalSettings[key].description}: ${hours} hours (${ms} ms)`);
});

// Create new settings with hour-based values
const newSettings = { ...settings };

// Convert to hours format
Object.entries(suggestedHours).forEach(([key, hours]) => {
    newSettings[key] = hoursToMs(hours).toString();
});

// Add comments for better understanding
newSettings._interval_comments = {
    rx_power_warning_interval: "RX Power Warning Interval in milliseconds (6 hours = 21600000 ms)",
    rxpower_recap_interval: "RX Power Recap Interval in milliseconds (6 hours = 21600000 ms)", 
    offline_notification_interval: "Offline Notification Interval in milliseconds (12 hours = 43200000 ms)"
};

// Backup original settings
const backupPath = path.join(__dirname, '../settings.json.backup');
fs.writeFileSync(backupPath, fs.readFileSync(settingsPath));

console.log('\n💾 Original settings backed up to:', backupPath);

// Write new settings
fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));

console.log('✅ Settings updated successfully!');
console.log('\n📋 New interval settings:');
Object.entries(suggestedHours).forEach(([key, hours]) => {
    const ms = hoursToMs(hours);
    console.log(`  - ${intervalSettings[key].description}: ${hours} hours (${ms} ms)`);
});

console.log('\n🔄 Restart the application to apply new settings.');
