# 📡 Sistem Isolir IP Statik - Gembok Bill

## 🎯 **Overview**

Sistem isolir IP statik adalah fitur yang memungkinkan ISP untuk memblokir atau membatasi akses internet pelanggan yang menggunakan **IP statik** (bukan PPPoE). Sistem ini menggunakan berbagai metode di Mikrotik untuk melakukan isolir yang efektif.

---

## 🔧 **Metode Isolir yang Tersedia**

### **1. Address List (Recommended)**
**Metode terbaik dan paling efisien**

**Cara Kerja:**
- Menambahkan IP pelanggan ke address list `blocked_customers`
- Menggunakan firewall rule untuk memblokir semua traffic dari address list
- Performa tinggi dan mudah dikelola

**Kelebihan:**
- ✅ Performa sangat baik (hardware acceleration)
- ✅ Mudah monitoring dan debugging
- ✅ Bisa block ratusan IP dengan 1 rule
- ✅ Tidak mempengaruhi performa router

**Kekurangan:**
- ❌ Memerlukan firewall rule yang tepat

### **2. DHCP Block**
**Untuk pelanggan yang menggunakan DHCP**

**Cara Kerja:**
- Memblokir DHCP lease berdasarkan MAC address
- Pelanggan tidak bisa mendapat IP dari DHCP server

**Kelebihan:**
- ✅ Efektif untuk DHCP-based networks
- ✅ Blokir total dari layer network

**Kekurangan:**
- ❌ Hanya untuk pelanggan DHCP
- ❌ Memerlukan MAC address yang terdaftar

### **3. Bandwidth Limit (Soft Isolation)**
**Isolir dengan membatasi bandwidth ke minimum**

**Cara Kerja:**
- Membuat queue dengan limit bandwidth sangat kecil (1KB/s)
- Pelanggan masih bisa konek tapi sangat lambat

**Kelebihan:**
- ✅ Soft isolation - pelanggan aware ada masalah
- ✅ Tidak memutus koneksi sepenuhnya
- ✅ Mudah dikonfigurasi

**Kekurangan:**
- ❌ Masih mengkonsumsi resource untuk traffic pelanggan
- ❌ Pelanggan masih bisa akses (walaupun lambat)

### **4. Individual Firewall Rule**
**Membuat rule firewall khusus per IP**

**Cara Kerja:**
- Membuat firewall rule untuk memblokir IP spesifik
- Setiap pelanggan punya rule sendiri

**Kelebihan:**
- ✅ Kontrol granular per pelanggan
- ✅ Bisa custom rule per kasus

**Kekurangan:**
- ❌ Tidak efisien untuk banyak pelanggan
- ❌ Bisa mempengaruhi performa jika terlalu banyak rule

---

## 🗄️ **Database Structure**

### **Tabel customers - Field Tambahan**

```sql
ALTER TABLE customers ADD COLUMN static_ip TEXT;        -- IP statik utama
ALTER TABLE customers ADD COLUMN assigned_ip TEXT;      -- IP yang di-assign 
ALTER TABLE customers ADD COLUMN mac_address TEXT;      -- MAC address untuk DHCP
```

**Field Descriptions:**
- **`static_ip`**: IP address utama untuk pelanggan IP statik
- **`assigned_ip`**: IP yang sebenarnya di-assign (bisa berbeda dari static_ip)
- **`mac_address`**: MAC address untuk metode DHCP block

---

## ⚙️ **Konfigurasi**

### **Settings.json Configuration**

```json
{
  "static_ip_suspension_method": "address_list",
  "suspension_bandwidth_limit": "1k/1k",
  "isolir_profile": "isolir"
}
```

**Setting Options:**
- **`static_ip_suspension_method`**: 
  - `"address_list"` (recommended)
  - `"dhcp_block"`
  - `"bandwidth_limit"`
  - `"firewall_rule"`
- **`suspension_bandwidth_limit`**: Speed limit untuk bandwidth method (default: "1k/1k")

---

## 🚀 **Setup dan Instalasi**

### **1. Jalankan Database Migration**

```bash
node scripts/add-static-ip-fields.js
```

### **2. Setup Mikrotik Firewall Rules**

**Address List Method (Automatic):**
```mikrotik
# Rules akan dibuat otomatis oleh sistem saat pertama kali digunakan
/ip firewall filter add chain=forward src-address-list=blocked_customers action=drop comment="Block suspended customers (static IP)"
/ip firewall filter add chain=input src-address-list=blocked_customers action=drop comment="Block suspended customers from accessing router"
```

**Manual Setup (Optional):**
```mikrotik
# Buat address list kosong
/ip firewall address-list add list=blocked_customers address=0.0.0.0 comment="Placeholder - will be auto-managed"

# Buat firewall rules
/ip firewall filter add chain=forward src-address-list=blocked_customers action=drop place-before=0
/ip firewall filter add chain=input src-address-list=blocked_customers action=drop
```

---

## 💻 **Penggunaan**

### **1. Via WhatsApp Commands**

```
# Isolir pelanggan IP statik
isolir 081234567890 Telat bayar

# Restore pelanggan IP statik  
restore 081234567890 Sudah bayar
```

### **2. Via Admin Web Interface**

1. Masuk ke **Admin Dashboard** → **Billing**
2. Cari pelanggan yang akan diisolir
3. Klik tombol **"Isolir"**
4. Pilih alasan isolir
5. Sistem akan otomatis mendeteksi tipe koneksi (PPPoE/Static IP)

### **3. Via API Endpoint**

```javascript
// Suspend static IP customer
POST /admin/billing/service-suspension/suspend/:username
{
  "reason": "Telat bayar"
}

// Restore static IP customer
POST /admin/billing/service-suspension/restore/:username
{
  "reason": "Sudah bayar"
}
```

### **4. Programmatic Usage**

```javascript
const staticIPSuspension = require('./config/staticIPSuspension');

// Suspend customer
const result = await staticIPSuspension.suspendStaticIPCustomer(
  customer,           // Customer object
  'Telat bayar',     // Reason
  'address_list'     // Method
);

// Restore customer
const restoreResult = await staticIPSuspension.restoreStaticIPCustomer(
  customer,
  'Sudah bayar'
);

// Check suspension status
const status = await staticIPSuspension.getStaticIPSuspensionStatus(customer);
```

---

## 🔍 **Monitoring dan Debugging**

### **1. Cek Status Isolir**

```javascript
// Via code
const status = await staticIPSuspension.getStaticIPSuspensionStatus(customer);
console.log('Suspended:', status.suspended);
console.log('Methods:', status.methods);
```

### **2. Mikrotik Commands untuk Monitoring**

```mikrotik
# Cek address list blocked customers
/ip firewall address-list print where list=blocked_customers

# Cek firewall rules
/ip firewall filter print where src-address-list=blocked_customers

# Cek queue untuk bandwidth limit
/queue simple print where name~"suspended_"

# Cek DHCP leases yang diblokir
/ip dhcp-server lease print where blocked=yes
```

### **3. Log Monitoring**

```bash
# Monitor logs untuk static IP operations
tail -f logs/info.log | grep "static.*IP\|Static IP"
tail -f logs/error.log | grep "static.*IP\|Static IP"
```

---

## 🛠️ **Troubleshooting**

### **Problem 1: IP tidak terblokir setelah isolir**

**Penyebab:**
- Firewall rule belum ada atau salah posisi
- IP address tidak sesuai dengan yang terdaftar

**Solusi:**
```mikrotik
# Cek firewall rules
/ip firewall filter print

# Pastikan rule ada dan di posisi paling atas
/ip firewall filter move [rule-id] destination=0

# Cek address list
/ip firewall address-list print where list=blocked_customers
```

### **Problem 2: DHCP block tidak berfungsi**

**Penyebab:**
- MAC address tidak terdaftar di database
- DHCP lease tidak ditemukan

**Solusi:**
```sql
-- Cek MAC address di database
SELECT username, mac_address FROM customers WHERE username = 'customer_username';

-- Update MAC address jika perlu
UPDATE customers SET mac_address = '00:11:22:33:44:55' WHERE username = 'customer_username';
```

### **Problem 3: Bandwidth limit tidak efektif**

**Penyebab:**
- Queue rules tidak pada posisi yang tepat
- IP target tidak sesuai

**Solusi:**
```mikrotik
# Cek queue
/queue simple print where name~"suspended_"

# Edit queue jika perlu
/queue simple set [id] max-limit=512k/512k
```

---

## 📊 **Perbandingan Metode**

| Metode | Performa | Efektivitas | Kompleksitas | Use Case |
|--------|----------|-------------|--------------|----------|
| **Address List** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Production, banyak pelanggan |
| **DHCP Block** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | DHCP-based networks |
| **Bandwidth Limit** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Soft isolation, warning |
| **Firewall Rule** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Kasus khusus, sedikit pelanggan |

---

## 🔐 **Security Considerations**

### **1. Bypass Prevention**
- **VPN Detection**: Monitor untuk traffic VPN yang mencurigakan
- **MAC Spoofing**: Gunakan kombinasi IP + MAC untuk keamanan tambahan
- **Multiple IP**: Pastikan semua IP pelanggan terdata dengan benar

### **2. False Positive Prevention**
- **IP Conflict Detection**: Cek duplikasi IP sebelum isolir
- **Verification**: Verify IP ownership sebelum suspend
- **Logging**: Log semua operasi isolir untuk audit

---

## 📈 **Best Practices**

### **1. Pemilihan Metode**
- **Address List** untuk production dengan >50 pelanggan
- **DHCP Block** untuk network berbasis DHCP  
- **Bandwidth Limit** untuk warning/soft isolation
- **Firewall Rule** untuk kasus khusus

### **2. Database Management**
- Pastikan data IP dan MAC address selalu up-to-date
- Gunakan validasi input untuk mencegah data corruption
- Backup database secara berkala

### **3. Monitoring**
- Setup alerting untuk failed isolation attempts
- Monitor resource usage di Mikrotik
- Track isolation effectiveness metrics

### **4. Documentation**
- Document semua custom rule dan konfigurasi
- Maintain inventory IP address allocation
- Document troubleshooting procedures

---

## 🔄 **Integration dengan Sistem Billing**

### **Auto Suspension**
Sistem akan otomatis mendeteksi tipe koneksi pelanggan:

1. **PPPoE Customer**: Gunakan profile isolir
2. **Static IP Customer**: Gunakan metode IP statik yang dikonfigurasi
3. **Mixed Customer**: Suspend keduanya untuk maksimal efektivitas

### **Status Tracking**
```javascript
// Status update otomatis di database
customer.status = 'suspended'
customer.suspension_type = 'static_ip'
customer.suspension_method = 'address_list'
customer.suspended_at = new Date()
customer.suspension_reason = 'Telat bayar'
```

---

## 📞 **Support dan Maintenance**

### **Regular Maintenance Tasks**
- **Weekly**: Audit address list untuk cleanup
- **Monthly**: Review suspension effectiveness
- **Quarterly**: Update documentation dan procedures

### **Emergency Procedures**
- **Mass Restore**: Script untuk restore semua pelanggan jika terjadi masalah
- **Rule Backup**: Backup konfigurasi Mikrotik secara berkala
- **Fallback Methods**: Siapkan metode alternatif jika satu metode gagal

---

## 📚 **Resources**

- **Mikrotik Documentation**: [RouterOS Manual](https://help.mikrotik.com/)
- **API Reference**: `/admin/billing/service-suspension/`
- **WhatsApp Commands**: `isolir`, `restore`, `status`
- **Config Files**: `config/staticIPSuspension.js`, `config/serviceSuspension.js`

---

**🎉 Selamat! Sistem isolir IP statik siap digunakan untuk meningkatkan efektivitas manajemen pelanggan RTRWNet.**
