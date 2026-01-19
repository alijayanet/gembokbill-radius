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
  
  // First, let's see what we have
  db.all("SELECT id, package_name, customer_price, duration, duration_type FROM voucher_pricing ORDER BY customer_price ASC", (err, rows) => {
    if (err) {
      console.error('Error getting voucher pricing data:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('Current voucher packages:');
    rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.package_name} - Rp ${row.customer_price.toLocaleString('id-ID')} (${row.duration} ${row.duration_type}) [ID: ${row.id}]`);
    });
    
    // Since we have duplicates, let's keep only the first occurrence of each unique package
    // based on package_name and customer_price
    const uniquePackages = {};
    const idsToDelete = [];
    
    rows.forEach(row => {
      const key = `${row.package_name}-${row.customer_price}`;
      if (uniquePackages[key]) {
        // This is a duplicate, mark for deletion
        idsToDelete.push(row.id);
      } else {
        // This is the first occurrence, keep it
        uniquePackages[key] = row.id;
      }
    });
    
    if (idsToDelete.length > 0) {
      console.log(`\nFound ${idsToDelete.length} duplicate packages. Cleaning up...`);
      
      // Delete duplicates
      const deleteQuery = `DELETE FROM voucher_pricing WHERE id IN (${idsToDelete.join(',')})`;
      db.run(deleteQuery, function(err) {
        if (err) {
          console.error('Error deleting duplicate packages:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log(`✅ Successfully removed ${this.changes} duplicate packages.`);
        
        // Verify the cleanup
        db.all("SELECT id, package_name, customer_price, duration, duration_type FROM voucher_pricing ORDER BY customer_price ASC", (err, rows) => {
          if (err) {
            console.error('Error verifying cleanup:', err.message);
            db.close();
            process.exit(1);
          }
          
          console.log('\nCleaned voucher packages:');
          rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.package_name} - Rp ${row.customer_price.toLocaleString('id-ID')} (${row.duration} ${row.duration_type}) [ID: ${row.id}]`);
          });
          
          console.log('\n✅ Database cleanup complete. All duplicates removed.');
          db.close();
          process.exit(0);
        });
      });
    } else {
      console.log('\n✅ No duplicates found. Database is clean.');
      db.close();
      process.exit(0);
    }
  });
});