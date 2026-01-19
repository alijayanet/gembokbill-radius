#!/bin/bash

# Script restore database di server
# Generated: 2025-09-30T05:34:58.327Z

echo "🔄 Memulai restore database di server..."

# 1. Stop aplikasi
echo "⏹️  Menghentikan aplikasi..."
pm2 stop gembok-bill || true

# 2. Backup database saat ini
echo "📋 Backup database saat ini..."
cp /path/to/server/data/billing.db /path/to/server/data/backup/pre_restore_$(date +%Y%m%d_%H%M%S).db

# 3. Restore database
echo "🔄 Restore database..."
cp production_backup_*.db /path/to/server/data/billing.db

# 4. Set permissions
echo "🔐 Mengatur permissions..."
chmod 644 /path/to/server/data/billing.db
chown www-data:www-data /path/to/server/data/billing.db

# 5. Start aplikasi
echo "▶️  Menjalankan aplikasi..."
pm2 start gembok-bill

# 6. Verifikasi
echo "✅ Verifikasi restore..."
pm2 status gembok-bill

echo "🎉 Restore selesai!"
