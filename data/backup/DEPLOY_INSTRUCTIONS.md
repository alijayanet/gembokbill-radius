
# 📋 INSTRUKSI DEPLOY KE SERVER

## 🚀 Langkah-langkah Deploy

### 1. Persiapan
- Pastikan aplikasi lokal sudah berjalan dengan baik
- Backup database lokal sudah dibuat
- File backup sudah siap untuk di-upload

### 2. Upload ke Server
```bash
# Upload file backup ke server
scp production_backup_*.db user@server:/path/to/server/data/

# Upload script deploy
scp deploy_*.sh user@server:/path/to/server/scripts/
scp restore_*.sh user@server:/path/to/server/scripts/
scp validate_*.sh user@server:/path/to/server/scripts/
```

### 3. Deploy di Server
```bash
# SSH ke server
ssh user@server

# Jalankan script deploy
cd /path/to/server/scripts/
chmod +x *.sh
./deploy_*.sh
```

### 4. Verifikasi
```bash
# Jalankan script validasi
./validate_*.sh

# Cek log aplikasi
pm2 logs gembok-bill

# Test aplikasi
curl http://localhost:3003/admin
```

### 5. Rollback (jika diperlukan)
```bash
# Restore dari backup sebelumnya
./restore_*.sh
```

## ⚠️ Catatan Penting

1. **Backup Database**: Selalu backup database server sebelum deploy
2. **Test di Staging**: Test dulu di environment staging jika ada
3. **Monitoring**: Monitor aplikasi setelah deploy
4. **Rollback Plan**: Siapkan plan rollback jika ada masalah

## 🔧 Troubleshooting

### Database tidak sinkron
- Cek WAL files di server
- Jalankan WAL checkpoint
- Restore dari backup yang benar

### Aplikasi tidak start
- Cek permissions database
- Cek log aplikasi
- Restart aplikasi

### Data hilang
- Restore dari backup terakhir
- Cek apakah ada transaksi yang belum di-commit
