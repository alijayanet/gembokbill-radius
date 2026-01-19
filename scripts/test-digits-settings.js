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
  
  // Test updating a voucher setting with all columns including digits
  const testQuery = `
    INSERT OR REPLACE INTO voucher_online_settings 
    (package_id, name, profile, digits, enabled) 
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const testValues = ['test-package-2', 'Test Package Name 2', 'test-profile-2', 8, 1];
  
  db.run(testQuery, testValues, function(err) {
    if (err) {
      console.error('❌ Error updating voucher settings:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('✅ Successfully updated voucher settings with digits column');
    console.log(`   Rows affected: ${this.changes}`);
    
    // Verify the data was inserted correctly
    db.get('SELECT * FROM voucher_online_settings WHERE package_id = ?', ['test-package-2'], (err, row) => {
      if (err) {
        console.error('Error retrieving test data:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (row) {
        console.log('✅ Test data verification:');
        console.log(`   Package ID: ${row.package_id}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Profile: ${row.profile}`);
        console.log(`   Digits: ${row.digits}`);
        console.log(`   Enabled: ${row.enabled}`);
        
        // Clean up test data
        db.run('DELETE FROM voucher_online_settings WHERE package_id = ?', ['test-package-2'], (err) => {
          if (err) {
            console.error('Warning: Could not clean up test data:', err.message);
          } else {
            console.log('✅ Test data cleaned up successfully');
          }
          
          db.close();
          console.log('\n🎉 All tests passed! The digits column issue has been resolved.');
          process.exit(0);
        });
      } else {
        console.error('❌ Test data not found');
        db.close();
        process.exit(1);
      }
    });
  });
});