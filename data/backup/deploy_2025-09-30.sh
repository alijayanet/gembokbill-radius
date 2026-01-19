#!/bin/bash

# Script deploy untuk server
# Generated: 2025-09-30T05:34:58.326Z

echo "🚀 Memulai deploy ke server..."

# 1. Backup database server saat ini
echo "📋 Membuat backup database server..."
cp /path/to/server/data/billing.db /path/to/server/data/backup/server_backup_$(date +%Y%m%d_%H%M%S).db

# 2. Stop aplikasi (jika menggunakan PM2)
echo "⏹️  Menghentikan aplikasi..."
pm2 stop gembok-bill || true

# 3. Upload file backup baru
echo "📤 Mengupload database baru..."
# scp production_backup_*.db user@server:/path/to/server/data/billing.db

# 4. Restore database
echo "🔄 Restore database..."
# cp production_backup_*.db /path/to/server/data/billing.db

# 5. Set permissions
echo "🔐 Mengatur permissions..."
chmod 644 /path/to/server/data/billing.db
chown www-data:www-data /path/to/server/data/billing.db

# 6. Start aplikasi
echo "▶️  Menjalankan aplikasi..."
pm2 start gembok-bill

# 7. Verifikasi
echo "✅ Verifikasi deploy..."
pm2 status gembok-bill

echo "🎉 Deploy selesai!"
