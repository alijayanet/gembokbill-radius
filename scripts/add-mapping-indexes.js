const BillingManager = require('../config/billing');

async function addMappingIndexes() {
    try {
        console.log('🔍 Menambahkan index untuk optimasi mapping...');
        
        const billingManager = new BillingManager();
        
        // Menambahkan index untuk kolom latitude dan longitude pada tabel customers
        billingManager.db.run("CREATE INDEX IF NOT EXISTS idx_customers_coordinates ON customers(latitude, longitude)", (err) => {
            if (err) {
                console.error('❌ Error creating index for customers coordinates:', err);
            } else {
                console.log('✅ Created index for customers coordinates');
            }
        });
        
        // Menambahkan index untuk kolom status pada tabel customers
        billingManager.db.run("CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status)", (err) => {
            if (err) {
                console.error('❌ Error creating index for customers status:', err);
            } else {
                console.log('✅ Created index for customers status');
            }
        });
        
        console.log('🎉 Indexes untuk optimasi mapping telah ditambahkan!');
        console.log('💡 Silakan restart aplikasi untuk menerapkan perubahan.');
        
    } catch (error) {
        console.error('❌ Error adding mapping indexes:', error.message);
        console.error(error.stack);
    }
}

// Jalankan script jika file dijalankan langsung
if (require.main === module) {
    addMappingIndexes();
}

module.exports = addMappingIndexes;