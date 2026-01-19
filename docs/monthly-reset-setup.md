# Setup Monthly Reset System

## 📋 Overview

Sistem monthly reset akan otomatis menyimpan summary bulan lalu dan mereset counter ke 0 setiap tanggal 1. Data transaksi bulan lalu tetap tersimpan di database.

## 🔧 Setup Otomatis

**✅ TIDAK PERLU SETUP MANUAL!** 

Sistem monthly reset sudah terintegrasi ke dalam aplikasi dan akan berjalan otomatis saat aplikasi dijalankan.

### **Jadwal Otomatis:**
- **23:59 tanggal 1**: Generate monthly summary
- **00:01 tanggal 1**: Monthly reset (reset counter ke 0)
- **08:00 tanggal 1**: Generate monthly invoices
- **09:00 harian**: Due date reminders
- **10:00 harian**: Service suspension check
- **11:00 harian**: Service restoration check
- **Setiap 6 jam**: Voucher cleanup

### **File Konfigurasi:**
- **Scheduler**: `config/scheduler.js`
- **Billing Manager**: `config/billing.js`
- **Logs**: `logs/app.log`

## 🗄️ Database Tables

### 1. **monthly_summary** (sudah ada)
```sql
CREATE TABLE monthly_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_customers INTEGER,
    active_customers INTEGER,
    monthly_invoices INTEGER,
    voucher_invoices INTEGER,
    paid_monthly_invoices INTEGER,
    paid_voucher_invoices INTEGER,
    unpaid_monthly_invoices INTEGER,
    unpaid_voucher_invoices INTEGER,
    monthly_revenue REAL,
    voucher_revenue REAL,
    monthly_unpaid REAL,
    voucher_unpaid REAL,
    total_revenue REAL,
    total_unpaid REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);
```

### 2. **collector_monthly_summary** (baru)
```sql
CREATE TABLE collector_monthly_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collector_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_payments REAL NOT NULL DEFAULT 0,
    total_commission REAL NOT NULL DEFAULT 0,
    payment_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collector_id, year, month)
);
```

## 🔄 Cara Kerja

### 1. **Auto Reset (Tanggal 1)**
- Script `monthly-reset-cron.js` dijalankan otomatis
- Menyimpan summary bulan lalu ke database
- Counter summary direset ke 0 untuk bulan baru

### 2. **Manual Reset**
- Akses `/admin/billing/monthly-summary`
- Klik tombol "Reset Bulanan"
- Konfirmasi dan proses reset

### 3. **Data yang Disimpan**
- **Admin Summary**: Total customer, invoice, revenue, dll
- **Collector Summary**: Total payments, commission, payment count per collector

## 📊 Summary yang Di-Reset

### **Collector Dashboard:**
- ✅ **Today's Payments**: Tetap per hari
- 🔄 **Total Commission**: Reset ke 0 setiap bulan (hanya bulan berjalan)
- 🔄 **Total Payments**: Reset ke 0 setiap bulan (hanya bulan berjalan)

### **Admin Dashboard:**
- 🔄 **Billing Stats**: Reset ke 0 setiap bulan
- ✅ **Monthly Summary**: Data tersimpan di database

## 🧪 Testing

### 1. **Test via Web**
- Akses `/admin/billing/monthly-summary`
- Klik "Reset Bulanan"
- Cek hasil di database

### 2. **Test Manual (Development)**
```bash
# Test monthly reset via billing manager
node -e "
const billingManager = require('./config/billing');
billingManager.performMonthlyReset().then(result => {
    console.log('Result:', result);
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
"
```

### 3. **Verifikasi Database**
```sql
-- Cek monthly summary
SELECT * FROM monthly_summary ORDER BY year DESC, month DESC LIMIT 5;

-- Cek collector monthly summary
SELECT * FROM collector_monthly_summary ORDER BY year DESC, month DESC LIMIT 10;
```

## 📝 Logs

### **Application Logs**
- File: `logs/app.log`
- Format: `[INFO] Monthly reset completed: {...}`
- Format: `[INFO] Monthly reset scheduler initialized - will run on 1st of every month at 00:01`

## ⚠️ Troubleshooting

### 1. **Scheduler Tidak Jalan**
```bash
# Cek aplikasi berjalan
ps aux | grep node

# Cek logs aplikasi
tail -f logs/app.log

# Restart aplikasi
pm2 restart all
```

### 2. **Database Error**
```bash
# Cek database connection
# Pastikan file billing.db ada dan writable
ls -la data/billing.db
```

### 3. **Manual Test**
```bash
# Test monthly reset manual
node -e "
const billingManager = require('./config/billing');
billingManager.performMonthlyReset().then(console.log).catch(console.error);
"
```

## 🎯 Benefits

1. **Data Preservation**: Data bulan lalu tersimpan
2. **Clean Dashboard**: Counter reset ke 0 setiap bulan
3. **Historical Data**: Bisa lihat trend bulanan
4. **Automated**: Tidak perlu manual reset
5. **Audit Trail**: Log lengkap untuk tracking

## 📈 Monitoring

### 1. **Check Last Reset**
```sql
SELECT MAX(created_at) as last_reset FROM monthly_summary;
```

### 2. **Check Collector Summary**
```sql
SELECT c.name, cms.year, cms.month, cms.total_payments, cms.total_commission
FROM collector_monthly_summary cms
JOIN collectors c ON cms.collector_id = c.id
ORDER BY cms.year DESC, cms.month DESC;
```

## 🎯 **INTEGRASI SELESAI!**

### **✅ Sistem Monthly Reset Terintegrasi:**
- **Scheduler**: `config/scheduler.js` - Auto-reset setiap tanggal 1 jam 00:01
- **Billing Manager**: `config/billing.js` - Method untuk monthly reset
- **Web Interface**: `/admin/billing/monthly-summary` - Manual reset
- **API Endpoints**: 
  - `POST /admin/billing/api/monthly-reset` - Direct reset
  - `POST /admin/billing/api/trigger-monthly-reset` - Via scheduler

### **🔄 Jadwal Otomatis:**
```
23:59 tanggal 1 → Generate monthly summary
00:01 tanggal 1 → Monthly reset (reset counter ke 0)
08:00 tanggal 1 → Generate monthly invoices
```

### **📊 Data yang Di-Reset:**
- **Collector Dashboard**: Total Commission & Total Payments (bulan berjalan)
- **Admin Dashboard**: Billing stats (bulan berjalan)
- **Data Tersimpan**: Semua data bulan lalu di `monthly_summary` & `collector_monthly_summary`

---

**Sistem monthly reset sudah terintegrasi dan siap digunakan!** 🎉
