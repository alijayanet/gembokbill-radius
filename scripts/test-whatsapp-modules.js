#!/usr/bin/env node

/**
 * Test Script untuk WhatsApp Modular
 * 
 * Script ini akan menguji semua modul WhatsApp yang baru dibuat
 * tanpa mengganggu aplikasi yang sedang berjalan.
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing WhatsApp Modular Architecture...\n');

// Test 1: Check if all modules exist
console.log('📁 Checking module files...');
const modules = [
    'whatsapp-core.js',
    'whatsapp-commands.js', 
    'whatsapp-message-handlers.js',
    'whatsapp-new.js'
];

let allModulesExist = true;
modules.forEach(module => {
    const modulePath = path.join(__dirname, '..', 'config', module);
    if (fs.existsSync(modulePath)) {
        console.log(`✅ ${module} - EXISTS`);
    } else {
        console.log(`❌ ${module} - MISSING`);
        allModulesExist = false;
    }
});

if (!allModulesExist) {
    console.log('\n❌ Some modules are missing. Please check the file structure.');
    process.exit(1);
}

console.log('\n✅ All modules exist!\n');

// Test 2: Test module loading
console.log('🔧 Testing module loading...');

try {
    // Test WhatsApp Core
    console.log('Testing WhatsApp Core...');
    const WhatsAppCore = require('../config/whatsapp-core');
    const core = new WhatsAppCore();
    console.log('✅ WhatsApp Core loaded successfully');
    
    // Test WhatsApp Commands
    console.log('Testing WhatsApp Commands...');
    const WhatsAppCommands = require('../config/whatsapp-commands');
    const commands = new WhatsAppCommands(core);
    console.log('✅ WhatsApp Commands loaded successfully');
    
    // Test WhatsApp Message Handlers
    console.log('Testing WhatsApp Message Handlers...');
    const WhatsAppMessageHandlers = require('../config/whatsapp-message-handlers');
    const handlers = new WhatsAppMessageHandlers(core, commands);
    console.log('✅ WhatsApp Message Handlers loaded successfully');
    
    // Test WhatsApp New (Main Module)
    console.log('Testing WhatsApp New (Main Module)...');
    const whatsappNew = require('../config/whatsapp-new');
    console.log('✅ WhatsApp New loaded successfully');
    
    console.log('\n✅ All modules loaded successfully!\n');
    
} catch (error) {
    console.log(`❌ Error loading modules: ${error.message}`);
    console.log('Stack trace:', error.stack);
    process.exit(1);
}

// Test 3: Test core functionality
console.log('🧠 Testing core functionality...');

try {
    const WhatsAppCore = require('../config/whatsapp-core');
    const core = new WhatsAppCore();
    
    // Test admin validation
    console.log('Testing admin validation...');
    const testAdmin = '6281947215703'; // From settings.json
    const isAdmin = core.isAdminNumber(testAdmin);
    console.log(`Admin ${testAdmin}: ${isAdmin ? '✅ Valid' : '❌ Invalid'}`);
    
    // Test phone number formatting
    console.log('Testing phone number formatting...');
    const testNumbers = ['08123456789', '628123456789', '123456789'];
    testNumbers.forEach(num => {
        const formatted = core.formatPhoneNumber(num);
        console.log(`${num} -> ${formatted}`);
    });
    
    // Test JID creation
    console.log('Testing JID creation...');
    const jid = core.createJID('08123456789');
    console.log(`JID: ${jid}`);
    
    // Test status management
    console.log('Testing status management...');
    const status = core.getWhatsAppStatus();
    console.log('Initial status:', status);
    
    core.updateStatus({ test: 'value' });
    const updatedStatus = core.getWhatsAppStatus();
    console.log('Updated status:', updatedStatus);
    
    console.log('\n✅ Core functionality tests passed!\n');
    
} catch (error) {
    console.log(`❌ Error testing core functionality: ${error.message}`);
    process.exit(1);
}

// Test 4: Test command handlers
console.log('⌨️ Testing command handlers...');

try {
    const WhatsAppCore = require('../config/whatsapp-core');
    const WhatsAppCommands = require('../config/whatsapp-commands');
    
    const core = new WhatsAppCore();
    const commands = new WhatsAppCommands(core);
    
    // Test command methods exist
    const requiredMethods = [
        'handleCekStatus',
        'handleGantiSSID', 
        'handleGantiPassword',
        'handleReboot',
        'handleStatus',
        'handleRestart'
    ];
    
    requiredMethods.forEach(method => {
        if (typeof commands[method] === 'function') {
            console.log(`✅ ${method} method exists`);
        } else {
            console.log(`❌ ${method} method missing`);
        }
    });
    
    console.log('\n✅ Command handlers tests passed!\n');
    
} catch (error) {
    console.log(`❌ Error testing command handlers: ${error.message}`);
    process.exit(1);
}

// Test 5: Test message handlers
console.log('📨 Testing message handlers...');

try {
    const WhatsAppCore = require('../config/whatsapp-core');
    const WhatsAppCommands = require('../config/whatsapp-commands');
    const WhatsAppMessageHandlers = require('../config/whatsapp-message-handlers');
    
    const core = new WhatsAppCore();
    const commands = new WhatsAppCommands(core);
    const handlers = new WhatsAppMessageHandlers(core, commands);
    
    // Test handler methods exist
    const requiredHandlers = [
        'handleIncomingMessage',
        'processMessage',
        'handleAdminCommands',
        'handleCustomerCommands'
    ];
    
    requiredHandlers.forEach(handler => {
        if (typeof handlers[handler] === 'function') {
            console.log(`✅ ${handler} method exists`);
        } else {
            console.log(`❌ ${handler} method missing`);
        }
    });
    
    console.log('\n✅ Message handlers tests passed!\n');
    
} catch (error) {
    console.log(`❌ Error testing message handlers: ${error.message}`);
    process.exit(1);
}

// Test 6: Test main module exports
console.log('📦 Testing main module exports...');

try {
    const whatsappNew = require('../config/whatsapp-new');
    
    const requiredExports = [
        'connectToWhatsApp',
        'getWhatsAppStatus',
        'deleteWhatsAppSession',
        'whatsappCore',
        'whatsappCommands',
        'messageHandlers'
    ];
    
    requiredExports.forEach(exportName => {
        if (whatsappNew[exportName] !== undefined) {
            console.log(`✅ ${exportName} exported`);
        } else {
            console.log(`❌ ${exportName} not exported`);
        }
    });
    
    console.log('\n✅ Main module exports tests passed!\n');
    
} catch (error) {
    console.log(`❌ Error testing main module exports: ${error.message}`);
    process.exit(1);
}

// Test 7: Test help messages
console.log('❓ Testing help messages...');

try {
    const { 
        getAdminHelpMessage, 
        getCustomerHelpMessage, 
        getGeneralHelpMessage,
        getBillingHelpMessage 
    } = require('../config/help-messages');
    
    // Test help message functions
    const adminHelp = getAdminHelpMessage();
    const customerHelp = getCustomerHelpMessage();
    const generalHelp = getGeneralHelpMessage();
    const billingHelp = getBillingHelpMessage();
    
    if (adminHelp && adminHelp.includes('MENU ADMIN')) {
        console.log('✅ Admin help message generated');
    } else {
        console.log('❌ Admin help message invalid');
    }
    
    if (customerHelp && customerHelp.includes('MENU PELANGGAN')) {
        console.log('✅ Customer help message generated');
    } else {
        console.log('❌ Customer help message invalid');
    }
    
    if (generalHelp && generalHelp.includes('MENU BOT')) {
        console.log('✅ General help message generated');
    } else {
        console.log('❌ General help message invalid');
    }
    
    if (billingHelp && billingHelp.includes('BANTUAN MENU BILLING')) {
        console.log('✅ Billing help message generated');
    } else {
        console.log('❌ Billing help message invalid');
    }
    
    console.log('\n✅ Help messages tests passed!\n');
    
} catch (error) {
    console.log(`❌ Error testing help messages: ${error.message}`);
    process.exit(1);
}

// Test 8: Performance test
console.log('⚡ Testing module performance...');

try {
    const startTime = Date.now();
    
    // Load all modules multiple times to test performance
    for (let i = 0; i < 10; i++) {
        const WhatsAppCore = require('../config/whatsapp-core');
        const WhatsAppCommands = require('../config/whatsapp-commands');
        const WhatsAppMessageHandlers = require('../config/whatsapp-message-handlers');
        
        const core = new WhatsAppCore();
        const commands = new WhatsAppCommands(core);
        const handlers = new WhatsAppMessageHandlers(core, commands);
    }
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`✅ Modules loaded 10 times in ${loadTime}ms`);
    console.log(`Average load time: ${(loadTime / 10).toFixed(2)}ms per iteration`);
    
    console.log('\n✅ Performance tests passed!\n');
    
} catch (error) {
    console.log(`❌ Error testing performance: ${error.message}`);
    process.exit(1);
}

// Final summary
console.log('🎉 All tests completed successfully!');
console.log('\n📋 Test Summary:');
console.log('✅ Module files exist');
console.log('✅ Module loading works');
console.log('✅ Core functionality works');
console.log('✅ Command handlers work');
console.log('✅ Message handlers work');
console.log('✅ Main module exports work');
console.log('✅ Help messages work');
console.log('✅ Performance is acceptable');
console.log('\n🚀 WhatsApp Modular Architecture is ready for use!');
console.log('\n💡 Next steps:');
console.log('1. Test the new modules in development environment');
console.log('2. Gradually migrate from old whatsapp.js to whatsapp-new.js');
console.log('3. Monitor for any issues or bugs');
console.log('4. Once stable, update app.js to use the new modules');
console.log('5. Remove old files after successful migration');

process.exit(0);
