# PERBAIKAN SETTING VOUCHER ONLINE - Dynamic Profile Selection

## 📋 Ringkasan Perubahan

Setting Voucher Online sekarang menggunakan profile Mikrotik yang dinamis, sama seperti di halaman "Generate Voucher". Profile dipilih langsung dari Mikrotik yang aktif, bukan hardcoded.

### ✅ **Perubahan yang Telah Diimplementasikan:**

#### 1. **Dynamic Profile Selection**
- **Sebelum**: Profile hardcoded ('3k', '5k', '10k', dll)
- **Sesudah**: Profile dipilih dari Mikrotik yang aktif

#### 2. **Smart Default Values**
- Default profile menggunakan profile pertama yang tersedia dari Mikrotik
- Fallback ke 'default' jika tidak ada profile yang tersedia

#### 3. **Reset Functionality**
- Tombol "Reset ke Profile Pertama" untuk mengatur semua paket ke profile pertama
- Backend endpoint untuk reset settings

---

## 🔧 Perubahan Teknis Detail

### A. View Changes (`views/adminHotspot.ejs`)

**Perubahan Utama**:
```ejs
<!-- Sebelum - Hardcoded default -->
<option value="<%= profile.name %>" <%= profile.name === (voucherOnlineSettings['3k']?.profile || '3k') ? 'selected' : '' %>>

<!-- Sesudah - Dynamic default -->
<option value="<%= profile.name %>" <%= profile.name === (voucherOnlineSettings['3k']?.profile || profiles[0]?.name || '3k') ? 'selected' : '' %>>
```

**Fitur Baru**:
1. **Reset Button**: Tombol untuk reset semua setting ke profile pertama
2. **Smart Default**: Menggunakan profile pertama dari Mikrotik sebagai default

### B. Backend Changes (`routes/adminHotspot.js`)

**Fungsi Baru**:
1. **Dynamic Default Settings**:
   ```javascript
   // Get first available profile from Mikrotik as default
   const { getHotspotProfiles } = require('../config/mikrotik');
   getHotspotProfiles().then(profilesResult => {
       const defaultProfile = (profilesResult.success && profilesResult.data && profilesResult.data.length > 0) 
           ? profilesResult.data[0].name 
           : 'default';
   });
   ```

2. **Reset Endpoint**:
   ```javascript
   router.post('/reset-voucher-online-settings', async (req, res) => {
       // Reset all packages to first available profile
   });
   ```

### C. JavaScript Functions

**Fungsi Baru**:
```javascript
// Reset setting voucher online ke profile pertama
window.resetVoucherOnlineSettings = function() {
    // Call backend to reset settings
    fetch('/admin/hotspot/reset-voucher-online-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI to reflect the reset
            // Show success message
        }
    });
};
```

---

## 🚀 Cara Penggunaan

### 1. **Mengatur Profile Voucher Online**
1. Buka halaman Admin → Hotspot
2. Scroll ke bagian "Setting Voucher Online"
3. Pilih profile Mikrotik untuk setiap paket voucher
4. Klik "Simpan Setting Voucher Online"

### 2. **Reset ke Profile Pertama**
1. Di halaman "Setting Voucher Online"
2. Klik tombol "Reset ke Profile Pertama"
3. Konfirmasi reset
4. Semua paket akan diatur ke profile pertama yang tersedia

### 3. **Default Behavior**
- Saat pertama kali setup, semua paket akan menggunakan profile pertama dari Mikrotik
- Jika Mikrotik tidak tersedia, fallback ke 'default'

---

## 📊 Benefits

### 1. **Konsistensi dengan Generate Voucher**
- ✅ Profile selection sama dengan halaman Generate Voucher
- ✅ Menggunakan profile yang benar-benar ada di Mikrotik

### 2. **User Experience**
- ✅ Tidak perlu menebak nama profile
- ✅ Dropdown menampilkan semua profile yang tersedia
- ✅ Reset function untuk kemudahan setup

### 3. **Maintenance**
- ✅ Otomatis menggunakan profile yang tersedia
- ✅ Tidak ada hardcoded profile names
- ✅ Fallback mechanism jika ada error

---

## 🧪 Testing

### 1. **Test Profile Loading**
```bash
# Cek apakah profile Mikrotik ter-load dengan benar
curl http://localhost:3000/admin/hotspot
```

### 2. **Test Reset Function**
1. Buka halaman Admin → Hotspot
2. Ubah beberapa profile di Setting Voucher Online
3. Klik "Reset ke Profile Pertama"
4. Cek apakah semua profile kembali ke profile pertama

### 3. **Test Default Behavior**
1. Hapus tabel `voucher_online_settings`
2. Refresh halaman Admin → Hotspot
3. Cek apakah default profile menggunakan profile pertama dari Mikrotik

---

## 🔮 Future Improvements

1. **Profile Validation**: Validasi apakah profile yang dipilih benar-benar ada di Mikrotik
2. **Bulk Profile Update**: Update multiple packages sekaligus
3. **Profile Preview**: Tampilkan informasi profile (bandwidth, dll) saat memilih
4. **Auto-sync**: Sync otomatis dengan perubahan profile di Mikrotik

---

## 📝 Migration Notes

### Database Changes
- Tidak ada perubahan schema database
- Tabel `voucher_online_settings` tetap sama
- Hanya default values yang berubah

### Backward Compatibility
- ✅ Setting yang sudah ada tetap berfungsi
- ✅ Tidak ada breaking changes
- ✅ Graceful fallback jika ada error

---

*Dokumentasi ini dibuat pada: 27 Januari 2025*
*Status: IMPLEMENTED ✅*
