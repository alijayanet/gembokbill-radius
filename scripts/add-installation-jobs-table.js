/**
 * Database Migration: Add Installation Jobs Table
 * 
 * Creates table structure for managing installation schedules/jobs
 * that admin can create and assign to technicians
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Starting Installation Jobs Table Migration...');

// Create installation_jobs table
const createInstallationJobsTable = `
    CREATE TABLE IF NOT EXISTS installation_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        package_id INTEGER NOT NULL,
        installation_date DATE NOT NULL,
        installation_time VARCHAR(20),
        assigned_technician_id INTEGER,
        status VARCHAR(50) DEFAULT 'scheduled',
        priority VARCHAR(20) DEFAULT 'normal',
        notes TEXT,
        equipment_needed TEXT,
        estimated_duration INTEGER DEFAULT 120,
        created_by_admin_id INTEGER,
        completed_at DATETIME,
        completion_notes TEXT,
        customer_latitude DECIMAL(10, 8),
        customer_longitude DECIMAL(11, 8),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (package_id) REFERENCES packages(id),
        FOREIGN KEY (assigned_technician_id) REFERENCES technicians(id)
    )
`;

// Create installation_job_status_history table for tracking status changes
const createJobStatusHistoryTable = `
    CREATE TABLE IF NOT EXISTS installation_job_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        changed_by_type VARCHAR(20) NOT NULL,
        changed_by_id INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES installation_jobs(id)
    )
`;

// Create installation_job_equipment table for equipment tracking
const createJobEquipmentTable = `
    CREATE TABLE IF NOT EXISTS installation_job_equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        equipment_name VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 1,
        serial_number VARCHAR(100),
        status VARCHAR(50) DEFAULT 'prepared',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES installation_jobs(id)
    )
`;

// Execute table creation
db.serialize(() => {
    // Create main installation_jobs table
    db.run(createInstallationJobsTable, (err) => {
        if (err) {
            console.error('❌ Error creating installation_jobs table:', err);
        } else {
            console.log('✅ Installation jobs table created successfully');
        }
    });
    
    // Create status history table
    db.run(createJobStatusHistoryTable, (err) => {
        if (err) {
            console.error('❌ Error creating installation_job_status_history table:', err);
        } else {
            console.log('✅ Installation job status history table created successfully');
        }
    });
    
    // Create equipment tracking table
    db.run(createJobEquipmentTable, (err) => {
        if (err) {
            console.error('❌ Error creating installation_job_equipment table:', err);
        } else {
            console.log('✅ Installation job equipment table created successfully');
        }
    });
    
    // Add indexes for better performance
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_installation_jobs_status ON installation_jobs(status)',
        'CREATE INDEX IF NOT EXISTS idx_installation_jobs_technician ON installation_jobs(assigned_technician_id)',
        'CREATE INDEX IF NOT EXISTS idx_installation_jobs_date ON installation_jobs(installation_date)',
        'CREATE INDEX IF NOT EXISTS idx_installation_jobs_created ON installation_jobs(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_job_status_history_job ON installation_job_status_history(job_id)'
    ];
    
    indexes.forEach((indexSql, i) => {
        db.run(indexSql, (err) => {
            if (err) {
                console.error(`❌ Error creating index ${i+1}:`, err);
            } else {
                console.log(`✅ Index ${i+1} created successfully`);
            }
        });
    });
    
    // Insert sample data for testing
    const insertSampleData = `
        INSERT OR IGNORE INTO installation_jobs (
            job_number, customer_name, customer_phone, customer_address, 
            package_id, installation_date, installation_time, status, 
            priority, notes, equipment_needed, created_by_admin_id
        ) VALUES 
        ('INS-2025-001', 'Budi Santoso', '081234567890', 'Jl. Merdeka No. 123, Bandung', 
         1, '2025-08-27', '09:00-11:00', 'scheduled', 'high', 
         'Instalasi untuk pelanggan baru, lokasi di lantai 2', 
         'Router TP-Link, Kabel UTP 50m, Connector RJ45', 1),
        ('INS-2025-002', 'Siti Aminah', '081234567891', 'Jl. Sudirman No. 456, Bandung', 
         2, '2025-08-27', '13:00-15:00', 'scheduled', 'normal', 
         'Instalasi rumah tinggal, sudah ada jalur kabel', 
         'Router Huawei, Kabel Fiber 30m', 1),
        ('INS-2025-003', 'Ahmad Rahman', '081234567892', 'Jl. Gatot Subroto No. 789, Bandung', 
         1, '2025-08-28', '08:00-10:00', 'assigned', 'normal', 
         'Pindahan dari lokasi lama, bawa perangkat lama', 
         'Router Mikrotik, Switch 8 Port', 1)
    `;
    
    db.run(insertSampleData, (err) => {
        if (err) {
            console.error('❌ Error inserting sample data:', err);
        } else {
            console.log('✅ Sample installation jobs inserted successfully');
        }
    });
});

// Close database connection
db.close((err) => {
    if (err) {
        console.error('❌ Error closing database:', err);
    } else {
        console.log('🎉 Installation Jobs Migration completed successfully!');
        console.log('📋 Tables created:');
        console.log('   - installation_jobs (main jobs table)');
        console.log('   - installation_job_status_history (status tracking)');
        console.log('   - installation_job_equipment (equipment tracking)');
        console.log('📊 Sample data inserted for testing');
    }
});