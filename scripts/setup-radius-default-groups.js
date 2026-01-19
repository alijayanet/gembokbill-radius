const radius = require('../config/radius');

async function setupRadiusDefaultGroups() {
    try {
        console.log('🔧 Setting up default RADIUS groups...');

        // 1. Create default group
        console.log('📝 Creating default group...');
        await radius.addRadiusGroup('default', {
            'Auth-Type': 'Accept',
            'Service-Type': 'Framed-User',
            'Framed-Protocol': 'PPP'
        });
        console.log('✅ Default group created');

        // 2. Create isolir group
        console.log('📝 Creating isolir group...');
        await radius.addRadiusGroup('isolir', {
            'Auth-Type': 'Accept',
            'Service-Type': 'Framed-User',
            'Framed-Protocol': 'PPP',
            'Mikrotik-Rate-Limit': '1k/1k',
            'Framed-Pool': 'isolir-pool'
        });
        console.log('✅ Isolir group created');

        // 3. Create basic group
        console.log('📝 Creating basic group...');
        await radius.addRadiusGroup('basic', {
            'Auth-Type': 'Accept',
            'Service-Type': 'Framed-User',
            'Framed-Protocol': 'PPP',
            'Mikrotik-Rate-Limit': '5M/5M'
        });
        console.log('✅ Basic group created');

        // 4. Create standard group
        console.log('📝 Creating standard group...');
        await radius.addRadiusGroup('standard', {
            'Auth-Type': 'Accept',
            'Service-Type': 'Framed-User',
            'Framed-Protocol': 'PPP',
            'Mikrotik-Rate-Limit': '20M/20M'
        });
        console.log('✅ Standard group created');

        // 5. Create premium group
        console.log('📝 Creating premium group...');
        await radius.addRadiusGroup('premium', {
            'Auth-Type': 'Accept',
            'Service-Type': 'Framed-User',
            'Framed-Protocol': 'PPP',
            'Mikrotik-Rate-Limit': '50M/50M'
        });
        console.log('✅ Premium group created');

        // 6. Create enterprise group
        console.log('📝 Creating enterprise group...');
        await radius.addRadiusGroup('enterprise', {
            'Auth-Type': 'Accept',
            'Service-Type': 'Framed-User',
            'Framed-Protocol': 'PPP',
            'Mikrotik-Rate-Limit': '100M/100M'
        });
        console.log('✅ Enterprise group created');

        console.log('\n✅ All default RADIUS groups created successfully!');
        console.log('\n📋 Available groups:');
        console.log('   - default');
        console.log('   - isolir (1k/1k)');
        console.log('   - basic (5M/5M)');
        console.log('   - standard (20M/20M)');
        console.log('   - premium (50M/50M)');
        console.log('   - enterprise (100M/100M)');

        return { success: true };
    } catch (error) {
        console.error('❌ Error setting up default RADIUS groups:', error);
        throw error;
    }
}

// Jika dijalankan langsung
if (require.main === module) {
    setupRadiusDefaultGroups()
        .then(() => {
            console.log('\n✅ Setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupRadiusDefaultGroups };
