# 🌐 Panduan Tunneling untuk Menu Isolir Mikrotik

## 📋 Overview

Script generator menu isolir Mikrotik sekarang mendukung **tunneling** dan **akses port langsung** untuk mengarahkan pelanggan yang diisolir ke halaman isolir.

## 🔧 Konfigurasi

### 📝 Form Input Baru

| Field | Deskripsi | Contoh |
|-------|-----------|--------|
| **IP PPPoE Aktif** | IP gateway aktif | `192.168.1.1` |
| **IP PPPoE Isolir** | IP untuk pelanggan diisolir | `192.168.1.2` |
| **Domain Halaman Isolir** | Domain aplikasi | `alijaya.gentiwifi.online` |
| **Path Halaman Isolir** | Path ke halaman isolir | `/isolir` |
| **Port Halaman Isolir** | Port aplikasi (opsional) | `3000` |
| **Jenis Akses** | Tunneling atau Port Langsung | `Tunneling` |

### 🌐 Jenis Akses

#### 1. **Tunneling (Domain + Path)**
- **URL**: `alijaya.gentiwifi.online/isolir`
- **Port**: Tidak diperlukan (menggunakan port 80/443)
- **Firewall Rules**: Redirect ke port 80/443
- **Cocok untuk**: Aplikasi dengan tunneling (Cloudflare, ngrok, dll)

#### 2. **Port Langsung**
- **URL**: `domain.com:3000/isolir`
- **Port**: Wajib diisi
- **Firewall Rules**: Redirect ke port custom
- **Cocok untuk**: Aplikasi dengan port langsung

## 📡 Script Mikrotik yang Dihasilkan

### 🔧 Untuk Tunneling

```bash
# Script Menu Isolir Mikrotik
# Generated on: 2024-01-15 10:30:00
# IP PPPoE Aktif: 192.168.1.1
# IP PPPoE Isolir: 192.168.1.2
# URL Halaman Isolir: alijaya.gentiwifi.online/isolir
# Jenis Akses: Tunneling

# Buat profile isolir jika belum ada
/ppp profile add name="isolir" local-address=192.168.1.2 remote-address=192.168.1.2 \
    rate-limit="0/0" comment="Profile untuk pelanggan yang diisolir"

# Hotspot profile untuk isolir
/ip hotspot profile add name="isolir" session-timeout=none \
    keepalive-timeout=2m status-autorefresh=1m \
    http-proxy=0.0.0.0 transparent-proxy=no \
    use-radius=no nas-port-type=wireless-802.11 \
    nas-port-id="isolir" \
    login-by=http-chap,http-pap mac-cookie-timeout=3d

# Firewall rules untuk redirect ke halaman isolir (tunneling)
# Redirect HTTP ke halaman isolir untuk user yang diisolir
/ip firewall nat add chain=dstnat dst-port=80 protocol=tcp \
    src-address=192.168.1.2/32 action=dst-nat to-addresses=alijaya.gentiwifi.online \
    to-ports=80 comment="Redirect isolir ke halaman isolir (tunneling)"

# Redirect HTTPS juga jika diperlukan
/ip firewall nat add chain=dstnat dst-port=443 protocol=tcp \
    src-address=192.168.1.2/32 action=dst-nat to-addresses=alijaya.gentiwifi.online \
    to-ports=443 comment="Redirect isolir HTTPS ke halaman isolir (tunneling)"
```

### 🔧 Untuk Port Langsung

```bash
# Script Menu Isolir Mikrotik
# Generated on: 2024-01-15 10:30:00
# IP PPPoE Aktif: 192.168.1.1
# IP PPPoE Isolir: 192.168.1.2
# URL Halaman Isolir: domain.com:3000/isolir
# Jenis Akses: Port Langsung

# Buat profile isolir jika belum ada
/ppp profile add name="isolir" local-address=192.168.1.2 remote-address=192.168.1.2 \
    rate-limit="0/0" comment="Profile untuk pelanggan yang diisolir"

# Hotspot profile untuk isolir
/ip hotspot profile add name="isolir" session-timeout=none \
    keepalive-timeout=2m status-autorefresh=1m \
    http-proxy=0.0.0.0 transparent-proxy=no \
    use-radius=no nas-port-type=wireless-802.11 \
    nas-port-id="isolir" \
    login-by=http-chap,http-pap mac-cookie-timeout=3d

# Firewall rules untuk redirect ke halaman isolir (port langsung)
# Redirect HTTP ke halaman isolir untuk user yang diisolir
/ip firewall nat add chain=dstnat dst-port=80 protocol=tcp \
    src-address=192.168.1.2/32 action=dst-nat to-addresses=domain.com \
    to-ports=3000 comment="Redirect isolir ke halaman isolir (port langsung)"

# Redirect HTTPS juga jika diperlukan
/ip firewall nat add chain=dstnat dst-port=443 protocol=tcp \
    src-address=192.168.1.2/32 action=dst-nat to-addresses=domain.com \
    to-ports=3000 comment="Redirect isolir HTTPS ke halaman isolir (port langsung)"
```

## 🚀 Cara Penggunaan

### 1. **Konfigurasi Tunneling**
```
Domain: alijaya.gentiwifi.online
Path: /isolir
Jenis Akses: Tunneling (Domain + Path)
Port: (kosongkan)
```

### 2. **Konfigurasi Port Langsung**
```
Domain: domain.com
Path: /isolir
Jenis Akses: Port Langsung
Port: 3000
```

### 3. **Generate dan Jalankan Script**
1. Klik **"Generate Script"**
2. Copy script yang dihasilkan
3. Paste di terminal Mikrotik
4. Jalankan script

### 4. **Isolir Pelanggan**
```bash
# Mengisolir pelanggan
/ppp secret set [find name="username_pelanggan"] profile=isolir

# Restore pelanggan
/ppp secret set [find name="username_pelanggan"] profile=default
```

## 🔍 Perbedaan Tunneling vs Port Langsung

| Aspek | Tunneling | Port Langsung |
|-------|-----------|---------------|
| **URL** | `domain.com/isolir` | `domain.com:3000/isolir` |
| **Port** | 80/443 (default) | Custom port |
| **Firewall Rules** | Redirect ke port 80/443 | Redirect ke port custom |
| **Cocok untuk** | Cloudflare, ngrok, dll | Aplikasi langsung |
| **Keamanan** | Lebih aman (HTTPS) | Tergantung konfigurasi |

## 🛡️ Keamanan

### ✅ **Tunneling (Recommended)**
- Menggunakan port 80/443 standar
- Lebih aman dengan HTTPS
- Cocok untuk production
- Mudah di-cache oleh CDN

### ⚠️ **Port Langsung**
- Menggunakan port custom
- Perlu konfigurasi firewall tambahan
- Cocok untuk development/testing
- Perlu expose port ke internet

## 📱 Testing

### 1. **Test Tunneling**
```bash
# Test HTTP redirect
curl -I http://alijaya.gentiwifi.online/isolir

# Test HTTPS redirect
curl -I https://alijaya.gentiwifi.online/isolir
```

### 2. **Test Port Langsung**
```bash
# Test HTTP redirect
curl -I http://domain.com:3000/isolir

# Test HTTPS redirect
curl -I https://domain.com:3000/isolir
```

## 🔧 Troubleshooting

### ❌ **Masalah Umum**

1. **Pelanggan tidak redirect ke halaman isolir**
   - Cek firewall rules di Mikrotik
   - Pastikan domain dapat diakses
   - Cek DNS resolution

2. **Halaman isolir tidak muncul**
   - Pastikan aplikasi berjalan
   - Cek konfigurasi tunneling
   - Test akses langsung ke URL

3. **Script tidak berjalan**
   - Cek syntax Mikrotik
   - Pastikan tidak ada typo
   - Jalankan per command

### ✅ **Solusi**

1. **Debug Firewall Rules**
   ```bash
   # Cek rules yang aktif
   /ip firewall nat print
   
   # Test rule specific
   /ip firewall nat print where comment~"isolir"
   ```

2. **Test Connectivity**
   ```bash
   # Test dari Mikrotik
   /tool ping alijaya.gentiwifi.online
   
   # Test port
   /tool telnet alijaya.gentiwifi.online 80
   ```

3. **Reset dan Reapply**
   ```bash
   # Hapus rules lama
   /ip firewall nat remove [find comment~"isolir"]
   
   # Jalankan script baru
   # (paste script yang di-generate)
   ```

## 📊 Monitoring

### 📈 **Log Monitoring**
```bash
# Cek log isolir
/log print where message~"isolir"

# Cek log pelanggan
/log print where message~"username_pelanggan"
```

### 🔍 **Status Check**
```bash
# Cek profile isolir
/ppp profile print where name="isolir"

# Cek pelanggan yang diisolir
/ppp secret print where profile="isolir"
```

## 🎯 Best Practices

### ✅ **Rekomendasi**

1. **Gunakan Tunneling** untuk production
2. **Test script** di environment development dulu
3. **Backup konfigurasi** Mikrotik sebelum apply
4. **Monitor log** untuk troubleshooting
5. **Update script** jika ada perubahan domain

### ⚠️ **Perhatian**

1. **Jangan expose port** yang tidak perlu
2. **Gunakan HTTPS** untuk keamanan
3. **Test thoroughly** sebelum production
4. **Monitor performance** setelah implementasi

---

**Script generator menu isolir Mikrotik dengan dukungan tunneling sudah siap digunakan!** 🎉🌐✨
