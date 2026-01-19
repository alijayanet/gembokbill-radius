# FreeRADIUS Setup Guide for Gembok Bill

## 📋 Overview

FreeRADIUS adalah server RADIUS open-source yang powerful untuk otentikasi, otorisasi, dan akuntansi (AAA). Integrasi ini memungkinkan Gembok Bill untuk mengelola otentikasi terpusat untuk PPPoE, Hotspot, dan layanan jaringan lainnya.

## ✨ Fitur

- ✅ Otentikasi terpusat untuk semua user
- ✅ Integrasi langsung dengan database Gembok Bill
- ✅ Manajemen user melalui admin panel
- ✅ Sinkronisasi otomatis customer ke RADIUS
- ✅ Profile bandwidth yang dapat dikustomisasi
- ✅ Accounting dan logging session
- ✅ Dukungan untuk multiple NAS (Network Access Server)

## 🔧 Prasyarat

- Ubuntu 20.04+ atau Debian 10+
- Node.js >= 20.0.0
- MySQL/MariaDB
- Akses root/sudo
- Gembok Bill sudah terinstall

## 📦 Instalasi

### 1. Jalankan Skrip Instalasi

Skrip instalasi otomatis akan menginstall dan mengkonfigurasi FreeRADIUS:

```bash
cd /path/to/gembok-bill
chmod +x install-freeradius.sh
sudo ./install-freeradius.sh
```

Skrip ini akan:
- Install FreeRADIUS dan dependencies
- Konfigurasi SQL module untuk MySQL
- Setup database RADIUS
- Konfigurasi clients untuk Mikrotik
- Start dan enable service

### 2. Konfigurasi settings.json

Pastikan konfigurasi RADIUS sudah benar di `settings.json`:

```json
{
  "radius_host": "localhost",
  "radius_user": "radius",
  "radius_password": "radpassword",
  "radius_database": "radius"
}
```

### 3. Jalankan Database Migration

Tambahkan tabel integrasi RADIUS ke database Gembok Bill:

```bash
node scripts/run-sql-migrations.js
```

Atau jalankan migration manual:

```bash
sqlite3 data/billing.db < migrations/create_radius_integration.sql
```

Untuk MySQL:

```bash
mysql -u root -p gembok_bill < migrations/create_radius_integration.sql
```

## 🔌 Konfigurasi Mikrotik

### 1. Setup RADIUS Client di Mikrotik

Buka Winbox/SSH ke Mikrotik dan jalankan perintah berikut:

```mikrotik
/radius
add address=192.168.8.89 secret=mikrotik_secret service=ppp,hotspot

/ppp aaa
use-radius=yes
```

Ganti `192.168.8.89` dengan IP server Gembok Bill.

### 2. Konfigurasi PPPoE untuk menggunakan RADIUS

```mikrotik
/ppp profile
set default use-radius=yes
```

### 3. Konfigurasi Hotspot untuk menggunakan RADIUS

```mikrotik
/ip hotspot profile
set default use-radius=yes
```

## 🎯 Penggunaan

### Akses Dashboard RADIUS

Buka browser dan akses:

```
http://localhost:4555/admin/radius
```

### Menambah User RADIUS

1. Buka dashboard RADIUS
2. Klik tombol "Add User"
3. Isi form:
   - **Username**: Nama user RADIUS
   - **Password**: Password user
   - **Framed-IP-Address** (opsional): IP statis
   - **Framed-Pool** (opsional): IP pool
4. Klik "Add User"

### Sinkronisasi Customer ke RADIUS

#### Sinkronisasi Satu Customer

1. Edit customer di admin panel
2. Enable "RADIUS Enabled"
3. Set "RADIUS Username" dan "RADIUS Password"
4. Klik "Sync to RADIUS"

#### Sinkronisasi Semua Customer

1. Buka dashboard RADIUS
2. Klik tombol "Sync All Customers"
3. Konfirmasi sinkronisasi

### Membuat Profile Bandwidth

1. Buka dashboard RADIUS
2. Scroll ke bagian "RADIUS Profiles"
3. Klik "Add Profile"
4. Isi form:
   - **Profile Name**: Nama profile
   - **Download Speed**: Kecepatan download (misal: 10M)
   - **Upload Speed**: Kecepatan upload (misal: 10M)
   - **Rate Limit**: Limit rate (opsional)
   - **Burst Limit**: Limit burst (opsional)
   - **Priority**: Prioritas (1 = tertinggi)
5. Klik "Add Profile"

### Test Koneksi RADIUS

1. Buka dashboard RADIUS
2. Klik tombol "Test Connection"
3. Status akan ditampilkan:
   - ✅ **Connected**: Koneksi berhasil
   - ❌ **Disconnected**: Koneksi gagal

## 🔍 Monitoring dan Debugging

### Cek Status Service

```bash
systemctl status freeradius
```

### Restart Service

```bash
systemctl restart freeradius
```

### Debug Mode

Untuk debugging detail, jalankan FreeRADIUS dalam mode debug:

```bash
systemctl stop freeradius
freeradius -X
```

### Lihat Logs

```bash
journalctl -u freeradius -n 100
```

### Test dengan radtest

```bash
radtest testing123 testing123 localhost 0 testing123
```

## 📊 API Endpoints

Berikut adalah API endpoints yang tersedia untuk integrasi:

### User Management

- `GET /admin/radius/users` - List semua user RADIUS
- `GET /admin/radius/users/:username` - Detail user
- `POST /admin/radius/users` - Tambah user baru
- `PUT /admin/radius/users/:username` - Update user
- `DELETE /admin/radius/users/:username` - Hapus user

### Group Management

- `GET /admin/radius/groups` - List semua group
- `POST /admin/radius/groups` - Tambah group baru
- `POST /admin/radius/users/:username/groups` - Tambah user ke group

### Accounting

- `GET /admin/radius/accounting` - List semua session
- `GET /admin/radius/accounting?username=X` - Session user tertentu

### Profiles

- `GET /admin/radius/profiles` - List semua profile
- `POST /admin/radius/profiles` - Tambah profile baru

### Sync

- `POST /admin/radius/sync-customer/:customerId` - Sync customer ke RADIUS
- `POST /admin/radius/sync-all-customers` - Sync semua customer

## 🔐 Security Best Practices

### 1. Ganti Default Secret

Ubah secret RADIUS di `/etc/freeradius/3.0/clients.conf`:

```conf
client mikrotik {
    ipaddr = 192.168.8.1
    secret = GANTI_DENGAN_SECRET_AMAN
}
```

### 2. Gunakan Password yang Kuat

Pastikan password RADIUS user menggunakan kombinasi:
- Huruf besar dan kecil
- Angka
- Simbol khusus
- Minimal 12 karakter

### 3. Limit Access

Konfigurasi firewall untuk hanya mengizinkan IP tertentu:

```bash
ufw allow from 192.168.8.1 to any port 1812 proto udp
ufw allow from 192.168.8.1 to any port 1813 proto udp
```

### 4. Enable Logging Pasti

Pastikan logging aktif untuk audit trail:

```conf
log {
    destination = files
    file = ${logdir}/radius.log
    syslog_facility = daemon
    stripped_names = no
    auth = yes
    auth_badpass = yes
    auth_goodpass = yes
}
```

## 🐛 Troubleshooting

### User tidak bisa login

1. Cek koneksi database:
   ```bash
   mysql -u radius -p radius
   ```

2. Verifikasi user di database:
   ```sql
   SELECT * FROM radcheck WHERE username = 'username';
   ```

3. Test dengan radtest:
   ```bash
   radtest username password localhost 0 testing123
   ```

### Koneksi gagal

1. Cek status FreeRADIUS:
   ```bash
   systemctl status freeradius
   ```

2. Cek firewall:
   ```bash
   ufw status
   ```

3. Test koneksi database:
   ```bash
   mysql -h localhost -u radius -p radius
   ```

### Sinkronisasi gagal

1. Cek settings.json
2. Pastikan MySQL credentials benar
3. Cek logs aplikasi:
   ```bash
   tail -f logs/app.log
   ```

## 📚 Referensi

- [FreeRADIUS Documentation](https://freeradius.org/documentation/)
- [Mikrotik RADIUS Client](https://wiki.mikrotik.com/wiki/Manual:RADIUS_Client)
- [Gembok Bill Documentation](README.md)

## 🆘 Support

Jika mengalami masalah:
1. Cek logs FreeRADIUS dan aplikasi
2. Verifikasi konfigurasi database
3. Test koneksi dengan radtest
4. Buat issue di GitHub repository

## 📝 Changelog

### v1.0.0 (2025-01-19)
- Initial release
- Basic RADIUS integration
- User management
- Profile management
- Accounting support
- Customer sync feature
