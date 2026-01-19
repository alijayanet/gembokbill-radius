# Panduan Deployment Gembok Bill

Dokumen ini menjelaskan cara melakukan deployment aplikasi Gembok Bill di server baru dengan data fresh.

## Prasyarat

- Node.js >= 14.0.0
- npm >= 6.0.0
- Akses ke database SQLite (untuk development) atau MySQL (untuk production)
- Akses ke WhatsApp Business (untuk fitur WhatsApp Gateway)

## Struktur Project

```
gembok-bill/
├── app.js                  # Entry point aplikasi
├── package.json            # Dependensi dan script
├── config/                 # File konfigurasi
├── data/                   # File database dan backup
├── migrations/             # File migrasi database
├── public/                 # File statis
├── routes/                 # Endpoint API
├── scripts/                # Script utilitas
├── utils/                  # Fungsi utilitas
└── views/                  # Template EJS
```

## Instalasi di Server Baru

### 1. Clone Repository

```bash
git clone <url-repository-anda>
cd gembok-bill
```

### 2. Instal Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment

Salin file [.env.example](file:///e:/gembok-bill211025/.env.example) ke .env:

```bash
cp .env.example .env
```

Edit file .env dengan konfigurasi yang sesuai untuk lingkungan Anda:

```bash
# Database
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=gembok_bill

# WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp-session
ADMIN_NUMBER=6281234567890

# Mikrotik
MIKROTIK_HOST=192.168.1.1
MIKROTIK_USER=admin
MIKROTIK_PASSWORD=password

# GenieACS
GENIEACS_URL=http://localhost:7557
GENIEACS_USERNAME=admin
GENIEACS_PASSWORD=password
```

### 4. Inisialisasi Database

Jalankan script setup untuk menginisialisasi database:

```bash
npm run setup
```

Script ini akan:
1. Menjalankan semua file migrasi di folder [migrations/](file:///e:/gembok-bill211025/migrations)
2. Membuat struktur tabel yang diperlukan
3. Membuat data awal yang diperlukan

### 5. Jalankan Migrasi Tambahan (Jika Diperlukan)

Jika terjadi error terkait struktur database setelah setup, jalankan migrasi SQL secara manual:

```bash
npm run run-sql-migrations
```

### 6. Jalankan Aplikasi

Untuk production:
```bash
npm start
```

Untuk development (dengan auto-reload):
```bash
npm run dev
```

## Konfigurasi WhatsApp

1. Setelah aplikasi berjalan, akan muncul QR code di terminal
2. Scan QR code tersebut dengan WhatsApp yang akan digunakan sebagai bot
3. Setelah terhubung, bot akan siap digunakan

## Migrasi Data (Jika Diperlukan)

Jika Anda memiliki data dari sistem lama, Anda dapat menggunakan file migrasi di folder [data/backup/](file:///e:/gembok-bill211025/data/backup/) untuk mengimpor data.

## Update dan Maintenance

Untuk mengupdate aplikasi:
```bash
git pull
npm install
```

Untuk menjalankan migrasi database terbaru:
```bash
npm run run-sql-migrations
```

## Troubleshooting

### Masalah Koneksi WhatsApp

Jika mengalami masalah koneksi WhatsApp:
1. Pastikan nomor WhatsApp yang digunakan belum terdaftar di device lain
2. Hapus folder sesi WhatsApp: `rm -rf ./whatsapp-session`
3. Restart aplikasi dan scan ulang QR code

### Masalah Database

Jika mengalami masalah database:
1. Periksa file .env untuk konfigurasi database yang benar
2. Pastikan database service sedang berjalan
3. Jalankan migrasi database: `npm run run-sql-migrations`
4. Periksa log aplikasi untuk detail error

### Error "no such column"

Jika muncul error seperti "SQLITE_ERROR: no such column: invoice_type", ini berarti struktur database belum diperbarui. Jalankan:

```bash
npm run run-sql-migrations
```

## Keamanan

- Jangan pernah menyertakan file .env di repository
- Gunakan password yang kuat untuk semua layanan
- Batasi akses ke server hanya untuk user yang terpercaya
- Lakukan backup database secara berkala

## Support

Untuk bantuan lebih lanjut, silakan hubungi tim pengembang atau buat issue di repository GitHub.