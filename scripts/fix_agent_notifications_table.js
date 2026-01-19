const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db');

const newConstraint = `(
    'voucher_sold', 'payment_received', 'balance_updated', 'request_approved', 'request_rejected',
    'registration_success', 'registration_approved', 'registration_rejected'
)`;

async function migrate() {
    db.serialize(() => {
        // 1. Rename tabel lama
        db.run(`ALTER TABLE agent_notifications RENAME TO agent_notifications_old`, (err) => {
            if (err) {
                if (err.message.includes('no such table')) {
                    // Tabel belum ada, buat baru saja
                    createNewTable();
                    return;
                } else {
                    console.error('Gagal rename tabel lama:', err.message);
                    process.exit(1);
                }
            } else {
                createNewTable(true);
            }
        });
    });
}

function createNewTable(copyOld = false) {
    // 2. Buat tabel baru dengan constraint yang benar
    const createSql = `CREATE TABLE agent_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL CHECK (notification_type IN ${newConstraint}),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )`;
    db.run(createSql, (err) => {
        if (err) {
            console.error('Gagal membuat tabel baru:', err.message);
            process.exit(1);
        } else {
            if (copyOld) {
                // 3. Copy data lama yang valid
                const insertSql = `INSERT INTO agent_notifications (id, agent_id, notification_type, title, message, is_read, created_at)
                    SELECT id, agent_id, notification_type, title, message, is_read, created_at
                    FROM agent_notifications_old
                    WHERE notification_type IN ${newConstraint}`;
                db.run(insertSql, (err) => {
                    if (err) {
                        console.error('Gagal copy data lama:', err.message);
                    }
                    // 4. Drop tabel lama
                    db.run('DROP TABLE agent_notifications_old', (err) => {
                        if (err) {
                            console.error('Gagal drop tabel lama:', err.message);
                        }
                        console.log('Tabel agent_notifications berhasil diperbarui!');
                        process.exit(0);
                    });
                });
            } else {
                console.log('Tabel agent_notifications berhasil dibuat!');
                process.exit(0);
            }
        }
    });
}

migrate();
