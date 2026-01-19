# Sistem Cetak Invoice - Gembok Bill

## Overview
Sistem cetak invoice adalah fitur utama aplikasi Gembok Bill yang memungkinkan admin untuk mencetak dan mengunduh invoice dalam format yang dapat dicetak atau PDF.

## Fitur Utama

### 1. Cetak Invoice
- **Route**: `/admin/billing/invoices/:id/print`
- **Method**: GET
- **Authentication**: Required (Admin only)
- **Template**: `views/admin/billing/invoice-print.ejs`

### 2. Download PDF
- **Fitur**: Generate PDF dari invoice
- **Library**: html2pdf.js
- **Format**: A4 Portrait
- **Quality**: High resolution

### 3. Print-friendly Design
- **CSS Print Media**: Optimized untuk printer
- **Page Size**: A4 (21cm x 29.7cm)
- **Margins**: 0.5cm
- **Color Support**: Full color dengan print color adjust

## Struktur Database

### Tabel Invoices
```sql
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'unpaid',
    payment_date DATETIME,
    payment_method TEXT,
    payment_gateway TEXT,
    payment_token TEXT,
    payment_url TEXT,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id),
    FOREIGN KEY (package_id) REFERENCES packages (id)
);
```

### Tabel Customers
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    username TEXT UNIQUE NOT NULL,
    -- ... other fields
);
```

### Tabel Packages
```sql
CREATE TABLE packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    speed TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    -- ... other fields
);
```

## Query Data Invoice

### getInvoiceById Function
```javascript
async getInvoiceById(id) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT i.*, c.username as customer_username, c.name as customer_name, 
                   c.phone as customer_phone, c.address as customer_address,
                   p.name as package_name, p.speed as package_speed
            FROM invoices i
            JOIN customers c ON i.customer_id = c.id
            JOIN packages p ON i.package_id = p.id
            WHERE i.id = ?
        `;
        
        this.db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}
```

## Template Invoice

### Layout Structure
1. **Header**: Logo perusahaan, nama perusahaan, nomor invoice
2. **Customer Info**: Nama, username, telepon, alamat
3. **Invoice Info**: Tanggal dibuat, jatuh tempo, status
4. **Amount Box**: Total tagihan yang menonjol
5. **Service Details**: Tabel layanan dengan paket dan harga
6. **Notes**: Catatan tambahan (jika ada)
7. **Payment Instructions**: Cara pembayaran (bank dan tunai)
8. **Footer**: Informasi kontak dan footer

### CSS Features
- **Responsive Design**: Works on screen and print
- **Print Optimization**: 
  - `@media print` styles
  - `print-color-adjust: exact`
  - Proper page margins
- **Color Support**: 
  - Blue theme (#007bff)
  - Status badges (success, warning, danger)
  - Table styling

## JavaScript Features

### Print Function
```javascript
function printInvoice() {
    window.print();
}
```

### PDF Download
```javascript
function downloadAsPDF() {
    const element = document.querySelector('.container-fluid');
    const opt = {
        margin: 0.5,
        filename: 'invoice-<%= invoice.invoice_number %>.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
}
```

### Auto-hide Print Buttons
```javascript
window.addEventListener('beforeprint', function() {
    document.querySelector('.print-button').style.display = 'none';
});

window.addEventListener('afterprint', function() {
    document.querySelector('.print-button').style.display = 'block';
});
```

## Konfigurasi Settings

### Company Information
```json
{
  "company_header": "ALIJAYA DIGITAL NETWORK",
  "footer_info": "Info Hubungi : 081947215703",
  "logo_filename": "logo.png"
}
```

### Payment Information
```json
{
  "payment_bank_name": "BCA",
  "payment_account_number": "1234567890",
  "payment_account_holder": "ALIJAYA DIGITAL NETWORK",
  "payment_cash_address": "Jl. Contoh No. 123",
  "payment_cash_hours": "08:00 - 17:00"
}
```

### Contact Information
```json
{
  "contact_phone": "0812-3456-7890",
  "contact_email": "info@example.com",
  "contact_address": "Jl. Contoh No. 123, Kota",
  "contact_whatsapp": "081947215703"
}
```

## Troubleshooting

### Common Issues

#### 1. Logo Tidak Muncul
- **Problem**: Path logo salah
- **Solution**: Pastikan logo ada di `/public/img/logo.png`
- **Check**: File `logo.png` ada di direktori `public/img/`

#### 2. Customer Address Kosong
- **Problem**: Field address tidak ada di database
- **Solution**: Field sudah ditangani dengan fallback "Alamat tidak tersedia"
- **Check**: Query sudah include `c.address as customer_address`

#### 3. Package Speed Tidak Muncul
- **Problem**: Field speed tidak ada di database
- **Solution**: Field sudah ditangani dengan fallback "Kecepatan tidak tersedia"
- **Check**: Query sudah include `p.speed as package_speed`

#### 4. Print Tidak Berfungsi
- **Problem**: CSS print media tidak support
- **Solution**: Gunakan browser modern (Chrome, Firefox, Edge)
- **Check**: Pastikan `@media print` styles ada

#### 5. PDF Download Error
- **Problem**: Library html2pdf.js tidak load
- **Solution**: Check internet connection untuk CDN
- **Alternative**: Gunakan fitur print browser

### Debug Steps
1. **Check Console**: Lihat error di browser console
2. **Check Network**: Pastikan semua resource load
3. **Check Database**: Verifikasi data invoice ada
4. **Check Authentication**: Pastikan sudah login admin
5. **Check Route**: Verifikasi route `/admin/billing/invoices/:id/print`

## Testing

### Manual Test
1. Login sebagai admin
2. Buka halaman invoices
3. Klik tombol print pada invoice
4. Test fitur print dan download PDF

### Automated Test
Gunakan file `test-invoice.html` untuk test otomatis:
- Health check server
- Admin authentication
- Invoice list access
- Invoice print access

## Performance Optimization

### Database
- Query menggunakan JOIN untuk single request
- Index pada foreign keys
- Prepared statements untuk security

### Frontend
- CSS optimized untuk print
- Lazy loading untuk images
- Minified external libraries

### Caching
- Settings cached dengan `getSettingsWithCache`
- Session management untuk admin
- Static file caching

## Security

### Authentication
- Admin-only access dengan middleware
- Session-based authentication
- CSRF protection

### Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection

### File Access
- Static files served from public directory
- Logo files validated
- Path traversal protection

## Future Enhancements

### Planned Features
1. **Email Invoice**: Kirim invoice via email
2. **WhatsApp Invoice**: Kirim invoice via WhatsApp
3. **Bulk Print**: Print multiple invoices
4. **Custom Templates**: Multiple invoice designs
5. **Digital Signature**: E-signature support

### Technical Improvements
1. **PDF Generation**: Server-side PDF generation
2. **Template Engine**: Dynamic template system
3. **Multi-language**: Internationalization support
4. **Mobile App**: Native mobile application
5. **API Integration**: RESTful API for external systems

## Support

### Contact
- **Developer**: Admin System
- **Email**: info@example.com
- **WhatsApp**: 081947215703

### Documentation
- **API Docs**: `/docs/api.md`
- **User Manual**: `/docs/user-manual.md`
- **Admin Guide**: `/docs/admin-guide.md`

### Version History
- **v1.0.0**: Initial release with basic invoice printing
- **v1.1.0**: Added PDF download functionality
- **v1.2.0**: Improved print styling and responsiveness
