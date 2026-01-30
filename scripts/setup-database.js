#!/usr/bin/env node

/**
 * Setup database script
 * Mendukung SQLite dan MySQL
 * Redirects to new-server-setup-mysql.js
 */

console.log('🔄 Redirecting to new setup script...');

// Import and run the new server setup
const newServerSetup = require('./new-server-setup-mysql.js');

// Run the setup
newServerSetup()
    .then(() => {
        console.log('✅ Setup completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });