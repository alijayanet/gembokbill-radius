# 🚀 SERVER INSTALLATION SCRIPTS

Dokumentasi script untuk instalasi server baru dan reset data transaksi.

## 📋 DAFTAR SCRIPT

### 1. 🆕 `fresh-server-installation.js`
**Script untuk instalasi server baru dari 0**

**Fitur:**
- ✅ Menghapus SEMUA data transaksi
- ✅ Membuat data default lengkap
- ✅ Setup voucher pricing system
- ✅ Setup agent system dengan balance
- ✅ Setup packages internet
- ✅ Setup collectors dan technicians
- ✅ Konfigurasi app settings
- ✅ Optimasi database

**Kapan digunakan:**
- Install server baru dari 0
- Reset lengkap dengan data default
- Setup awal production

**Cara menjalankan:**
```bash
node scripts/fresh-server-installation.js
```

**Konfirmasi:** Ketik `FRESH INSTALL`

---

### 2. 🗑️ `clear-all-transactions.js`
**Script untuk menghapus semua data transaksi saja**

**Fitur:**
- ✅ Menghapus SEMUA data transaksi
- ✅ Reset auto-increment sequences
- ✅ Optimasi database
- ❌ TIDAK membuat data default

**Kapan digunakan:**
- Reset data transaksi tanpa data default
- Bersihkan data lama sebelum import data baru
- Maintenance database

**Cara menjalankan:**
```bash
node scripts/clear-all-transactions.js
```

**Konfirmasi:** Ketik `CLEAR ALL`

---

### 3. 🔄 `reset-for-new-installation.js` (Existing)
**Script reset untuk instalasi baru (Legacy)**

**Fitur:**
- ✅ Menghapus data transaksi
- ✅ Membuat data default minimal
- ✅ Reset sequences

**Kapan digunakan:**
- Jika script baru tidak kompatibel
- Reset sederhana

---

### 4. 🧹 `complete-reset.js` (Existing)
**Script reset lengkap termasuk cache**

**Fitur:**
- ✅ Menghapus semua data
- ✅ Reset sequences
- ✅ Vacuum database
- ✅ Hapus cache files
- ✅ Data default minimal

---

## 🎯 REKOMENDASI PENGGUNAAN

### Untuk Server Baru (Production):
```bash
node scripts/fresh-server-installation.js
```
**Alasan:** Script paling lengkap dengan data default yang diperlukan

### Untuk Reset Data Transaksi:
```bash
node scripts/clear-all-transactions.js
```
**Alasan:** Hanya hapus data transaksi, pertahankan settings

### Untuk Maintenance:
```bash
node scripts/complete-reset.js
```
**Alasan:** Reset lengkap termasuk cache files

## 📊 DATA DEFAULT YANG DIBUAT

### 🎫 Voucher Pricing (fresh-server-installation.js):
- **3K**: 1 hari, Rp 3,000 (Agent: Rp 2,000)
- **5K**: 2 hari, Rp 5,000 (Agent: Rp 4,000)
- **10K**: 5 hari, Rp 10,000 (Agent: Rp 8,000)
- **Member 7 Hari**: 7 hari, Rp 15,000 (Agent: Rp 12,000)

### 👤 Agent Default:
- **Nama**: Agent Test
- **Phone**: 081234567890
- **Balance**: Rp 100,000
- **Status**: Active

### 📦 Packages Internet:
- **Dasar**: 10 Mbps, Rp 100,000
- **Standard**: 20 Mbps, Rp 150,000
- **Premium**: 50 Mbps, Rp 250,000

### 💰 Collector Default:
- **Nama**: Kolektor Utama
- **Phone**: 081234567891
- **Commission**: 10%

### 🔧 Technician Default:
- **Nama**: Administrator
- **Phone**: 081234567892
- **Role**: Admin

## ⚙️ SETTINGS YANG DIKONFIGURASI

### App Settings:
- Company name, phone, email, address
- Company header dan footer
- Default commission rate (10%)
- Tax rate (11%)
- Currency (IDR)
- Timezone (Asia/Jakarta)
- WhatsApp gateway (enabled)
- Agent system (enabled)
- Voucher system (enabled)

## 🚨 PERINGATAN

### ⚠️ BACKUP DATA
**SELALU backup database sebelum menjalankan script!**

```bash
# Backup database
cp data/billing.db data/billing_backup_$(date +%Y%m%d_%H%M%S).db
```

### ⚠️ KONFIRMASI
Semua script memerlukan konfirmasi dengan mengetik:
- `fresh-server-installation.js`: `FRESH INSTALL`
- `clear-all-transactions.js`: `CLEAR ALL`
- `reset-for-new-installation.js`: `RESET`
- `complete-reset.js`: Tidak ada konfirmasi (hati-hati!)

### ⚠️ PRODUCTION
Jangan jalankan script di production tanpa backup!

## 🔧 TROUBLESHOOTING

### Error: Database locked
```bash
# Stop aplikasi terlebih dahulu
pkill -f node
# Kemudian jalankan script
```

### Error: Permission denied
```bash
# Berikan permission execute
chmod +x scripts/*.js
```

### Error: Module not found
```bash
# Install dependencies
npm install
```

## 📝 LOG DAN MONITORING

### Script akan menampilkan:
- ✅ Progress setiap step
- 📊 Jumlah data yang dihapus
- 📊 Data yang dibuat
- ✅ Status setiap operasi
- 📋 Summary akhir

### Log file:
Script tidak membuat log file, semua output ke console.

## 🎉 SETELAH MENJALANKAN SCRIPT

### 1. Restart Aplikasi
```bash
# Restart aplikasi untuk memastikan settings aktif
pkill -f node
npm start
```

### 2. Test Sistem
- ✅ Login admin
- ✅ Test agent login
- ✅ Test voucher generation
- ✅ Test WhatsApp integration
- ✅ Test Mikrotik integration

### 3. Konfigurasi Tambahan
- ⚙️ Update company settings
- 🎫 Adjust voucher pricing
- 👤 Add real agents
- 📦 Add real packages
- 🔧 Configure Mikrotik settings

## 📞 SUPPORT

Jika ada masalah dengan script:
1. Cek error message di console
2. Pastikan database tidak locked
3. Backup database sebelum retry
4. Hubungi developer untuk bantuan

---

**🚀 Script siap digunakan untuk instalasi server baru!**
