const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Adding password column to collectors table...\n');

// Add password column to collectors table
db.run(`
    ALTER TABLE collectors ADD COLUMN password TEXT
`, (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('✅ Password column already exists');
        } else {
            console.error('❌ Error adding password column:', err);
            return;
        }
    } else {
        console.log('✅ Password column added successfully');
    }
    
    // Update existing collector with default password
    const defaultPassword = '123456';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    
    db.run(`
        UPDATE collectors 
        SET password = ? 
        WHERE password IS NULL OR password = ''
    `, [hashedPassword], function(err) {
        if (err) {
            console.error('❌ Error updating default password:', err);
        } else {
            console.log(`✅ Updated ${this.changes} collector(s) with default password`);
        }
        
        // Verify the update
        db.all('SELECT id, name, phone, password FROM collectors', (err, rows) => {
            if (err) {
                console.error('❌ Error verifying update:', err);
            } else {
                console.log('\n📋 Updated collectors:');
                rows.forEach(collector => {
                    const hasPassword = collector.password ? 'Yes' : 'No';
                    console.log(`- ID: ${collector.id}, Name: ${collector.name}, Phone: ${collector.phone}, Has Password: ${hasPassword}`);
                });
            }
            
            db.close();
            console.log('\n✅ Database update completed!');
        });
    });
});
