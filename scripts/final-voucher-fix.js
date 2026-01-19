const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'data', 'billing.db');

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('Connected to the database.');
  
  // Verify all required columns exist in voucher_online_settings table
  verifyAndFixVoucherTable();
});

function verifyAndFixVoucherTable() {
  console.log('Checking voucher_online_settings table structure...');
  
  // Get current table structure
  db.all("PRAGMA table_info(voucher_online_settings)", (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err.message);
      db.close();
      process.exit(1);
    }
    
    // Convert to array if it's not already
    const columns = Array.isArray(rows) ? rows : [];
    
    console.log('Current columns:');
    const columnNames = columns.map(row => row.name);
    columnNames.forEach(name => console.log(`  - ${name}`));
    
    // Check for required columns
    const requiredColumns = ['name', 'digits', 'price'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns are present.');
      testVoucherFunctionality();
    } else {
      console.log(`⚠️  Missing columns: ${missingColumns.join(', ')}`);
      addMissingColumns(missingColumns);
    }
  });
}

function addMissingColumns(missingColumns) {
  console.log('Adding missing columns...');
  
  const columnDefinitions = {
    'name': 'ALTER TABLE voucher_online_settings ADD COLUMN name TEXT',
    'digits': 'ALTER TABLE voucher_online_settings ADD COLUMN digits INTEGER DEFAULT 5',
    'price': 'ALTER TABLE voucher_online_settings ADD COLUMN price INTEGER DEFAULT 0'
  };
  
  let completed = 0;
  
  missingColumns.forEach(column => {
    if (columnDefinitions[column]) {
      db.run(columnDefinitions[column], (err) => {
        if (err) {
          console.log(`⚠️  Note: ${err.message} (may already exist)`);
        } else {
          console.log(`✅ Added column: ${column}`);
        }
        
        completed++;
        if (completed === missingColumns.length) {
          // Update existing records with default values
          updateExistingRecords();
        }
      });
    } else {
      completed++;
      if (completed === missingColumns.length) {
        updateExistingRecords();
      }
    }
  });
  
  if (missingColumns.length === 0) {
    updateExistingRecords();
  }
}

function updateExistingRecords() {
  console.log('Updating existing records with default values...');
  
  // Update name column
  db.run(`UPDATE voucher_online_settings 
          SET name = CASE package_id
            WHEN '3k' THEN '3rb - 1 Hari'
            WHEN '5k' THEN '5rb - 2 Hari'
            WHEN '10k' THEN '10rb - 5 Hari'
            WHEN '15k' THEN '15rb - 8 Hari'
            WHEN '25k' THEN '25rb - 15 Hari'
            WHEN '50k' THEN '50rb - 30 Hari'
            ELSE package_id || ' - Paket'
          END
          WHERE name IS NULL OR name = ''`, (err) => {
    if (err) {
      console.log(`⚠️  Warning updating names: ${err.message}`);
    } else {
      console.log('✅ Updated name column for existing records');
    }
    
    // Update digits column
    db.run(`UPDATE voucher_online_settings 
            SET digits = 5
            WHERE digits IS NULL`, (err) => {
      if (err) {
        console.log(`⚠️  Warning updating digits: ${err.message}`);
      } else {
        console.log('✅ Updated digits column for existing records');
      }
      
      // Update price column
      db.run(`UPDATE voucher_online_settings 
              SET price = CASE package_id
                WHEN '3k' THEN 3000
                WHEN '5k' THEN 5000
                WHEN '10k' THEN 10000
                WHEN '15k' THEN 15000
                WHEN '25k' THEN 25000
                WHEN '50k' THEN 50000
                ELSE 0
              END
              WHERE price IS NULL`, (err) => {
        if (err) {
          console.log(`⚠️  Warning updating prices: ${err.message}`);
        } else {
          console.log('✅ Updated price column for existing records');
        }
        
        testVoucherFunctionality();
      });
    });
  });
}

function testVoucherFunctionality() {
  console.log('\nTesting voucher functionality...');
  
  // Test the exact query that's used in the application
  const testQuery = `
    INSERT OR REPLACE INTO voucher_online_settings
    (package_id, name, profile, digits, price, enabled, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  
  const testValues = ['test-suite', 'Test Suite Package', 'test-profile', 8, 25000, 1];
  
  db.run(testQuery, testValues, function(err) {
    if (err) {
      console.error('❌ Error testing voucher functionality:', err.message);
      finalizeAndExit(1);
      return;
    }
    
    console.log('✅ Voucher functionality test passed.');
    console.log(`   Rows affected: ${this.changes}`);
    
    // Clean up test data
    db.run('DELETE FROM voucher_online_settings WHERE package_id = ?', ['test-suite'], (err) => {
      if (err) {
        console.log('Warning: Could not clean up test data:', err.message);
      } else {
        console.log('✅ Test data cleaned up successfully');
      }
      
      finalizeAndExit(0);
    });
  });
}

function finalizeAndExit(code) {
  console.log('\n🎉 Voucher settings fix completed!');
  db.close();
  process.exit(code);
}