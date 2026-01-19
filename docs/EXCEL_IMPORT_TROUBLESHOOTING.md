# Excel Import Troubleshooting Guide

## 🔍 **Masalah Umum Import Excel**

### **1. File Excel Tidak Bisa Dibuka**
**Gejala:** Error "File XLSX tidak ditemukan" atau "Worksheet tidak ditemukan"
**Solusi:**
- Pastikan file berformat `.xlsx` (Excel 2007+)
- Pastikan file tidak corrupt
- Coba buka file di Excel untuk memastikan file valid

### **2. Data Tidak Masuk ke Database**
**Gejala:** Import berhasil tapi data tidak muncul di database
**Solusi:**
- Periksa format header Excel (harus sesuai dengan kolom database)
- Pastikan data wajib (nama, telepon) terisi
- Periksa log server untuk error detail

### **3. Error "Nama/Phone wajib"**
**Gejala:** Import gagal dengan pesan validasi
**Solusi:**
- Pastikan kolom `name` dan `phone` terisi di Excel
- Pastikan tidak ada baris kosong di tengah data
- Periksa format nomor telepon (hanya angka, +, -, spasi, ())

### **4. GenieACS Warning**
**Gejala:** Warning "No device found with PPPoE Username"
**Solusi:**
- Ini normal untuk customer baru yang belum ada device
- Import tetap berhasil, hanya GenieACS integration yang di-skip
- Device bisa ditambahkan manual setelah customer dibuat

## 📋 **Format Excel yang Benar**

### **Header Wajib:**
```
name | phone | pppoe_username | email | address | package_id | pppoe_profile | status | auto_suspension | billing_day
```

### **Contoh Data:**
```
John Doe | 081234567890 | john_doe | john@example.com | Jl. Contoh 123 | 1 | default | active | 1 | 15
Jane Smith | 081234567891 | jane_smith | jane@example.com | Jl. Test 456 | 1 | default | active | 1 | 20
```

## 🔧 **Troubleshooting Steps**

### **Step 1: Periksa File Excel**
```bash
# Test file Excel dengan script
node test_excel_import.js
```

### **Step 2: Periksa Database**
```bash
# Cek customer yang sudah ada
node -e "const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./data/billing.db'); db.all('SELECT id, username, name, phone FROM customers ORDER BY id', (err, rows) => { if (err) console.error(err); else { console.log('All customers:'); rows.forEach(row => console.log('ID:', row.id, 'Username:', row.username, 'Name:', row.name, 'Phone:', row.phone)); } db.close(); });"
```

### **Step 3: Periksa Log Server**
- Buka console server untuk melihat error detail
- Periksa file log untuk error import

### **Step 4: Test Import Manual**
```bash
# Test import dengan data sample
node test_import.js
```

## ⚠️ **Peringatan Penting**

### **ID Conflict Prevention:**
- Customer billing menggunakan ID 1-999
- Customer voucher menggunakan ID 1000+
- Import Excel akan menggunakan auto-increment, pastikan tidak konflik

### **Data Validation:**
- Nama dan telepon wajib diisi
- Format telepon: hanya angka, +, -, spasi, ()
- Billing day: 1-28 (default: 15)
- Status: active/inactive (default: active)

### **GenieACS Integration:**
- GenieACS integration bersifat optional
- Jika device tidak ditemukan, customer tetap dibuat
- Device bisa ditambahkan manual setelah customer dibuat

## 🚀 **Best Practices**

1. **Backup Database** sebelum import besar
2. **Test dengan data kecil** dulu
3. **Periksa format Excel** sebelum import
4. **Monitor log server** saat import
5. **Validasi data** setelah import selesai

## 📞 **Support**

Jika masih ada masalah:
1. Periksa log server untuk error detail
2. Test dengan file Excel sample
3. Periksa format data Excel
4. Hubungi developer untuk bantuan lebih lanjut
