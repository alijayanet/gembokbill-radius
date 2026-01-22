# Panduan Instalasi Server Baru - Gembok Bill (MySQL)

Dokumen ini menjelaskan cara menginstall aplikasi Gembok Bill dengan database MySQL di server baru.

## Prasyarat

- **OS**: Ubuntu 20.04+ / Debian 10+ / CentOS 7+
- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **MySQL**: >= 5.7 atau MariaDB >= 10.3
- **RAM**: Minimal 2GB (recommended 4GB+)
- **Disk**: Minimal 20GB

## 1. Persiapan Server

### Update System

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### Install Node.js & npm

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verifikasi
node --version
npm --version
```

### Install MySQL Server

```bash
# Ubuntu/Debian
sudo apt install -y mysql-server mysql-client

# CentOS/RHEL
sudo yum install -y mysql-server mysql

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL (opsional)
sudo mysql_secure_installation
```

### Install Git

```bash
# Ubuntu/Debian
sudo apt install -y git

# CentOS/RHEL
sudo yum install -y git
```

## 2. Clone Repository

```bash
# Clone dari repository
git clone <url-repository-anda>
cd gembok-bill

# ATAU upload file jika tidak punya git
# Upload semua file ke server via SCP/SFTP
```

## 3. Setup Database MySQL

### Buat Database & User

```bash
# Login ke MySQL
sudo mysql -u root

# Jalankan perintah berikut di MySQL console
```

```sql
-- Buat database
CREATE DATABASE gembok_bill CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user database (ganti password dengan password yang kuat)
CREATE USER 'gembokbill'@'localhost' IDENTIFIED BY 'GantiDenganPasswordYangKuat123!';

-- Berikan hak akses
GRANT ALL PRIVILEGES ON gembok_bill.* TO 'gembokbill'@'localhost';
FLUSH PRIVILEGES;

-- Exit
exit;
```

### Verifikasi Koneksi

```bash
mysql -u gembokbill -p gembok_bill
```

## 4. Install Dependensi Node.js

```bash
# Install semua dependensi
npm install

# Install PM2 untuk process management (opsional tapi recommended)
sudo npm install -g pm2
```

## 5. Konfigurasi Aplikasi

### Copy File Konfigurasi

```bash
# Copy template settings
cp settings.server.template.json settings.json

# ATAU copy dari example
cp settings.json.example settings.json
```

### Edit settings.json

```bash
nano settings.json
```

Update konfigurasi berikut:

```json
{
  "db_type": "mysql",
  "db_host": "localhost",
  "db_user": "gembokbill",
  "db_password": "GantiDenganPasswordYangKuat123!",
  "db_name": "gembok_bill",
  
  "radius_host": "localhost",
  "radius_user": "radius",
  "radius_password": "radpassword",
  
  "whatsapp_enabled": false,
  "whatsapp_session_path": "./whatsapp-session",
  "admin_number": "6281234567890",
  
  "mikrotik_host": "192.168.1.1",
  "mikrotik_user": "admin",
  "mikrotik_password": "password",
  
  "port": 3000,
  "host": "0.0.0.0"
}
```

## 6. Inisialisasi Database

### Opsi 1: Gunakan Script Setup Otomatis (Recommended)

```bash
# Jalankan script setup database MySQL
node scripts/new-server-setup-mysql.js

# ATAU gunakan script komprehensif
node migrate-to-mysql-comprehensive.js
```

Script ini akan:
1. Membuat semua tabel yang diperlukan
2. Menambahkan AUTO_INCREMENT pada kolom id
3. Membuat indeks untuk performa
4. Insert data awal (admin user, packages, dll)
5. Setup default settings

### Opsi 2: Setup Manual

Jika ingin setup manual, jalankan migrasi SQL:

```bash
# Jalankan semua migrasi SQL
node scripts/run-sql-migrations.js
```

## 7. Jalankan Aplikasi

### Mode Development (dengan auto-reload)

```bash
npm run dev
```

### Mode Production

```bash
# Start aplikasi
npm start

# ATAU gunakan PM2 (recommended untuk production)
pm2 start app.js --name "gembokbill"
pm2 save
pm2 startup
```

## 8. Verifikasi Instalasi

### Cek Status Server

```bash
# Cek apakah server berjalan
curl http://localhost:3000

# ATAU cek logs
pm2 logs gembokbill
```

### Akses Web Interface

Buka browser dan akses:
- **Admin Dashboard**: http://your-server-ip:3000
- **Technician Portal**: http://your-server-ip:3000/technician
- **Collector Portal**: http://your-server-ip:3000/collector

### Login Default

- **Username**: admin
- **Password**: admin123 (ubah segera setelah login)

## 9. Konfigurasi Tambahan

### Setup WhatsApp (Opsional)

Jika ingin menggunakan fitur WhatsApp Gateway:

1. Update settings.json:
```json
"whatsapp_enabled": true,
"admin_number": "6281234567890"
```

2. Restart aplikasi
3. Scan QR code yang muncul di terminal
4. WhatsApp bot akan aktif

### Setup Mikrotik

1. Update settings.json dengan konfigurasi Mikrotik
2. Pastikan Mikrotik API diaktifkan
3. Test koneksi Mikrotik dari aplikasi

### Setup FreeRADIUS (Opsional)

**Opsi 1: Gunakan installer otomatis (Recommended)**

```bash
# Jalankan installer FreeRADIUS
sudo bash install-freeradius.sh
```

Installer ini akan:
- Install FreeRADIUS
- Konfigurasi otomatis
- Setup database connection
- Test koneksi

**Opsi 2: Install manual**

```bash
# Install FreeRADIUS
sudo apt install -y freeradius

# Copy konfigurasi
sudo cp config/freeradius/* /etc/freeradius/3.0/

# Restart FreeRADIUS
sudo systemctl restart freeradius
sudo systemctl enable freeradius
```

## 10. Firewall & Security

### Setup Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Gembok Bill
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

### Security Best Practices

1. **Ganti password default admin** segera setelah login pertama
2. **Gunakan HTTPS** di production dengan Let's Encrypt
3. **Backup database** secara berkala:
   ```bash
   # Backup database
   mysqldump -u gembokbill -p gembokbill > backup_$(date +%Y%m%d).sql
   
   # Restore database
   mysql -u gembokbill -p gembokbill < backup_20240122.sql
   ```
4. **Monitor logs** untuk error dan suspicious activity
5. **Update aplikasi** secara berkala

## 11. Troubleshooting

### Error: ECONNREFUSED saat koneksi MySQL

```bash
# Cek apakah MySQL berjalan
sudo systemctl status mysql

# Cek log MySQL
sudo tail -f /var/log/mysql/error.log

# Restart MySQL
sudo systemctl restart mysql
```

### Error: "Field 'id' doesn't have a default value"

Jalankan perintah ini untuk menambah AUTO_INCREMENT:

```bash
mysql -u gembokbill -p gembokbill << 'EOF'
ALTER TABLE technician_sessions MODIFY COLUMN id INT AUTO_INCREMENT;
ALTER TABLE technician_activities MODIFY COLUMN id INT AUTO_INCREMENT;
EOF
```

### Error: "Incorrect datetime value"

Pastikan format datetime menggunakan format MySQL:
- Salah: `'2026-01-23T06:11:21.742Z'`
- Benar: `'2026-01-23 06:11:21'`

### Aplikasi tidak bisa start

```bash
# Cek logs
pm2 logs gembokbill

# Restart aplikasi
pm2 restart gembokbill

# Cek port yang digunakan
sudo netstat -tlnp | grep 3000
```

### WhatsApp tidak bisa connect

```bash
# Hapus session WhatsApp
rm -rf ./whatsapp-session

# Restart aplikasi
pm2 restart gembokbill

# Scan ulang QR code
```

## 12. Maintenance

### Update Aplikasi

```bash
# Pull latest code
git pull

# Install dependensi baru
npm install

# Restart aplikasi
pm2 restart gembokbill
```

### Backup Database

Buat script backup otomatis:

```bash
# Buat script backup
cat > /home/backup-gembokbill.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/backups/gembokbill"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u gembokbill -pPASSWORD gembokbill > $BACKUP_DIR/gembokbill_$DATE.sql
# Hapus backup lebih dari 7 hari
find $BACKUP_DIR -name "gembokbill_*.sql" -mtime +7 -delete
EOF

# Jadwalkan backup harian (jam 2 pagi)
chmod +x /home/backup-gembokbill.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /home/backup-gembokbill.sh") | crontab -
```

### Monitoring

Gunakan PM2 untuk monitoring:

```bash
# Monitoring real-time
pm2 monit

# Cek resource usage
pm2 show gembokbill

# Cek logs
pm2 logs gembokbill --lines 100
```

## 13. Support

Untuk bantuan lebih lanjut:
- Cek logs aplikasi: `pm2 logs gembokbill`
- Cek logs database: `/var/log/mysql/error.log`
- Buat issue di repository GitHub
- Hubungi tim pengembang

---

**Catatan:**
- Pastikan server memiliki resource yang cukup (RAM, CPU, Disk)
- Gunakan password yang kuat untuk database dan aplikasi
- Lakukan backup secara berkala
- Monitor aplikasi dan database secara rutin
