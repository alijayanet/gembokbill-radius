#!/usr/bin/env node

/**
 * Script to run voucher online settings migrations
 * Adds missing columns to voucher_online_settings table
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔧 Running voucher online settings migrations...');

// Path to database and migration files
const dbPath = path.join(__dirname, '../data/billing.db');
const migrationsDir = path.join(__dirname, '../migrations');

// Migration files to run in order
const migrationFiles = [
    'add_name_to_voucher_online_settings.sql',
    'add_digits_to_voucher_online_settings.sql',
    'add_commission_columns_to_voucher_online_settings.sql'
];

if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found:', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('📋 Executing voucher online settings migrations...\n');
    
    let completedMigrations = 0;
    
    migrationFiles.forEach((migrationFile, index) => {
        const migrationPath = path.join(migrationsDir, migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found: ${migrationPath}`);
            return;
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📄 Running migration ${index + 1}/${migrationFiles.length}: ${migrationFile}`);
        
        // Split SQL commands and execute one by one
        const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);
        
        let completedCommands = 0;
        
        commands.forEach((command, cmdIndex) => {
            const trimmedCommand = command.trim();
            if (trimmedCommand.length === 0) return;
            
            db.run(trimmedCommand + ';', (err) => {
                if (err) {
                    // Ignore errors for duplicate column additions
                    if (err.message.includes('duplicate column name') || 
                        err.message.includes('already exists') ||
                        err.message.includes('duplicate')) {
                        console.log(`⚠️  Command ${cmdIndex + 1} skipped (already exists): ${trimmedCommand.substring(0, 50)}...`);
                    } else {
                        console.error(`❌ Error executing command ${cmdIndex + 1}:`, err.message);
                        console.error('Command:', trimmedCommand);
                    }
                } else {
                    console.log(`✅ Command ${cmdIndex + 1} executed successfully`);
                }
                
                completedCommands++;
                
                // Check if all commands for this migration are done
                if (completedCommands >= commands.length) {
                    console.log(`✅ Migration ${migrationFile} completed\n`);
                    completedMigrations++;
                    
                    // Check if all migrations are done
                    if (completedMigrations >= migrationFiles.length) {
                        console.log('🎉 All voucher online settings migrations completed successfully!');
                        verifyMigration();
                    }
                }
            });
        });
    });
});

function verifyMigration() {
    console.log('\n🔍 Verifying migration results...');
    
    // Check if the columns exist
    const checkColumnsQuery = `
        PRAGMA table_info(voucher_online_settings);
    `;
    
    db.all(checkColumnsQuery, (err, rows) => {
        if (err) {
            console.error('❌ Error checking table structure:', err.message);
            db.close();
            return;
        }
        
        console.log('📋 Current voucher_online_settings table structure:');
        rows.forEach(row => {
            console.log(`  - ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? 'DEFAULT ' + row.dflt_value : ''}`);
        });
        
        // Check if required columns exist
        const columnNames = rows.map(row => row.name);
        const requiredColumns = ['name', 'digits', 'agent_price', 'commission_amount', 'is_active'];
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missingColumns.length === 0) {
            console.log('✅ All required columns are present in voucher_online_settings table');
        } else {
            console.log('⚠️  Missing columns:', missingColumns);
        }
        
        db.close();
        console.log('\n🏁 Migration script finished');
    });
}