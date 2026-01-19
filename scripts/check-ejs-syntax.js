/**
 * Script untuk memeriksa syntax JavaScript dalam file EJS
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking EJS syntax...\n');

function checkEJSSyntax(filePath) {
    try {
        console.log(`📄 Checking file: ${filePath}`);
        
        // Baca file EJS
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract JavaScript code dari script tags
        const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        
        if (!scriptMatches) {
            console.log('⚠️ No script tags found');
            return true;
        }
        
        console.log(`📋 Found ${scriptMatches.length} script blocks`);
        
        let hasErrors = false;
        
        scriptMatches.forEach((scriptBlock, index) => {
            console.log(`\n🔍 Checking script block ${index + 1}...`);
            
            // Extract JavaScript content
            const jsContent = scriptBlock.replace(/<\/?script[^>]*>/gi, '').trim();
            
            if (!jsContent) {
                console.log('   ⚠️ Empty script block');
                return;
            }
            
            try {
                // Test syntax dengan Function constructor
                new Function(jsContent);
                console.log('   ✅ Syntax OK');
            } catch (error) {
                console.log('   ❌ Syntax Error:', error.message);
                console.log('   📍 Error location:', error.stack.split('\n')[0]);
                hasErrors = true;
            }
        });
        
        return !hasErrors;
        
    } catch (error) {
        console.error('❌ Error reading file:', error.message);
        return false;
    }
}

// Check mapping-new.ejs
const mappingFile = path.join(__dirname, '../views/admin/billing/mapping-new.ejs');

if (fs.existsSync(mappingFile)) {
    const isValid = checkEJSSyntax(mappingFile);
    
    console.log('\n📊 SUMMARY:');
    if (isValid) {
        console.log('✅ All JavaScript syntax is valid');
        console.log('🎉 File is ready for use');
    } else {
        console.log('❌ JavaScript syntax errors found');
        console.log('🔧 Please fix the errors before using the file');
    }
} else {
    console.log('❌ File not found:', mappingFile);
}
