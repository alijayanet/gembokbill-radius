const fs = require('fs');
const path = require('path');

console.log('=== Final Hotspot Page Verification ===\n');

// Function to check for duplicate card sections in adminHotspot.ejs
function checkForDuplicateCards() {
    console.log('1. Checking for duplicate card sections...');
    
    const templatePath = path.join(__dirname, '..', 'views', 'adminHotspot.ejs');
    if (!fs.existsSync(templatePath)) {
        console.log('   ✗ Template file not found');
        return false;
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Check for duplicate package sections
    const packageIds = ['3k', '5k', '10k', '15k', '25k', '50k'];
    let allPackagesOk = true;
    
    packageIds.forEach(packageId => {
        const pattern = new RegExp(`<!-- Paket ${packageId} -->`, 'g');
        const matches = templateContent.match(pattern);
        const count = matches ? matches.length : 0;
        
        if (count === 1) {
            console.log(`   ✓ Paket ${packageId}: ${count} section found`);
        } else {
            console.log(`   ✗ Paket ${packageId}: ${count} sections found (should be 1)`);
            allPackagesOk = false;
        }
    });
    
    return allPackagesOk;
}

// Function to check for correct profile IDs in card sections
function checkProfileIds() {
    console.log('\n2. Checking profile IDs in card sections...');
    
    const templatePath = path.join(__dirname, '..', 'views', 'adminHotspot.ejs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Check each package has correct profile IDs
    const packageChecks = [
        { id: '3k', profileSelectId: 'profile_3k', priceId: 'price_3k', digitsId: 'digits_3k' },
        { id: '5k', profileSelectId: 'profile_5k', priceId: 'price_5k', digitsId: 'digits_5k' },
        { id: '10k', profileSelectId: 'profile_10k', priceId: 'price_10k', digitsId: 'digits_10k' },
        { id: '15k', profileSelectId: 'profile_15k', priceId: 'price_15k', digitsId: 'digits_15k' },
        { id: '25k', profileSelectId: 'profile_25k', priceId: 'price_25k', digitsId: 'digits_25k' },
        { id: '50k', profileSelectId: 'profile_50k', priceId: 'price_50k', digitsId: 'digits_50k' }
    ];
    
    let allIdsOk = true;
    
    packageChecks.forEach(check => {
        // Check if profile select ID is correct
        const profileSelectPattern = new RegExp(`id="${check.profileSelectId}"`);
        const priceIdPattern = new RegExp(`id="${check.priceId}"`);
        const digitsIdPattern = new RegExp(`id="${check.digitsId}"`);
        
        const hasProfileSelect = profileSelectPattern.test(templateContent);
        const hasPriceId = priceIdPattern.test(templateContent);
        const hasDigitsId = digitsIdPattern.test(templateContent);
        
        if (hasProfileSelect && hasPriceId && hasDigitsId) {
            console.log(`   ✓ Paket ${check.id}: All element IDs are correct`);
        } else {
            console.log(`   ✗ Paket ${check.id}: Element IDs incorrect`);
            if (!hasProfileSelect) console.log(`     - Missing or incorrect profile select ID: ${check.profileSelectId}`);
            if (!hasPriceId) console.log(`     - Missing or incorrect price ID: ${check.priceId}`);
            if (!hasDigitsId) console.log(`     - Missing or incorrect digits ID: ${check.digitsId}`);
            allIdsOk = false;
        }
    });
    
    return allIdsOk;
}

// Function to check for mixed content issues
function checkForMixedContent() {
    console.log('\n3. Checking for mixed content issues...');
    
    const templatePath = path.join(__dirname, '..', 'views', 'adminHotspot.ejs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Look for obvious mixed content patterns by checking each package section individually
    let hasMixedContent = false;
    
    // Extract each package section and verify it only contains its own references
    const packageSections = {
        '3k': { 
            start: '<!-- Paket 3k -->',
            end: '<!-- Paket 5k -->',
            allowedRefs: ['profile_3k', 'price_3k', 'digits_3k', 'name_3k', 'online_3k']
        },
        '5k': { 
            start: '<!-- Paket 5k -->',
            end: '<!-- Paket 10k -->',
            allowedRefs: ['profile_5k', 'price_5k', 'digits_5k', 'name_5k', 'online_5k']
        },
        '10k': { 
            start: '<!-- Paket 10k -->',
            end: '<!-- Paket 15k -->',
            allowedRefs: ['profile_10k', 'price_10k', 'digits_10k', 'name_10k', 'online_10k']
        },
        '15k': { 
            start: '<!-- Paket 15k -->',
            end: '<!-- Paket 25k -->',
            allowedRefs: ['profile_15k', 'price_15k', 'digits_15k', 'name_15k', 'online_15k']
        },
        '25k': { 
            start: '<!-- Paket 25k -->',
            end: '<!-- Paket 50k -->',
            allowedRefs: ['profile_25k', 'price_25k', 'digits_25k', 'name_25k', 'online_25k']
        },
        '50k': { 
            start: '<!-- Paket 50k -->',
            end: '\n                    </div>',
            allowedRefs: ['profile_50k', 'price_50k', 'digits_50k', 'name_50k', 'online_50k']
        }
    };
    
    Object.keys(packageSections).forEach(packageId => {
        const sectionInfo = packageSections[packageId];
        const startIndex = templateContent.indexOf(sectionInfo.start);
        const endIndex = templateContent.indexOf(sectionInfo.end, startIndex);
        
        if (startIndex !== -1 && endIndex !== -1) {
            const sectionContent = templateContent.substring(startIndex, endIndex + sectionInfo.end.length);
            
            // Check for disallowed references
            const disallowedRefs = [];
            Object.keys(packageSections).forEach(otherPackageId => {
                if (otherPackageId !== packageId) {
                    sectionInfo.allowedRefs.forEach(allowedRef => {
                        // Create pattern for other package references
                        const otherRefs = packageSections[otherPackageId].allowedRefs;
                        otherRefs.forEach(otherRef => {
                            if (sectionContent.includes(otherRef) && !sectionInfo.allowedRefs.includes(otherRef)) {
                                disallowedRefs.push(otherRef);
                            }
                        });
                    });
                }
            });
            
            if (disallowedRefs.length > 0) {
                console.log(`   ✗ Paket ${packageId}: Found disallowed references: ${disallowedRefs.join(', ')}`);
                hasMixedContent = true;
            } else {
                console.log(`   ✓ Paket ${packageId}: No mixed content found`);
            }
        } else {
            console.log(`   ⚠ Paket ${packageId}: Could not extract section for checking`);
        }
    });
    
    // Additional check for obvious mixed content patterns
    const obviousPatterns = [
        { pattern: /profile_10k.*profile_3k/, description: '10k profile in 3k section' },
        { pattern: /profile_15k.*profile_3k/, description: '15k profile in 3k section' },
        { pattern: /profile_25k.*profile_3k/, description: '25k profile in 3k section' }
    ];
    
    obviousPatterns.forEach(patternInfo => {
        if (patternInfo.pattern.test(templateContent)) {
            console.log(`   ✗ Obvious mixed content: ${patternInfo.description}`);
            hasMixedContent = true;
        }
    });
    
    if (!hasMixedContent) {
        console.log('   ✓ No mixed content issues found');
    }
    
    return !hasMixedContent;
}

// Function to check card structure consistency
function checkCardStructure() {
    console.log('\n4. Checking card structure consistency...');
    
    const templatePath = path.join(__dirname, '..', 'views', 'adminHotspot.ejs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Check if all packages have the same card structure
    const packageIds = ['3k', '5k', '10k', '15k', '25k', '50k'];
    let structureOk = true;
    
    // Basic structure elements that should be present in each card
    const structureElements = [
        'class="card border',
        'class="card-header',
        'class="card-body',
        'Nama Paket:',
        'Profile Mikrotik:',
        'Harga:',
        'Digit Voucher:',
        'Tampilkan Online'
    ];
    
    packageIds.forEach(packageId => {
        // Extract the section for this package
        const sectionPattern = new RegExp(`<!-- Paket ${packageId} -->[\\s\\S]*?<!-- Paket (?!${packageId})|<!-- Paket ${packageId} -->[\\s\\S]*?<\\/div>[\\s]*<\\/div>[\\s]*<\\/div>`, 'g');
        const match = sectionPattern.exec(templateContent);
        
        if (match) {
            const section = match[0];
            let sectionOk = true;
            
            structureElements.forEach(element => {
                if (section.indexOf(element) === -1) {
                    console.log(`   ✗ Paket ${packageId}: Missing element "${element}"`);
                    sectionOk = false;
                    structureOk = false;
                }
            });
            
            if (sectionOk) {
                console.log(`   ✓ Paket ${packageId}: Structure is consistent`);
            }
        } else {
            console.log(`   ✗ Paket ${packageId}: Could not find section`);
            structureOk = false;
        }
    });
    
    return structureOk;
}

// Main verification function
async function runFinalVerification() {
    try {
        const duplicateCheck = checkForDuplicateCards();
        const profileCheck = checkProfileIds();
        const mixedContentCheck = checkForMixedContent();
        const structureCheck = checkCardStructure();
        
        console.log('\n=== Verification Summary ===');
        console.log(`Duplicate Sections: ${duplicateCheck ? '✓' : '✗'}`);
        console.log(`Profile IDs: ${profileCheck ? '✓' : '✗'}`);
        console.log(`Mixed Content: ${mixedContentCheck ? '✓' : '✗'}`);
        console.log(`Card Structure: ${structureCheck ? '✓' : '✗'}`);
        
        const allChecksPassed = duplicateCheck && profileCheck && mixedContentCheck && structureCheck;
        
        if (allChecksPassed) {
            console.log('\n🎉 ALL CHECKS PASSED');
            console.log('The admin hotspot page should now display correctly with no duplicate or mixed content issues.');
        } else {
            console.log('\n❌ SOME CHECKS FAILED');
            console.log('Please review the issues above and fix them before using the application.');
        }
        
    } catch (error) {
        console.error('Error during verification:', error.message);
    }
}

// Run the verification
runFinalVerification();