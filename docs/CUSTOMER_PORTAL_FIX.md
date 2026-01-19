# Customer Portal - Bug Fix Report

## 📋 Masalah yang Ditemukan

### 1. **Error "Pelanggan tidak ditemukan" pada First Load**

**Gejala:**
- Ketika user klik tombol navbar bottom untuk halaman **Profile** atau **Invoice**, halaman menampilkan error "Pelanggan tidak ditemukan"
- Halaman baru muncul dengan benar setelah **hard refresh** (Ctrl+Shift+R)
- Tombol navbar lainnya (Billing, Home, Laporan) berfungsi normal

**Root Cause:**
Session data (`customer_username`) tidak tersimpan dengan benar saat navigasi pertama kali ke halaman Profile atau Invoice. Middleware `ensureCustomerSession` membuat/update session data, tetapi tidak melakukan **explicit save** sebelum melanjutkan ke handler route berikutnya.

Akibatnya:
1. Request pertama: middleware set `req.session.customer_username` tapi belum tersave
2. Route handler mencoba mengambil customer berdasarkan `username` yang belum tersave
3. Customer tidak ditemukan → Error "Pelanggan tidak ditemukan"
4. Hard refresh: session sudah tersave dari request sebelumnya → berhasil

### 2. **Data Customer Tidak Lengkap**

**Gejala:**
- Profile menampilkan "Pelanggan Sementara" dengan username `temp_6287828060111`
- Field "Paket" menampilkan "-" (kosong)
- Invoice menampilkan "Belum ada tagihan"
- Billing Dashboard menampilkan warning: "Nomor telepon Anda belum terdaftar dalam sistem billing"

**Root Cause:**
Customer dengan nomor `087828060111` **belum terdaftar di database billing** (tabel `customers`). Customer hanya bisa login karena valid di sistem GenieACS atau sistem lain, tapi tidak memiliki data billing.

---

## ✅ Solusi yang Diterapkan

### Fix #1: Session Save Explicit di Middleware

**File:** `routes/customerBilling.js`

**Perubahan:**
Menambahkan `req.session.save()` callback setelah setiap perubahan session data untuk memastikan session tersimpan sebelum melanjutkan ke route handler.

```javascript
// Sebelum (BROKEN)
req.session.customer_username = customer.username;
req.session.customer_phone = phone;
username = customer.username;
console.log(`✅ [SESSION_FIX] Set customer_username: ${username}`);

// Sesudah (FIXED)
req.session.customer_username = customer.username;
req.session.customer_phone = phone;
username = customer.username;
console.log(`✅ [SESSION_FIX] Set customer_username: ${username}`);

// IMPORTANT: Save session explicitly before continuing
await new Promise((resolve, reject) => {
    req.session.save((err) => {
        if (err) {
            console.error(`❌ [SESSION_FIX] Failed to save session:`, err);
            reject(err);
        } else {
            console.log(`💾 [SESSION_FIX] Session saved successfully`);
            resolve();
        }
    });
});
```

**Benefit:**
- Session data dipastikan tersimpan sebelum route handler dijalankan
- Tidak ada lagi error "Pelanggan tidak ditemukan" pada first load
- Tidak perlu hard refresh untuk melihat halaman Profile/Invoice

### Fix #2: Enhanced Logging

**Perubahan:**
Menambahkan logging yang lebih detail untuk debugging session issues:

```javascript
console.log(`🔍 [SESSION_CHECK] URL: ${req.url}, Username: ${username}, Phone: ${phone}`);
console.log(`✅ [SESSION_CHECK] Session OK - proceeding with username: ${username}`);
console.error('❌ [SESSION_ERROR] Error in ensureCustomerSession middleware:', error);
```

**Benefit:**
- Mudah tracking session flow di console
- Cepat identify masalah session di production

---

## 🧪 Testing Hasil Fix

### Test Case 1: Navigasi ke Profile Page
**Before Fix:**
1. Login dengan `087828060111` ✅
2. Klik navbar "Profile" ❌ Error "Pelanggan tidak ditemukan"
3. Hard refresh (Ctrl+Shift+R) ✅ Halaman muncul

**After Fix:**
1. Login dengan `087828060111` ✅
2. Klik navbar "Profile" ✅ Halaman langsung muncul tanpa error
3. No need hard refresh ✅

### Test Case 2: Navigasi ke Invoice Page
**Before Fix:**
1. Login dengan `087828060111` ✅
2. Klik navbar "Invoice" ❌ Error "Pelanggan tidak ditemukan"
3. Hard refresh (Ctrl+Shift+R) ✅ Halaman muncul

**After Fix:**
1. Login dengan `087828060111` ✅
2. Klik navbar "Invoice" ✅ Halaman langsung muncul tanpa error
3. No need hard refresh ✅

---

## 📝 Catatan untuk Data Customer

### Customer Belum Terdaftar di Billing

Jika customer menampilkan data berikut:
- Name: "Pelanggan Sementara"
- Username: `temp_6287828060111`
- Paket: "-"
- Invoice: "Belum ada tagihan"

**Artinya:** Customer belum terdaftar di database billing.

**Solusi:**
1. Admin perlu menambahkan customer ke sistem billing melalui Admin Panel
2. Atau customer perlu melakukan registrasi melalui WhatsApp/form registrasi
3. Setelah terdaftar, data akan otomatis muncul di Profile dan Invoice

### Cara Menambahkan Customer ke Billing

**Via Admin Panel:**
1. Login ke Admin Panel
2. Buka menu "Billing" → "Customers"
3. Klik "Add Customer"
4. Isi data customer:
   - Name: Nama customer
   - Phone: 087828060111 (format 08...)
   - Username: username_customer
   - Package: Pilih paket internet
   - Address: Alamat customer
5. Save

**Via Database Direct:**
```sql
INSERT INTO customers (name, phone, username, package_id, address, created_at)
VALUES ('Nama Customer', '6287828060111', 'cust_087828060111', 1, 'Alamat Customer', datetime('now'));
```

---

## 🔧 Technical Details

### Session Configuration
**File:** `app.js` (line 69-79)

```javascript
app.use(session({
  secret: 'rahasia-portal-anda',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 jam
    httpOnly: true
  },
  name: 'admin_session'
}));
```

### Middleware Flow

```
User Click Navbar → ensureCustomerSession Middleware → Route Handler → Render Page
                    ↓
                    1. Check session.customer_username
                    2. If not exist, get from billing by phone
                    3. Set session.customer_username
                    4. **SAVE SESSION** ← FIX APPLIED HERE
                    5. Continue to next()
```

---

## 📊 Impact Analysis

### Before Fix
- ❌ User experience buruk (perlu refresh manual)
- ❌ Confusion untuk end user
- ❌ Support ticket meningkat

### After Fix
- ✅ Smooth navigation tanpa error
- ✅ User experience lebih baik
- ✅ Reduce support ticket
- ✅ Professional appearance

---

## 🚀 Deployment Notes

### Files Modified
1. `routes/customerBilling.js` - Added explicit session.save()

### Restart Required
Yes - aplikasi perlu di-restart untuk menerapkan perubahan

### Backward Compatibility
✅ Fully backward compatible - tidak ada breaking changes

### Database Migration
❌ Tidak perlu migration - hanya perubahan code

---

## 📞 Support

Jika masih ada masalah setelah fix ini:

1. **Check console logs** untuk error message
2. **Clear browser cache** dan cookies
3. **Restart aplikasi** dengan `npm start`
4. **Check database** apakah customer sudah terdaftar

---

**Fixed by:** Antigravity AI Assistant  
**Date:** 2025-12-29  
**Version:** 2.1.0
