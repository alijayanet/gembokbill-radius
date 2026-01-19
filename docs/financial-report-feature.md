# Fitur Laporan Keuangan - Gembok Bill

## Deskripsi
Fitur laporan keuangan telah ditambahkan ke sistem billing untuk memberikan visibilitas yang lebih baik terhadap pemasukan dan pengeluaran bisnis RTRWNet.

## Fitur yang Ditambahkan

### 1. Laporan Keuangan (`/admin/billing/financial-report`)
- **Dashboard Keuangan**: Menampilkan ringkasan total pemasukan, pengeluaran, dan laba bersih
- **Filter Periode**: Filter berdasarkan rentang tanggal dan tipe laporan (semua/pemasukan/pengeluaran)
- **Tabel Transaksi**: Detail semua transaksi keuangan dalam periode yang dipilih
- **Export Excel**: Kemampuan untuk mengexport laporan ke file Excel
- **Print Report**: Fitur untuk mencetak laporan

### 2. Manajemen Pengeluaran (`/admin/billing/expenses`)
- **Tambah Pengeluaran**: Form untuk menambah data pengeluaran baru
- **Edit Pengeluaran**: Kemampuan untuk mengedit data pengeluaran yang sudah ada
- **Hapus Pengeluaran**: Fitur untuk menghapus data pengeluaran
- **Filter Pengeluaran**: Filter berdasarkan rentang tanggal
- **Kategori Pengeluaran**: Kategorisasi pengeluaran (Operasional, Gaji, Utilitas, dll)

### 3. Database Schema
Tabel baru yang ditambahkan:
```sql
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    expense_date DATE NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Cara Menggunakan

### Mengakses Laporan Keuangan
1. Login ke admin portal
2. Navigasi ke **Billing** → **Laporan Keuangan**
3. Pilih rentang tanggal dan tipe laporan
4. Klik **Filter** untuk memuat data
5. Gunakan **Export Excel** atau **Print** sesuai kebutuhan

### Mengelola Pengeluaran
1. Navigasi ke **Billing** → **Manajemen Pengeluaran**
2. Klik **Tambah Pengeluaran** untuk menambah data baru
3. Isi form dengan detail pengeluaran
4. Klik **Simpan** untuk menyimpan data
5. Gunakan tombol **Edit** atau **Hapus** untuk mengelola data yang ada

## API Endpoints

### Laporan Keuangan
- `GET /admin/billing/financial-report` - Halaman laporan keuangan
- `GET /admin/billing/api/financial-report` - API data laporan keuangan
- `GET /admin/billing/export/financial-report.xlsx` - Export ke Excel

### Manajemen Pengeluaran
- `GET /admin/billing/expenses` - Halaman manajemen pengeluaran
- `POST /admin/billing/api/expenses` - Tambah pengeluaran baru
- `PUT /admin/billing/api/expenses/:id` - Update pengeluaran
- `DELETE /admin/billing/api/expenses/:id` - Hapus pengeluaran

## Struktur Data

### Financial Report Response
```json
{
  "transactions": [
    {
      "type": "income|expense",
      "date": "2024-01-01",
      "amount": 100000,
      "payment_method": "Transfer Bank",
      "gateway_name": "Midtrans",
      "invoice_number": "INV-001",
      "customer_name": "Nama Pelanggan",
      "customer_phone": "08123456789"
    }
  ],
  "summary": {
    "totalIncome": 5000000,
    "totalExpense": 2000000,
    "netProfit": 3000000,
    "transactionCount": 50,
    "incomeCount": 45,
    "expenseCount": 5
  },
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

### Expense Data
```json
{
  "id": 1,
  "description": "Pembayaran Listrik",
  "amount": 500000,
  "category": "Utilitas",
  "expense_date": "2024-01-15",
  "payment_method": "Transfer Bank",
  "notes": "Pembayaran listrik bulan Januari",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

## Kategori Pengeluaran
- **Operasional**: Biaya operasional sehari-hari
- **Gaji**: Gaji karyawan dan honorarium
- **Utilitas**: Listrik, air, internet, dll
- **Maintenance**: Perbaikan dan pemeliharaan peralatan
- **Marketing**: Biaya promosi dan marketing
- **Lainnya**: Kategori pengeluaran lainnya

## Metode Pembayaran
- **Cash**: Pembayaran tunai
- **Transfer Bank**: Transfer antar bank
- **E-Wallet**: OVO, DANA, GoPay, dll
- **Kartu Kredit**: Pembayaran dengan kartu kredit

## Keamanan
- Semua endpoint dilindungi dengan middleware autentikasi admin
- Validasi input untuk mencegah data yang tidak valid
- Logging untuk audit trail

## Dependencies
- **ExcelJS**: Untuk export ke Excel
- **SQLite3**: Database untuk menyimpan data
- **Express**: Framework web server
- **Bootstrap**: UI framework

## Catatan Implementasi
- Fitur ini terintegrasi dengan sistem billing yang sudah ada
- Data pemasukan diambil dari tabel `payment_gateway_transactions`
- Data pengeluaran disimpan di tabel `expenses` yang baru
- Laporan dapat difilter berdasarkan periode waktu
- Export Excel mendukung multiple worksheet (transaksi dan ringkasan)

## Troubleshooting
1. **Database tidak terupdate**: Pastikan aplikasi di-restart setelah perubahan
2. **Export Excel error**: Pastikan package ExcelJS terinstall
3. **Data tidak muncul**: Cek log aplikasi untuk error database
4. **Permission denied**: Pastikan folder data memiliki permission write

## Update Selanjutnya
- Grafik dan chart untuk visualisasi data
- Notifikasi WhatsApp untuk pengeluaran besar
- Integrasi dengan sistem akuntansi
- Backup otomatis data keuangan
- Role-based access control untuk data keuangan
