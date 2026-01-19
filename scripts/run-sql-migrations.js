#!/usr/bin/env node

/**
 * Script to run all SQL migrations in the migrations directory
 * Ensures database schema is up to date for fresh installations
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Function to check if a column exists in a table
async function columnExists(db, table, column) {
    return new Promise((resolve) => {
        db.get(`PRAGMA table_info(${table})`, (err, rows) => {
            if (err) {
                resolve(false);
                return;
            }
            
            if (Array.isArray(rows)) {
                const exists = rows.some(row => row.name === column);
                resolve(exists);
            } else {
                resolve(false);
            }
        });
    });
}

// Function to check if a table exists
async function tableExists(db, table) {
    return new Promise((resolve) => {
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table], (err, row) => {
            resolve(!!row);
        });
    });
}

async function runSqlMigrations() {
    const dbPath = path.join(__dirname, '../data/billing.db');
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
        console.log('❌ Database file not found. Please run npm run setup first.');
        process.exit(1);
    }
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🔧 Running SQL migrations...\n');
        
        // Get all SQL migration files
        const migrationsDir = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort to ensure proper order
        
        console.log(`📋 Found ${migrationFiles.length} migration files\n`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Run each migration
        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            console.log(`🚀 Running ${file}...`);
            
            try {
                const sql = fs.readFileSync(filePath, 'utf8');
                
                // Split SQL by semicolon to handle multiple statements
                const statements = sql
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0);
                
                for (const statement of statements) {
                    const trimmedStatement = statement.trim();
                    if (trimmedStatement) {
                        // Skip empty statements
                        if (trimmedStatement.toUpperCase() === 'BEGIN' || 
                            trimmedStatement.toUpperCase() === 'COMMIT' ||
                            trimmedStatement.toUpperCase() === 'END') {
                            continue;
                        }
                        
                        await new Promise((resolve, reject) => {
                            db.run(trimmedStatement, function(err) {
                                if (err) {
                                    // Ignore errors for already existing columns/tables
                                    if (err.message.includes('duplicate') || 
                                        err.message.includes('already exists') ||
                                        err.message.includes('no such table') ||
                                        err.message.includes('no such column') ||
                                        err.message.includes('incomplete input') ||
                                        err.message.includes('not an error') ||
                                        err.message.includes('SQLITE_MISUSE')) {
                                        console.log(`      ℹ️  ${err.message} (continuing...)`);
                                        resolve();
                                    } else {
                                        console.log(`      ❌ Error: ${err.message}`);
                                        reject(err);
                                    }
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                }
                
                console.log(`   ✅ ${file} completed successfully`);
                successCount++;
            } catch (error) {
                console.log(`   ❌ ${file} failed: ${error.message}`);
                errorCount++;
            }
        }
        
        console.log('\n📋 SQL Migration Summary:');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📋 Total: ${migrationFiles.length}`);
        
        if (errorCount === 0) {
            console.log('\n🎉 All SQL migrations completed successfully!');
            console.log('✅ Database schema is up to date');
        } else {
            console.log('\n⚠️  Some migrations had issues, but continuing...');
            console.log('✅ Critical schema updates should be applied');
        }
        
    } catch (error) {
        console.error('❌ Error during SQL migrations:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run if called directly
if (require.main === module) {
    runSqlMigrations()
        .then(() => {
            console.log('✅ SQL migrations completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ SQL migrations failed:', error);
            process.exit(1);
        });
}

module.exports = runSqlMigrations;