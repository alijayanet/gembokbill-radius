const fs = require('fs');
const path = require('path');

function testTunnelingSupport() {
    console.log('🌐 Testing Tunneling Support in Isolir Script Generator...\n');
    
    try {
        const adminSettingPath = path.join(__dirname, '../views/adminSetting.ejs');
        const content = fs.readFileSync(adminSettingPath, 'utf8');
        
        console.log('📋 Checking Tunneling Support Features:');
        
        const tunnelingFeatures = [
            {
                name: 'Path Input Field',
                patterns: [
                    /id="isolirPath"/,
                    /Path Halaman Isolir/,
                    /placeholder="\/isolir"/
                ],
                description: 'Input field for isolir path'
            },
            {
                name: 'Access Type Selector',
                patterns: [
                    /id="accessType"/,
                    /Jenis Akses/,
                    /Tunneling.*Domain.*Path/,
                    /Port Langsung/
                ],
                description: 'Selector for access type (tunneling vs port)'
            },
            {
                name: 'Port Field Update',
                patterns: [
                    /Port Halaman Isolir.*Opsional/,
                    /Kosongkan jika menggunakan tunneling/
                ],
                description: 'Port field made optional for tunneling'
            },
            {
                name: 'JavaScript Tunneling Logic',
                patterns: [
                    /accessType.*===.*tunneling/,
                    /isolirDomain.*isolirPath/,
                    /to-ports=80.*tunneling/,
                    /to-ports=443.*tunneling/
                ],
                description: 'JavaScript logic for tunneling support'
            },
            {
                name: 'URL Generation',
                patterns: [
                    /isolirUrl.*accessType/,
                    /URL Halaman Isolir/
                ],
                description: 'Dynamic URL generation based on access type'
            },
            {
                name: 'Firewall Rules for Tunneling',
                patterns: [
                    /to-ports=80.*tunneling/,
                    /to-ports=443.*tunneling/,
                    /comment.*tunneling/
                ],
                description: 'Firewall rules specifically for tunneling'
            },
            {
                name: 'Auto-Generate Update',
                patterns: [
                    /isolirPath/,
                    /accessTypeSelect/,
                    /addEventListener.*change/
                ],
                description: 'Auto-generate updated for new fields'
            },
            {
                name: 'User Interface Updates',
                patterns: [
                    /Contoh Tunneling/,
                    /alijaya\.gentiwifi\.online/,
                    /domain\.com:3000/
                ],
                description: 'UI updates with tunneling examples'
            }
        ];
        
        let totalChecks = 0;
        let passedChecks = 0;
        
        tunnelingFeatures.forEach(feature => {
            console.log(`\n🔍 ${feature.name}:`);
            console.log(`   Description: ${feature.description}`);
            
            let featurePassed = 0;
            feature.patterns.forEach(pattern => {
                totalChecks++;
                if (pattern.test(content)) {
                    console.log(`   ✅ Found: ${pattern.source}`);
                    featurePassed++;
                    passedChecks++;
                } else {
                    console.log(`   ❌ Missing: ${pattern.source}`);
                }
            });
            
            if (featurePassed === feature.patterns.length) {
                console.log(`   🎯 Status: PASSED (${featurePassed}/${feature.patterns.length})`);
            } else {
                console.log(`   ⚠️  Status: PARTIAL (${featurePassed}/${feature.patterns.length})`);
            }
        });
        
        // Check for specific tunneling scenarios
        console.log('\n🌐 Checking Tunneling Scenarios:');
        
        const tunnelingScenarios = [
            {
                name: 'Domain + Path URL',
                pattern: /isolirDomain \+ isolirPath/,
                description: 'URL construction for tunneling'
            },
            {
                name: 'Port + Path URL',
                pattern: /isolirDomain \+ ':' \+ isolirPort \+ isolirPath/,
                description: 'URL construction for direct port access'
            },
            {
                name: 'Tunneling Firewall Rules',
                pattern: /to-ports=80.*tunneling/,
                description: 'HTTP redirect for tunneling'
            },
            {
                name: 'Tunneling HTTPS Rules',
                pattern: /to-ports=443.*tunneling/,
                description: 'HTTPS redirect for tunneling'
            },
            {
                name: 'Port Validation',
                pattern: /accessType.*===.*port.*isolirPort/,
                description: 'Port validation for direct access'
            }
        ];
        
        tunnelingScenarios.forEach(scenario => {
            totalChecks++;
            if (scenario.pattern.test(content)) {
                console.log(`   ✅ ${scenario.name}: ${scenario.description}`);
                passedChecks++;
            } else {
                console.log(`   ❌ ${scenario.name}: ${scenario.description}`);
            }
        });
        
        // Check for example configurations
        console.log('\n📝 Checking Example Configurations:');
        
        const examples = [
            'alijaya.gentiwifi.online',
            '/isolir',
            'Tunneling (Domain + Path)',
            'Port Langsung'
        ];
        
        examples.forEach(example => {
            totalChecks++;
            if (content.includes(example)) {
                console.log(`   ✅ Found example: ${example}`);
                passedChecks++;
            } else {
                console.log(`   ❌ Missing example: ${example}`);
            }
        });
        
        // Overall assessment
        const successRate = (passedChecks / totalChecks) * 100;
        
        console.log('\n📊 Test Results:');
        console.log(`   Total Checks: ${totalChecks}`);
        console.log(`   Passed: ${passedChecks}`);
        console.log(`   Failed: ${totalChecks - passedChecks}`);
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        
        if (successRate >= 90) {
            console.log('\n🎉 EXCELLENT: Tunneling support is fully implemented!');
        } else if (successRate >= 80) {
            console.log('\n✅ GOOD: Tunneling support is mostly implemented!');
        } else if (successRate >= 70) {
            console.log('\n⚠️  FAIR: Tunneling support needs some improvements!');
        } else {
            console.log('\n❌ POOR: Tunneling support needs significant work!');
        }
        
        // Show example configurations
        console.log('\n🌐 Example Configurations:');
        console.log('   📡 Tunneling: alijaya.gentiwifi.online/isolir');
        console.log('   🔌 Port Direct: domain.com:3000/isolir');
        console.log('   🔧 Mikrotik Rules: Redirect to port 80/443 for tunneling');
        console.log('   🔧 Mikrotik Rules: Redirect to custom port for direct access');
        
        return successRate >= 80;
        
    } catch (error) {
        console.error('❌ Error testing tunneling support:', error.message);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    const success = testTunnelingSupport();
    process.exit(success ? 0 : 1);
}

module.exports = testTunnelingSupport;
