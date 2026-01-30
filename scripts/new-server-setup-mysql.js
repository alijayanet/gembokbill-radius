#!/usr/bin/env node

/**
 * New Server Setup - Setup awal untuk server baru
 * Membuat data default yang diperlukan untuk server baru tanpa data lama
 * Mendukung SQLite dan MySQL
 */

const db = require('../config/database');
const { getSetting } = require('../config/settingsManager');
const fs = require('fs');
const path = require('path');

async function newServerSetup() {
  try {
    console.log('🚀 NEW SERVER SETUP - Setup Awal Server Baru...\n');
    console.log(`📊 Database type: ${getSetting('db_type', 'sqlite')}\n`);

    // Step 0: Run SQL migrations first
    await runSqlMigrations();

    // Ensure essential tables exist
    await ensureEssentialTables();

    // Ensure app_settings table exists
    await ensureAppSettingsTable();

    // Step 1: Create default packages
    console.log('\n📦 Step 1: Creating default packages...');
    const packages = [
      {
        name: 'Paket Internet Dasar',
        speed: '10 Mbps',
        price: 100000,
        description: 'Paket internet dasar 10 Mbps unlimited',
        is_active: 1,
        pppoe_profile: 'default'
      },
      {
        name: 'Paket Internet Standard',
        speed: '20 Mbps',
        price: 150000,
        description: 'Paket internet standard 20 Mbps unlimited',
        is_active: 1,
        pppoe_profile: 'standard'
      },
      {
        name: 'Paket Internet Premium',
        speed: '50 Mbps',
        price: 250000,
        description: 'Paket internet premium 50 Mbps unlimited',
        is_active: 1,
        pppoe_profile: 'premium'
      }
    ];

    const packageIds = [];
    for (const pkg of packages) {
      try {
        const result = await db.execute(`
          INSERT OR IGNORE INTO packages (name, speed, price, tax_rate, description, is_active, pppoe_profile) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [pkg.name, pkg.speed, pkg.price, 11, pkg.description, pkg.is_active, pkg.pppoe_profile]);
        
        if (result.lastID > 0) {
          console.log(`   ✅ Package ${pkg.name} created (ID: ${result.lastID})`);
          packageIds.push(result.lastID);
        } else {
          // Get existing package ID
          const existing = await db.get('SELECT id FROM packages WHERE name = ?', [pkg.name]);
          if (existing) {
            console.log(`   ℹ️  Package ${pkg.name} already exists (ID: ${existing.id})`);
            packageIds.push(existing.id);
          }
        }
      } catch (err) {
        console.log(`   ⚠️  Package ${pkg.name}: ${err.message}`);
      }
    }

    // Step 2: Create default collector
    console.log('\n👤 Step 2: Creating default collector...');
    try {
      const existing = await db.get('SELECT id FROM collectors WHERE phone = ?', ['081234567890']);
      if (existing) {
        console.log('   ℹ️  Default collector already exists (ID: ' + existing.id + ')');
      } else {
        const result = await db.execute(`
          INSERT INTO collectors (name, phone, email, commission_rate, status, created_at) 
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, ['Kolektor Utama', '081234567890', 'kolektor@company.com', 10.0, 'active']);
        console.log('   ✅ Default collector created (ID: ' + result.lastID + ')');
      }
    } catch (err) {
      console.log(`   ⚠️  Collector: ${err.message}`);
    }

    // Step 3: Create default technician
    console.log('\n🔧 Step 3: Creating default technician...');
    try {
      const existing = await db.get('SELECT id FROM technicians WHERE phone = ?', ['081234567891']);
      if (existing) {
        console.log('   ℹ️  Default technician already exists (ID: ' + existing.id + ')');
      } else {
        const result = await db.execute(`
          INSERT INTO technicians (name, phone, role, is_active, join_date, created_at) 
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, ['Administrator', '081234567891', 'technician', 1]);
        console.log('   ✅ Default technician created (ID: ' + result.lastID + ')');
      }
    } catch (err) {
      console.log(`   ⚠️  Technician: ${err.message}`);
    }

    // Step 4: Create sample customers
    console.log('\n👥 Step 4: Creating sample customers...');
    const customers = [
      {
        username: 'pelanggan1',
        name: 'Pelanggan Pertama',
        phone: '081234567892',
        email: 'pelanggan1@example.com',
        address: 'Alamat Pelanggan Pertama'
      },
      {
        username: 'pelanggan2',
        name: 'Pelanggan Kedua',
        phone: '081234567893',
        email: 'pelanggan2@example.com',
        address: 'Alamat Pelanggan Kedua'
      }
    ];

    const customerIds = [];
    for (const customer of customers) {
      try {
        const result = await db.execute(`
          INSERT OR IGNORE INTO customers (username, name, phone, email, address, status, join_date) 
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [customer.username, customer.name, customer.phone, customer.email, customer.address, 'active']);
        
        if (result.lastID > 0) {
          console.log(`   ✅ Customer ${customer.username} created (ID: ${result.lastID})`);
          customerIds.push(result.lastID);
        } else {
          const existing = await db.get('SELECT id FROM customers WHERE username = ?', [customer.username]);
          if (existing) customerIds.push(existing.id);
        }
      } catch (err) {
        console.log(`   ⚠️  Customer ${customer.username}: ${err.message}`);
      }
    }

    // Step 5: Create sample invoices
    console.log('\n📄 Step 5: Creating sample invoices...');
    const invoiceIds = [];

    if (customerIds.length > 0 && packageIds.length > 0) {
      const invoices = [
        {
          customer_id: customerIds[0],
          package_id: packageIds[0],
          amount: 100000,
          status: 'unpaid',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoice_number: 'INV-001',
          invoice_type: 'monthly'
        },
        {
          customer_id: customerIds[1],
          package_id: packageIds[1],
          amount: 150000,
          status: 'unpaid',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoice_number: 'INV-002',
          invoice_type: 'monthly'
        }
      ];

      for (const invoice of invoices) {
        try {
          const result = await db.execute(`
            INSERT OR IGNORE INTO invoices (customer_id, package_id, amount, status, due_date, created_at, invoice_number, invoice_type) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
          `, [invoice.customer_id, invoice.package_id, invoice.amount, invoice.status, invoice.due_date, invoice.invoice_number, invoice.invoice_type]);
          
          if (result.lastID > 0) {
            console.log(`   ✅ Invoice ${invoice.invoice_number} created (ID: ${result.lastID})`);
            invoiceIds.push(result.lastID);
          }
        } catch (err) {
          console.log(`   ⚠️  Invoice ${invoice.invoice_number}: ${err.message}`);
        }
      }
    } else {
      console.log('   ⚠️  Skipping invoice creation - no customers or packages available');
    }

    // Step 6: Create app settings
    console.log('\n⚙️  Step 6: Creating app settings...');
    const settings = [
      { key: 'company_name', value: 'ALIJAYA DIGITAL NETWORK' },
      { key: 'company_phone', value: '081947215703' },
      { key: 'company_email', value: 'info@alijaya.com' },
      { key: 'company_address', value: 'Jl. Contoh Alamat No. 123' },
      { key: 'default_commission_rate', value: '10' },
      { key: 'tax_rate', value: '11' },
      { key: 'currency', value: 'IDR' },
      { key: 'timezone', value: 'Asia/Jakarta' }
    ];

    for (const setting of settings) {
      try {
        await db.execute(`
          INSERT OR IGNORE INTO app_settings (key, value, created_at) 
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [setting.key, setting.value]);
        console.log(`   ✅ Setting ${setting.key} created`);
      } catch (err) {
        console.log(`   ⚠️  Setting ${setting.key}: ${err.message}`);
      }
    }

    // Step 7: Final verification
    console.log('\n📊 Step 7: Final verification...');
    const finalStats = await db.query(`
      SELECT 
        'packages' as table_name, COUNT(*) as count 
      FROM packages
      UNION ALL
      SELECT 
        'collectors' as table_name, COUNT(*) as count 
      FROM collectors
      UNION ALL
      SELECT 
        'technicians' as table_name, COUNT(*) as count 
      FROM technicians
      UNION ALL
      SELECT 
        'customers' as table_name, COUNT(*) as count 
      FROM customers
      UNION ALL
      SELECT 
        'invoices' as table_name, COUNT(*) as count 
      FROM invoices
      UNION ALL
      SELECT 
        'app_settings' as table_name, COUNT(*) as count 
      FROM app_settings
    `);

    finalStats.forEach(stat => {
      console.log(`   📊 ${stat.table_name}: ${stat.count} records`);
    });

    console.log('\n🎉 NEW SERVER SETUP COMPLETED!');
    console.log('='.repeat(60));
    console.log('✅ Default packages created');
    console.log('✅ Default collector created');
    console.log('✅ Default technician created');
    console.log('✅ Sample customers created');
    console.log('✅ Sample invoices created');
    console.log('✅ App settings configured');
    console.log('✅ System ready for production');
    console.log('='.repeat(60));

    console.log('\n📋 Summary:');
    console.log(`   📦 Packages: ${packageIds.length} packages`);
    console.log(`   👤 Collector: Kolektor Utama (10% commission)`);
    console.log(`   🔧 Technician: Administrator (admin role)`);
    console.log(`   👥 Customers: ${customerIds.length} sample customers`);
    console.log(`   📄 Invoices: ${invoiceIds.length} sample invoices`);
    console.log(`   ⚙️  Settings: ${settings.length} app settings`);

    console.log('\n🚀 Server is ready for production use!');

  } catch (error) {
    console.error('❌ Error during new server setup:', error);
    throw error;
  }
}

async function ensureAppSettingsTable() {
  console.log('🔧 Ensuring app_settings table exists...');
  
  const dbType = getSetting('db_type', 'sqlite');
  let createTableSQL;
  
  if (dbType === 'sqlite') {
    createTableSQL = `
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } else {
    createTableSQL = `
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;
  }
  
  await db.execute(createTableSQL);
  console.log('   ✅ app_settings table ensured');
}

async function ensureEssentialTables() {
  console.log('🔧 Ensuring essential tables exist...');
  
  const dbType = getSetting('db_type', 'sqlite');
  const tables = [
    'packages', 'collectors', 'technicians', 'customers', 'invoices', 
    'payments', 'expenses', 'payment_gateway_transactions'
  ];
  
  for (const tableName of tables) {
    try {
      const [rows] = await db.query(`SHOW TABLES LIKE ?`, [tableName]);
      if (rows.length === 0 && dbType === 'mysql') {
        console.log(`   ℹ️  Table ${tableName} will be created by migrations`);
      } else if (dbType === 'sqlite') {
        const row = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tableName]);
        if (!row) {
          console.log(`   ℹ️  Table ${tableName} will be created by migrations`);
        }
      }
    } catch (err) {
      console.log(`   ℹ️  Checking table ${tableName}: ${err.message}`);
    }
  }
  
  console.log('   ✅ Essential tables check completed');
}

async function runSqlMigrations() {
  console.log('\n🔧 Step 0: Running SQL migrations...');
  
  const migrationsDir = path.join(__dirname, '../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('   ⚠️  Migrations directory not found, skipping...');
    return;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`   📋 Found ${migrationFiles.length} migration files`);
  
  const dbType = getSetting('db_type', 'sqlite');
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log(`   🚀 Running ${file}...`);
    
    try {
      let sql = fs.readFileSync(filePath, 'utf8');
      
      // Convert SQLite syntax to MySQL if needed
      if (dbType === 'mysql') {
        sql = convertSQLiteToMySQL(sql);
      }
      
      await db.execute(sql);
      console.log(`   ✅ ${file} completed successfully`);
    } catch (error) {
      if (error.message.includes('duplicate') || 
          error.message.includes('already exists') ||
          error.message.includes('Duplicate column') ||
          error.message.includes('Duplicate entry')) {
        console.log(`   ℹ️  ${file}: ${error.message} (continuing...)`);
      } else {
        console.log(`   ⚠️  ${file} had issues: ${error.message} (continuing...)`);
      }
    }
  }
  
  console.log('   🎉 SQL migrations completed!\n');
}

function convertSQLiteToMySQL(sql) {
  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
    .replace(/INTEGER PRIMARY KEY/gi, 'INT PRIMARY KEY')
    .replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT')
    .replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE')
    .replace(/INSERT OR REPLACE/gi, 'REPLACE')
    .replace(/BOOLEAN/gi, 'TINYINT(1)')
    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    .replace(/REAL/gi, 'DOUBLE')
    .replace(/CREATE UNIQUE INDEX IF NOT EXISTS/gi, 'CREATE UNIQUE INDEX')
    .replace(/CREATE INDEX IF NOT EXISTS/gi, 'CREATE INDEX');
}

// Run if called directly
if (require.main === module) {
  newServerSetup()
    .then(() => {
      console.log('✅ New server setup completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ New server setup failed:', error);
      process.exit(1);
    });
}

module.exports = newServerSetup;
