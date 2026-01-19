const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

const createTableSql = `
CREATE TABLE IF NOT EXISTS admin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    title TEXT,
    message TEXT,
    agent_id INTEGER,
    status TEXT DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

db.run(createTableSql, (err) => {
    if (err) {
        console.error('Gagal membuat tabel admin_notifications:', err.message);
        process.exit(1);
    } else {
        console.log('Tabel admin_notifications berhasil dibuat atau sudah ada.');
        process.exit(0);
    }
});
