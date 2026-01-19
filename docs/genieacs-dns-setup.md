# Setup DNS Server GenieACS untuk ONU

## 📋 **Overview**

Dokumentasi ini menjelaskan cara mengatur DNS server TR069 pada ONU yang terkoneksi ke Mikrotik agar menggunakan GenieACS server sebagai DNS server.

### **Konfigurasi:**
- **Server GenieACS**: `192.168.8.89:7547`
- **IP PPPoE**: `192.168.10.0/24`
- **DNS Server**: `192.168.8.89` (GenieACS server)

## 🛠️ **Langkah-langkah Setup**

### **1. Setup Mikrotik Router**

Jalankan script Mikrotik untuk mengatur DNS server dan routing:

```bash
# Upload dan jalankan script di Mikrotik
/import file-name=mikrotik-dns-genieacs.rsc
```

**Script ini akan:**
- Mengatur DNS static untuk GenieACS server
- Membuat DHCP server untuk PPPoE users
- Mengatur NAT rules untuk TR069 traffic
- Membuat firewall rules untuk mengizinkan TR069
- Membuat PPPoE profile dengan DNS server GenieACS

### **2. Setup GenieACS Server**

Pastikan GenieACS server dapat diakses dari network PPPoE:

```bash
# Cek konektivitas dari Mikrotik ke GenieACS
ping 192.168.8.89
telnet 192.168.8.89 7547
```

### **3. Konfigurasi DNS pada ONU**

#### **A. Konfigurasi Manual (Satu per Satu)**

```bash
# Jalankan script untuk konfigurasi DNS
node scripts/genieacs-dns-config.js

# Pilih opsi:
# 1. Konfigurasi DNS untuk semua ONU
# 2. Konfigurasi DNS berdasarkan PPPoE username
# 3. Verifikasi konfigurasi DNS device
```

#### **B. Konfigurasi Otomatis (Semua ONU)**

```bash
# Konfigurasi DNS untuk semua ONU yang terkoneksi
node scripts/genieacs-dns-config.js
# Pilih opsi 1
```

### **4. Integrasi dengan Sistem Billing**

#### **A. Konfigurasi Otomatis untuk Customer Baru**

```bash
# Jalankan script integrasi billing
node scripts/integrate-genieacs-dns-billing.js

# Pilih opsi:
# 1. Konfigurasi DNS untuk customer baru
# 2. Konfigurasi DNS untuk customer yang diaktifkan
# 3. Konfigurasi DNS untuk semua customer aktif
```

#### **B. Konfigurasi untuk Customer Aktif**

```bash
# Konfigurasi DNS untuk semua customer aktif
node scripts/integrate-genieacs-dns-billing.js
# Pilih opsi 3
```

## 🔧 **Script yang Tersedia**

### **1. `genieacs-dns-config.js`**
Script utama untuk mengatur DNS server pada ONU.

**Fitur:**
- Konfigurasi DNS untuk semua ONU
- Konfigurasi DNS berdasarkan PPPoE username
- Verifikasi konfigurasi DNS
- Support multiple DNS server paths

**Penggunaan:**
```bash
node scripts/genieacs-dns-config.js
```

### **2. `mikrotik-dns-genieacs.rsc`**
Script Mikrotik untuk mengatur DNS server dan routing.

**Fitur:**
- DNS static untuk GenieACS server
- DHCP server untuk PPPoE users
- NAT rules untuk TR069 traffic
- Firewall rules untuk TR069
- PPPoE profile dengan DNS server

**Penggunaan:**
```bash
# Upload ke Mikrotik dan jalankan
/import file-name=mikrotik-dns-genieacs.rsc
```

### **3. `integrate-genieacs-dns-billing.js`**
Script untuk mengintegrasikan konfigurasi DNS dengan sistem billing.

**Fitur:**
- Konfigurasi DNS untuk customer baru
- Konfigurasi DNS untuk customer yang diaktifkan
- Konfigurasi DNS untuk semua customer aktif
- Log konfigurasi DNS
- Integrasi dengan database billing

**Penggunaan:**
```bash
node scripts/integrate-genieacs-dns-billing.js
```

## 📊 **Monitoring dan Verifikasi**

### **1. Verifikasi Konfigurasi Mikrotik**

```bash
# Cek DNS static
/ip dns static print where name~"genieacs"

# Cek DHCP server
/ip dhcp-server print where name="pppoe-dhcp"

# Cek NAT rules
/ip firewall nat print where comment~"tr069"

# Cek Firewall rules
/ip firewall filter print where comment~"tr069"
```

### **2. Verifikasi Konfigurasi ONU**

```bash
# Verifikasi konfigurasi DNS device
node scripts/genieacs-dns-config.js
# Pilih opsi 3, masukkan Device ID
```

### **3. Cek Log Konfigurasi**

```bash
# Lihat log konfigurasi DNS
node scripts/integrate-genieacs-dns-billing.js
# Pilih opsi 4
```

## 🔍 **Troubleshooting**

### **1. ONU Tidak Bisa Akses GenieACS**

**Kemungkinan Penyebab:**
- Firewall rules tidak mengizinkan TR069 traffic
- NAT rules tidak berfungsi
- DNS server tidak dikonfigurasi dengan benar

**Solusi:**
```bash
# Cek konektivitas dari Mikrotik
ping 192.168.8.89
telnet 192.168.8.89 7547

# Cek firewall rules
/ip firewall filter print where comment~"tr069"

# Cek NAT rules
/ip firewall nat print where comment~"tr069"
```

### **2. DNS Server Tidak Berfungsi**

**Kemungkinan Penyebab:**
- DNS server tidak dikonfigurasi pada ONU
- DNS server path tidak sesuai dengan model ONU
- GenieACS server tidak dapat diakses

**Solusi:**
```bash
# Verifikasi konfigurasi DNS
node scripts/genieacs-dns-config.js
# Pilih opsi 3, masukkan Device ID

# Cek parameter DNS yang dikonfigurasi
# Path yang didukung:
# - InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DNSServers
# - Device.DNS.Client.Server.1
# - VirtualParameters.dnsServer1
```

### **3. Customer Tidak Terkonfigurasi**

**Kemungkinan Penyebab:**
- Customer tidak memiliki PPPoE username
- Device tidak ditemukan di GenieACS
- PPPoE username tidak sesuai

**Solusi:**
```bash
# Cek data customer
# Pastikan customer memiliki PPPoE username
# Pastikan device terdaftar di GenieACS
# Pastikan PPPoE username sesuai
```

## 📋 **Parameter DNS yang Didukung**

### **Standard TR-069 Paths:**
- `InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DNSServers`
- `InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DNSServers._value`
- `InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DNSServers.1`
- `InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DNSServers.2`

### **Device-specific Paths:**
- `Device.DNS.Client.Server.1`
- `Device.DNS.Client.Server.2`
- `Device.DNS.Client.Server.3`
- `Device.DNS.Client.Server.4`

### **Virtual Parameters:**
- `VirtualParameters.dnsServer1`
- `VirtualParameters.dnsServer2`
- `VirtualParameters.dnsServer3`
- `VirtualParameters.dnsServer4`

## 🚀 **Otomatisasi**

### **1. Cron Job untuk Konfigurasi Otomatis**

```bash
# Tambahkan ke crontab untuk konfigurasi otomatis setiap jam
0 * * * * cd /path/to/gembok-bill && node scripts/integrate-genieacs-dns-billing.js --auto
```

### **2. Integration dengan Customer Creation**

```javascript
// Tambahkan ke fungsi createCustomer di billing.js
const { GenieACSDNSBillingIntegration } = require('./scripts/integrate-genieacs-dns-billing');
const dnsIntegration = new GenieACSDNSBillingIntegration();

// Setelah customer dibuat
await dnsIntegration.configureDNSForNewCustomer(customerId);
```

### **3. Integration dengan Customer Activation**

```javascript
// Tambahkan ke fungsi activateCustomer
const { GenieACSDNSBillingIntegration } = require('./scripts/integrate-genieacs-dns-billing');
const dnsIntegration = new GenieACSDNSBillingIntegration();

// Setelah customer diaktifkan
await dnsIntegration.configureDNSForActivatedCustomer(customerId);
```

## 📝 **Catatan Penting**

1. **Pastikan GenieACS server dapat diakses** dari network PPPoE
2. **Verifikasi firewall rules** mengizinkan TR069 traffic
3. **Cek parameter DNS** sesuai dengan model ONU
4. **Monitor log konfigurasi** untuk troubleshooting
5. **Backup konfigurasi** sebelum melakukan perubahan besar

## 🔗 **Referensi**

- [GenieACS Documentation](https://github.com/genieacs/genieacs)
- [TR-069 Standard](https://www.broadband-forum.org/technical/download/TR-069.pdf)
- [Mikrotik RouterOS Documentation](https://help.mikrotik.com/docs/display/ROS/RouterOS)
