/**
 * Update Interval Settings
 * Easy way to update interval settings using hours format
 */

const fs = require('fs');
const path = require('path');

// Function to convert hours to milliseconds
function hoursToMs(hours) {
    return hours * 60 * 60 * 1000;
}

// Function to convert milliseconds to hours
function msToHours(ms) {
    return Math.round(ms / (1000 * 60 * 60));
}

// Read current settings
const settingsPath = path.join(__dirname, '../settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('📋 Current interval settings:');
    console.log(`  - RX Power Warning: ${msToHours(parseInt(settings.rx_power_warning_interval))} hours`);
    console.log(`  - RX Power Recap: ${msToHours(parseInt(settings.rxpower_recap_interval))} hours`);
    console.log(`  - Offline Notification: ${msToHours(parseInt(settings.offline_notification_interval))} hours`);
    
    console.log('\n💡 Usage examples:');
    console.log('  node scripts/update-intervals.js rx-power 6');
    console.log('  node scripts/update-intervals.js rx-recap 6');
    console.log('  node scripts/update-intervals.js offline 12');
    console.log('  node scripts/update-intervals.js all 6');
    console.log('\n📝 Available intervals:');
    console.log('  - rx-power: RX Power Warning Interval');
    console.log('  - rx-recap: RX Power Recap Interval');
    console.log('  - offline: Offline Notification Interval');
    console.log('  - all: Update all intervals to the same value');
    process.exit(0);
}

const intervalType = args[0];
const hours = parseInt(args[1]);

if (isNaN(hours) || hours <= 0) {
    console.error('❌ Error: Hours must be a positive number');
    process.exit(1);
}

const milliseconds = hoursToMs(hours);

// Backup current settings
const backupPath = path.join(__dirname, '../settings.json.backup');
fs.writeFileSync(backupPath, fs.readFileSync(settingsPath));

console.log('🔄 Updating interval settings...');

// Update settings based on type
switch (intervalType) {
    case 'rx-power':
        settings.rx_power_warning_interval = milliseconds.toString();
        console.log(`✅ RX Power Warning Interval updated to ${hours} hours (${milliseconds} ms)`);
        break;
        
    case 'rx-recap':
        settings.rxpower_recap_interval = milliseconds.toString();
        console.log(`✅ RX Power Recap Interval updated to ${hours} hours (${milliseconds} ms)`);
        break;
        
    case 'offline':
        settings.offline_notification_interval = milliseconds.toString();
        console.log(`✅ Offline Notification Interval updated to ${hours} hours (${milliseconds} ms)`);
        break;
        
    case 'all':
        settings.rx_power_warning_interval = milliseconds.toString();
        settings.rxpower_recap_interval = milliseconds.toString();
        settings.offline_notification_interval = milliseconds.toString();
        console.log(`✅ All intervals updated to ${hours} hours (${milliseconds} ms)`);
        break;
        
    default:
        console.error(`❌ Error: Unknown interval type '${intervalType}'`);
        console.log('📝 Available types: rx-power, rx-recap, offline, all');
        process.exit(1);
}

// Update hour-based settings
settings.rx_power_warning_interval_hours = msToHours(parseInt(settings.rx_power_warning_interval)).toString();
settings.rxpower_recap_interval_hours = msToHours(parseInt(settings.rxpower_recap_interval)).toString();
settings.offline_notification_interval_hours = msToHours(parseInt(settings.offline_notification_interval)).toString();

// Write updated settings
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

console.log('💾 Settings saved successfully!');
console.log('🔄 Restart the application to apply changes.');

console.log('\n📋 Updated interval settings:');
console.log(`  - RX Power Warning: ${msToHours(parseInt(settings.rx_power_warning_interval))} hours`);
console.log(`  - RX Power Recap: ${msToHours(parseInt(settings.rxpower_recap_interval))} hours`);
console.log(`  - Offline Notification: ${msToHours(parseInt(settings.offline_notification_interval))} hours`);
