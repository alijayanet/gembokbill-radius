# Invoice Settings Configuration - Gembok Bill

## Overview
Dokumen ini menjelaskan semua field settings yang digunakan untuk mengkustomisasi invoice tanpa perlu restart aplikasi.

## Field Settings yang Digunakan

### 1. Company Information
```json
{
  "company_header": "ALIJAYA DIGITAL NETWORK",
  "company_slogan": "Solusi Internet Terdepan",
  "logo_filename": "logo.png"
}
```

**Kegunaan:**
- `company_header`: Nama perusahaan yang ditampilkan di header invoice
- `company_slogan`: Slogan atau tagline perusahaan
- `logo_filename`: Nama file logo (harus ada di `/public/img/`)

### 2. Footer Information
```json
{
  "footer_info": "Info Hubungi : 081947215703"
}
```

**Kegunaan:**
- `footer_info`: Informasi tambahan yang ditampilkan di footer invoice

### 3. Payment Information
```json
{
  "payment_bank_name": "BCA",
  "payment_account_number": "1234567890",
  "payment_account_holder": "ALIJAYA DIGITAL NETWORK",
  "payment_cash_address": "Jl. Contoh No. 123",
  "payment_cash_hours": "08:00 - 17:00"
}
```

**Kegunaan:**
- `payment_bank_name`: Nama bank untuk transfer
- `payment_account_number`: Nomor rekening bank
- `payment_account_holder`: Nama pemilik rekening
- `payment_cash_address`: Alamat kantor untuk pembayaran tunai
- `payment_cash_hours`: Jam operasional kantor

### 4. Contact Information
```json
{
  "contact_phone": "0812-3456-7890",
  "contact_email": "info@example.com",
  "contact_address": "Jl. Contoh No. 123, Kota",
  "contact_whatsapp": "081947215703"
}
```

**Kegunaan:**
- `contact_phone`: Nomor telepon kantor
- `contact_email`: Email kantor
- `contact_address`: Alamat kantor
- `contact_whatsapp`: Nomor WhatsApp kantor

### 5. Company Additional Info
```json
{
  "company_website": "https://alijaya.net",
  "invoice_notes": "Pembayaran dapat dilakukan melalui transfer bank atau pembayaran tunai di kantor kami. Terima kasih atas kepercayaan Anda."
}
```

**Kegunaan:**
- `company_website`: Website perusahaan
- `invoice_notes`: Catatan tambahan yang ditampilkan di setiap invoice

## Cara Menggunakan

### 1. Edit Settings.json
```bash
# Buka file settings.json
nano settings.json

# Atau edit dengan editor favorit Anda
code settings.json
```

### 2. Update Field yang Diinginkan
```json
{
  "company_header": "NAMA PERUSAHAAN BARU",
  "company_slogan": "SLOGAN BARU",
  "payment_bank_name": "BANK BARU",
  "payment_account_number": "1234567890",
  "contact_phone": "081234567890"
}
```

### 3. Simpan File
Setelah mengedit, simpan file `settings.json`. Perubahan akan langsung aktif tanpa restart aplikasi.

## Hot-Reload System

Aplikasi menggunakan sistem hot-reload untuk settings:

### 1. Settings Manager
```javascript
const { getSetting, getSettingsWithCache } = require('./config/settingsManager');
```

### 2. Cache System
- Settings di-cache untuk performa optimal
- Cache di-refresh otomatis saat file berubah
- Tidak perlu restart aplikasi

### 3. Template Integration
```ejs
<%= appSettings.companyHeader %>
<%= appSettings.payment_bank_name %>
<%= appSettings.contact_phone %>
```

## Contoh Kustomisasi Lengkap

### Invoice Modern
```json
{
  "company_header": "TECHNOLOGY SOLUTIONS",
  "company_slogan": "Innovation at Your Fingertips",
  "company_website": "https://techsolutions.com",
  "payment_bank_name": "Mandiri",
  "payment_account_number": "1440012345678",
  "payment_account_holder": "PT. TECHNOLOGY SOLUTIONS",
  "contact_phone": "021-1234567",
  "contact_email": "info@techsolutions.com",
  "contact_address": "Jl. Sudirman No. 123, Jakarta Pusat",
  "contact_whatsapp": "081234567890",
  "invoice_notes": "Pembayaran dapat dilakukan melalui transfer bank, e-wallet, atau pembayaran tunai di kantor kami. Terima kasih atas kepercayaan Anda menggunakan layanan kami."
}
```

### Invoice Traditional
```json
{
  "company_header": "WARUNG INTERNET",
  "company_slogan": "Internet Murah dan Cepat",
  "company_website": "https://warunginternet.com",
  "payment_bank_name": "BRI",
  "payment_account_number": "1234567890",
  "payment_account_holder": "WARUNG INTERNET",
  "contact_phone": "081234567890",
  "contact_email": "info@warunginternet.com",
  "contact_address": "Jl. Raya No. 45, Desa",
  "contact_whatsapp": "081234567890",
  "invoice_notes": "Pembayaran dapat dilakukan di warung atau transfer bank. Terima kasih."
}
```

## Validasi Settings

### 1. Required Fields
Field berikut harus ada dan tidak boleh kosong:
- `company_header`
- `payment_bank_name`
- `payment_account_number`
- `payment_account_holder`
- `contact_phone`

### 2. Optional Fields
Field berikut opsional dan bisa dikosongkan:
- `company_slogan`
- `company_website`
- `invoice_notes`
- `contact_email`
- `contact_address`
- `contact_whatsapp`

### 3. Format Validation
- `contact_phone`: Harus berupa nomor telepon valid
- `contact_email`: Harus berupa email valid
- `company_website`: Harus berupa URL valid (opsional)

## Troubleshooting

### 1. Settings Tidak Berubah
**Problem:** Perubahan di settings.json tidak muncul di invoice
**Solution:** 
- Pastikan file tersimpan dengan benar
- Check syntax JSON (tidak ada koma terakhir)
- Refresh halaman invoice

### 2. Field Kosong
**Problem:** Field tertentu tidak muncul atau kosong
**Solution:**
- Pastikan field ada di settings.json
- Check nama field (case sensitive)
- Pastikan value tidak kosong

### 3. Error JSON
**Problem:** Aplikasi error karena format JSON salah
**Solution:**
- Validate JSON dengan online tool
- Check koma dan tanda kutip
- Pastikan struktur JSON benar

## Best Practices

### 1. Backup Settings
```bash
# Backup sebelum edit
cp settings.json settings.json.backup
```

### 2. Test Changes
- Test invoice setelah mengubah settings
- Pastikan semua field muncul dengan benar
- Check format dan layout

### 3. Version Control
- Commit perubahan settings ke git
- Dokumentasikan perubahan yang dilakukan
- Update dokumentasi jika ada field baru

## Monitoring

### 1. Log Files
Check log untuk error settings:
```bash
tail -f logs/error.log
tail -f logs/info.log
```

### 2. Health Check
```bash
curl http://localhost:3003/health
```

### 3. Settings Status
```javascript
// Check settings di console
console.log(require('./config/settingsManager').getSettingsWithCache());
```

## Support

### Contact
- **Developer**: Admin System
- **Email**: info@example.com
- **WhatsApp**: 081947215703

### Documentation
- **Invoice System**: `/docs/INVOICE_SYSTEM.md`
- **API Docs**: `/docs/api.md`
- **User Manual**: `/docs/user-manual.md`
