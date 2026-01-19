/**
 * Run Technicians Migration
 * Execute the technicians table migration
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Starting Technicians Migration...');

// Read the migration file
const migrationPath = path.join(__dirname, '../migrations/create_technicians_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split by semicolon and execute each statement
const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);

let completed = 0;
const total = statements.length;

statements.forEach((statement, index) => {
    const trimmedStatement = statement.trim();
    if (trimmedStatement) {
        db.run(trimmedStatement, (err) => {
            if (err) {
                console.error(`❌ Error executing statement ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Statement ${index + 1} executed successfully`);
            }
            
            completed++;
            if (completed === total) {
                console.log('🎉 Technicians Migration completed!');
                db.close();
            }
        });
    } else {
        completed++;
        if (completed === total) {
            console.log('🎉 Technicians Migration completed!');
            db.close();
        }
    }
});
