# Data Management untuk Gembok Bill

## Struktur Database

Database menggunakan SQLite dan struktur tabel didefinisikan dalam file migrasi di folder [`migrations/`](file:///e:/gembok-bill211025/migrations).

## Inisialisasi Data Awal

Untuk server baru, jalankan perintah berikut:

```bash
npm run setup
```

Ini akan:
1. Menginstal semua dependensi
2. Menjalankan semua file migrasi untuk membuat struktur database
3. Membuat data awal yang diperlukan

## File Migrasi

Semua file migrasi berada di folder [`migrations/`](file:///e:/gembok-bill211025/migrations) dan dijalankan secara berurutan berdasarkan nama file.

## Konfigurasi Environment

Salin file [.env.example](file:///e:/gembok-bill211025/.env.example) ke .env dan sesuaikan nilainya:

```bash
cp .env.example .env
```

Kemudian edit file .env dengan konfigurasi yang sesuai untuk lingkungan Anda.

## Keamanan

- Jangan pernah menyertakan file .env atau data sensitif lainnya di repository
- Gunakan .env.example sebagai template untuk konfigurasi
- Pastikan file config/superadmin.txt hanya berisi nomor yang sesuai
