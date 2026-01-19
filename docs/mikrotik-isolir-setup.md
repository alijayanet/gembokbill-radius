# Setup Mikrotik untuk User PPPoE Terisolir

## 📋 Overview

Script ini akan mengatur Mikrotik agar user PPPoE yang terisolir (IP 192.168.200.0/24) selalu diarahkan ke halaman isolir aplikasi.

## 🔧 Konfigurasi

### **IP Range:**
- **PPPoE Aktif**: 192.168.10.1/24
- **PPPoE Isolir**: 192.168.200.1/24
- **Halaman Isolir**: https://alijaya.gantiwifi.online/isolir

## 🚀 Cara Penggunaan

### **1. Upload Script ke Mikrotik**

```bash
# Upload script ke Mikrotik
scp scripts/mikrotik-isolir-setup.rsc admin@192.168.8.1:/tmp/

# Atau copy-paste script ke terminal Mikrotik
```

### **2. Jalankan Script**

```bash
# Login ke Mikrotik
ssh admin@192.168.8.1

# Jalankan script
/import file-name=mikrotik-isolir-setup.rsc
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
- `alijaya.gantiwifi.online` → `192.168.200.1`
- `localhost` → `192.168.200.1`

### **2. NAT Rules**
- Redirect HTTP (port 80) → port 3003
- Redirect HTTPS (port 443) → port 3003

### **3. Firewall Rules**
- Allow DNS queries
- Allow HTTP/HTTPS ke server aplikasi
- Block semua traffic lainnya

### **4. Address List**
- `isolir-users`: 192.168.200.0/24

### **5. Mangle Rules**
- Mark connection: `isolir-conn`
- Mark packet: `isolir-packet`

### **6. Queue Tree**
- Bandwidth limit: 1k/1k untuk user isolir

### **7. Web Proxy (Opsional)**
- Port: 8080
- Block semua kecuali halaman isolir

## 🔄 Cara Kerja

### **Alur User Terisolir:**
1. **User PPPoE** mendapat IP dari range 192.168.200.0/24
2. **DNS Query** untuk domain apapun diarahkan ke 192.168.200.1
3. **HTTP/HTTPS Request** di-redirect ke port 3003
4. **Aplikasi** menampilkan halaman isolir
5. **Traffic lainnya** di-block

### **Contoh:**
```
User akses: google.com
↓
DNS resolve: 192.168.200.1
↓
HTTP request: 192.168.200.1:3003
↓
Aplikasi: Halaman isolir
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

# Cek aplikasi berjalan di port 3003
netstat -tlnp | grep 3003
```

### **3. Bandwidth Tidak Terbatas**
```bash
# Cek queue tree
/queue tree print where name~"isolir"

# Cek mangle rules
/ip firewall mangle print where comment~"isolir"
```

## 🗑️ Menghapus Konfigurasi

### **Jalankan Script Remove:**
```bash
# Upload script remove
scp scripts/mikrotik-isolir-remove.rsc admin@192.168.8.1:/tmp/

# Jalankan script
/import file-name=mikrotik-isolir-remove.rsc
```

### **Manual Remove:**
```bash
# Hapus DNS static
/ip dns static remove [find where name~"alijaya.gantiwifi.online"]

# Hapus NAT rules
/ip firewall nat remove [find where comment~"isolir"]

# Hapus firewall rules
/ip firewall filter remove [find where comment~"isolir"]

# Hapus address list
/ip firewall address-list remove [find where list="isolir-users"]

# Hapus mangle rules
/ip firewall mangle remove [find where comment~"isolir"]

# Hapus queue tree
/queue tree remove [find where name~"isolir"]
```

## 📝 Catatan Penting

### **1. Port Aplikasi**
- Pastikan aplikasi berjalan di port 3003
- Jika port berbeda, edit script sesuai kebutuhan

### **2. Domain**
- Ganti `alijaya.gantiwifi.online` dengan domain Anda
- Atau gunakan IP langsung jika tidak ada domain

### **3. IP Range**
- Sesuaikan IP range isolir dengan konfigurasi Anda
- Default: 192.168.200.0/24

### **4. Bandwidth Limit**
- Default: 1k/1k
- Sesuaikan dengan kebutuhan

## 🎯 Hasil Akhir

Setelah script dijalankan:
- ✅ User PPPoE terisolir hanya bisa akses halaman isolir
- ✅ Semua domain diarahkan ke halaman isolir
- ✅ Bandwidth dibatasi 1k/1k
- ✅ Traffic lainnya di-block
- ✅ DNS queries diarahkan ke server aplikasi

---

**Script Mikrotik siap digunakan!** 🚀
