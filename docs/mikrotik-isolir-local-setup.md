# Setup Mikrotik untuk User PPPoE Terisolir - Aplikasi Lokal

## 📋 Overview

Script ini akan mengatur Mikrotik agar user PPPoE yang terisolir (IP 192.168.200.0/24) selalu diarahkan ke aplikasi lokal di `192.168.8.89:3003/isolir`.

## 🔧 Konfigurasi

### **IP Range:**
- **PPPoE Aktif**: 192.168.10.1/24
- **PPPoE Isolir**: 192.168.200.1/24
- **Aplikasi Lokal**: 192.168.8.89:3003/isolir

## 🚀 Cara Penggunaan

### **1. Upload Script ke Mikrotik**

```bash
# Upload script ke Mikrotik
scp scripts/mikrotik-isolir-local.rsc admin@192.168.8.1:/tmp/

# Atau copy-paste script ke terminal Mikrotik
```

### **2. Jalankan Script**

```bash
# Login ke Mikrotik
ssh admin@192.168.8.1

# Jalankan script
/import file-name=mikrotik-isolir-local.rsc
```

### **3. Verifikasi Konfigurasi**

```bash
# Cek DNS static
/ip dns static print where name~"alijaya.gantiwifi.online"

# Cek NAT rules
/ip firewall nat print where comment~"isolir"

# Cek Firewall rules
/ip firewall filter print where comment~"isolir"
```

## 📊 Fitur yang Dikonfigurasi

### **1. DNS Static Rules**
- `alijaya.gantiwifi.online` → `192.168.8.89`
- `google.com` → `192.168.8.89`
- `facebook.com` → `192.168.8.89`
- `youtube.com` → `192.168.8.89`
- `instagram.com` → `192.168.8.89`
- `twitter.com` → `192.168.8.89`
- `tiktok.com` → `192.168.8.89`
- `whatsapp.com` → `192.168.8.89`
- `telegram.org` → `192.168.8.89`

### **2. NAT Rules**
- Redirect HTTP (port 80) → `192.168.8.89:3003`
- Redirect HTTPS (port 443) → `192.168.8.89:3003`

### **3. Firewall Rules**
- Allow DNS queries ke `192.168.8.89`
- Allow HTTP/HTTPS ke `192.168.8.89:3003`
- Block semua traffic lainnya

### **4. Address List**
- `isolir-users`: 192.168.200.0/24

## 🔄 Cara Kerja

### **Alur User Terisolir:**
1. **User PPPoE** mendapat IP dari range 192.168.200.0/24
2. **DNS Query** untuk domain apapun diarahkan ke 192.168.8.89
3. **HTTP/HTTPS Request** di-redirect ke 192.168.8.89:3003
4. **Aplikasi Lokal** menampilkan halaman isolir
5. **Traffic lainnya** di-block

### **Contoh:**
```
User akses: google.com
↓
DNS resolve: 192.168.8.89
↓
HTTP request: 192.168.8.89:3003
↓
Aplikasi Lokal: Halaman isolir
```

## 🛠️ Troubleshooting

### **1. User Masih Bisa Akses Internet**
```bash
# Cek firewall rules
/ip firewall filter print where comment~"isolir"

# Cek NAT rules
/ip firewall nat print where comment~"isolir"
```

### **2. Halaman Isolir Tidak Muncul**
```bash
# Cek DNS static
/ip dns static print where name~"alijaya.gantiwifi.online"

# Cek aplikasi berjalan di 192.168.8.89:3003
ping 192.168.8.89
telnet 192.168.8.89 3003
```

### **3. Aplikasi Lokal Tidak Bisa Diakses**
```bash
# Cek koneksi ke aplikasi lokal
ping 192.168.8.89

# Cek port 3003
telnet 192.168.8.89 3003

# Cek aplikasi berjalan
netstat -tlnp | grep 3003
```

## 🗑️ Menghapus Konfigurasi

### **Jalankan Script Remove:**
```bash
# Upload script remove
scp scripts/mikrotik-isolir-local-remove.rsc admin@192.168.8.1:/tmp/

# Jalankan script
/import file-name=mikrotik-isolir-local-remove.rsc
```

### **Manual Remove:**
```bash
# Hapus DNS static
/ip dns static remove [find where name~"alijaya.gantiwifi.online" and address="192.168.8.89"]

# Hapus NAT rules
/ip firewall nat remove [find where comment~"isolir"]

# Hapus firewall rules
/ip firewall filter remove [find where comment~"isolir"]

# Hapus address list
/ip firewall address-list remove [find where list="isolir-users"]
```

## 📝 Catatan Penting

### **1. Aplikasi Lokal**
- Pastikan aplikasi berjalan di `192.168.8.89:3003`
- Pastikan halaman isolir tersedia di `/isolir`
- Pastikan aplikasi bisa diakses dari Mikrotik

### **2. Network Connectivity**
- Pastikan Mikrotik bisa ping ke `192.168.8.89`
- Pastikan port 3003 terbuka di aplikasi lokal
- Pastikan tidak ada firewall yang memblokir

### **3. IP Range**
- Sesuaikan IP range isolir dengan konfigurasi Anda
- Default: 192.168.200.0/24

## 🧪 Testing

### **1. Test Konfigurasi:**
```bash
# Upload script test
scp scripts/test-isolir-local-config.rsc admin@192.168.8.1:/tmp/

# Jalankan test
/import file-name=test-isolir-local-config.rsc
```

### **2. Test Manual:**
```bash
# Test ping ke aplikasi lokal
ping 192.168.8.89

# Test koneksi ke port 3003
telnet 192.168.8.89 3003

# Test dari user terisolir
# User terisolir akses: google.com
# Harus redirect ke: 192.168.8.89:3003/isolir
```

## 🎯 Hasil Akhir

Setelah script dijalankan:
- ✅ User PPPoE terisolir hanya bisa akses aplikasi lokal
- ✅ Semua domain diarahkan ke aplikasi lokal
- ✅ Traffic lainnya di-block
- ✅ DNS queries diarahkan ke aplikasi lokal
- ✅ Halaman isolir ditampilkan dari aplikasi lokal

## 📋 Checklist

### **Sebelum Setup:**
- [ ] Aplikasi berjalan di 192.168.8.89:3003
- [ ] Halaman isolir tersedia di /isolir
- [ ] Mikrotik bisa ping ke 192.168.8.89
- [ ] Port 3003 terbuka di aplikasi lokal

### **Setelah Setup:**
- [ ] DNS static rules terkonfigurasi
- [ ] NAT rules terkonfigurasi
- [ ] Firewall rules terkonfigurasi
- [ ] Address list terkonfigurasi
- [ ] Test dari user terisolir berhasil

---

**Script Mikrotik untuk aplikasi lokal siap digunakan!** 🚀
