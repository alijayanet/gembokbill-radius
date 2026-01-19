const radius = require('../config/radius');
const { getSettingsWithCache } = require('../config/settingsManager');

async function setupRadiusIsolirGroup() {
    try {
        console.log('🔧 Setting up RADIUS isolir group...');

        const settings = getSettingsWithCache();
        const isolirGroup = settings.isolir_radius_group || 'isolir';
        const bandwidthLimit = settings.suspension_bandwidth_limit || '1k/1k';

        console.log(`📝 Creating RADIUS group: ${isolirGroup}`);
        console.log(`📝 Bandwidth limit: ${bandwidthLimit}`);

        // Create isolir group dengan attributes
        const result = await radius.addRadiusGroup(isolirGroup, {
            'Auth-Type': 'Accept',
            'Service-Type': 'Framed-User',
            'Framed-Protocol': 'PPP',
            'Mikrotik-Rate-Limit': bandwidthLimit,
            'Framed-Pool': 'isolir-pool'
        });

        if (result.success) {
            console.log('✅ RADIUS isolir group created successfully!');
            console.log(`📋 Group name: ${isolirGroup}`);
            console.log(`📋 Bandwidth limit: ${bandwidthLimit}`);
            console.log(`📋 Attributes:`);
            console.log(`   - Auth-Type: Accept`);
            console.log(`   - Service-Type: Framed-User`);
            console.log(`   - Framed-Protocol: PPP`);
            console.log(`   - Mikrotik-Rate-Limit: ${bandwidthLimit}`);
            console.log(`   - Framed-Pool: isolir-pool`);
        } else {
            console.error('❌ Failed to create RADIUS isolir group:', result.message);
        }

        return result;
    } catch (error) {
        console.error('❌ Error setting up RADIUS isolir group:', error);
        throw error;
    }
}

// Jika dijalankan langsung
if (require.main === module) {
    setupRadiusIsolirGroup()
        .then(() => {
            console.log('✅ Setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupRadiusIsolirGroup };
