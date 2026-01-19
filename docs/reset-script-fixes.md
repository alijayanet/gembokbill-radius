# 🔧 Perbaikan Script Reset Database

## ❌ **Masalah yang Ditemukan:**

### **Error:**
```
❌ Failed to create default package: SQLITE_ERROR: table packages has no column named status
```

### **Penyebab:**
Script reset database mencoba memasukkan data ke kolom `status` di tabel `packages`, padahal tabel tersebut menggunakan kolom `is_active`.

## ✅ **Perbaikan yang Dilakukan:**

### **1. Struktur Tabel yang Benar:**

#### **📋 Tabel `packages`:**
```sql
-- Kolom yang ada (BENAR):
- id (INTEGER)
- name (TEXT)
- speed (TEXT)
- price (DECIMAL(10,2))
- description (TEXT)
- is_active (BOOLEAN)  ← Kolom yang benar
- created_at (DATETIME)
- pppoe_profile (TEXT)
- tax_rate (DECIMAL(5,2))

-- Kolom yang TIDAK ada:
- status (TEXT)  ← Kolom yang salah
```

#### **👤 Tabel `collectors`:**
```sql
-- Kolom yang ada (BENAR):
- id (INTEGER)
- name (TEXT)
- phone (TEXT)
- email (TEXT)
- address (TEXT)
- status (TEXT)  ← Kolom ini ada
- commission_rate (DECIMAL(5,2))
- created_at (DATETIME)
- updated_at (DATETIME)
```

### **2. Perbaikan Script:**

#### **❌ Sebelum (SALAH):**
```javascript
// Script lama yang error
db.run(`
    INSERT INTO packages (name, speed, price, tax_rate, description, status) 
    VALUES (?, ?, ?, ?, ?, ?)
`, [
    'Paket Internet Dasar',
    10,  // speed sebagai INTEGER
    100000,
    11,
    'Paket internet dasar 10 Mbps',
    'active'  // status yang tidak ada
], ...);
```

#### **✅ Sesudah (BENAR):**
```javascript
// Script baru yang benar
db.run(`
    INSERT INTO packages (name, speed, price, tax_rate, description, is_active, pppoe_profile) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
`, [
    'Paket Internet Dasar',
    '10 Mbps',  // speed sebagai TEXT
    100000,
    11,
    'Paket internet dasar 10 Mbps',
    1,  // is_active sebagai BOOLEAN (1 = true)
    'default'  // pppoe_profile
], ...);
```

### **3. Perubahan Detail:**

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **Kolom status** | `status` (tidak ada) | `is_active` (ada) |
| **Speed format** | `10` (INTEGER) | `'10 Mbps'` (TEXT) |
| **Active flag** | `'active'` (TEXT) | `1` (BOOLEAN) |
| **PPPoE Profile** | Tidak ada | `'default'` |

## 🧪 **Testing yang Dilakukan:**

### **✅ Test 1: Struktur Tabel**
```javascript
// Memeriksa kolom yang ada di tabel packages
db.all(`PRAGMA table_info(packages)`, (err, rows) => {
    const columns = rows.map(row => row.name);
    const hasIsActive = columns.includes('is_active');
    const hasStatus = columns.includes('status');
    
    console.log(`✅ has is_active: ${hasIsActive}`);
    console.log(`❌ has status: ${hasStatus}`);
});
```

### **✅ Test 2: INSERT Statement**
```javascript
// Test INSERT dengan kolom yang benar
db.run(`
    INSERT INTO packages (name, speed, price, tax_rate, description, is_active, pppoe_profile) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
`, [
    'Test Package',
    '10 Mbps',
    100000,
    11,
    'Test package for validation',
    1,  // is_active = true
    'default'
], function(err) {
    if (err) {
        console.log('❌ Package INSERT failed:', err.message);
    } else {
        console.log('✅ Package INSERT successful (ID: ' + this.lastID + ')');
    }
});
```

### **✅ Test 3: Data Counts**
```javascript
// Memeriksa jumlah data di setiap tabel
const tables = ['customers', 'invoices', 'payments', 'collector_payments', 'collectors', 'packages'];
tables.forEach(table => {
    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
        console.log(`📈 ${table}: ${row.count} records`);
    });
});
```

## 🚀 **Hasil Perbaikan:**

### **✅ Script Reset Sekarang Berfungsi:**
1. **Tidak ada error** saat membuat default package
2. **Kolom yang benar** digunakan (`is_active` bukan `status`)
3. **Data type yang benar** (BOOLEAN untuk `is_active`)
4. **Format speed yang benar** (TEXT dengan satuan)
5. **PPPoE profile** ditambahkan

### **📊 Data yang Dibuat:**
- ✅ **1 default package**: "Paket Internet Dasar" (10 Mbps, Rp 100.000)
- ✅ **1 default collector**: "Tukang Tagih Default" (5% commission)
- ✅ **Auto-increment reset** ke 1 untuk semua tabel
- ✅ **System settings** dibersihkan kecuali yang essential

## 🔧 **Cara Menggunakan Script yang Sudah Diperbaiki:**

### **1. Jalankan Script Reset:**
```bash
node scripts/reset-for-new-installation.js
```

### **2. Konfirmasi Reset:**
```
Type "RESET" to confirm (case sensitive): RESET
```

### **3. Hasil yang Diharapkan:**
```
🎉 Database reset completed successfully!
============================================================
📋 RESET SUMMARY:
   Reset Date: 2024-01-15T10:30:00.000Z
   Data Deleted: 7 records
   Current Data: 2 records

✅ Default data created:
   - 1 default package (Paket Internet Dasar)
   - 1 default collector (Tukang Tagih Default)

🚀 Database is now ready for new server installation!
============================================================
```

## ⚠️ **Peringatan Penting:**

### **🚨 Script ini akan:**
- ❌ **MENGHAPUS SEMUA DATA** (customers, invoices, payments, dll)
- ❌ **TIDAK BISA DIUNDO** setelah dijalankan
- ❌ **RESET AUTO-INCREMENT** ke 1

### **✅ Pastikan:**
- ✅ **Backup database** sebelum menjalankan
- ✅ **Konfirmasi dengan "RESET"** yang tepat
- ✅ **Jalankan di environment yang tepat**

## 📝 **File yang Diperbaiki:**

- ✅ `scripts/reset-for-new-installation.js` - Script utama
- ✅ `scripts/test-reset-script.js` - Script testing
- ✅ `scripts/check-table-structure.js` - Script pemeriksaan struktur

---

**Script reset database sudah diperbaiki dan siap digunakan untuk instalasi server baru!** 🎉🔧✨
