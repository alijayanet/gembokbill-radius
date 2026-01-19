# 🚨 Troubleshooting: SQLite3 ELF Header Error

## Masalah
```
Error: /home/alijaya/gembok-bill/node_modules/sqlite3/build/Release/node_sqlite3.node: invalid ELF header
```

## Penyebab
- SQLite3 binary dikompilasi untuk arsitektur yang berbeda
- Node.js versi berbeda antara development dan production server
- Native modules tidak cocok dengan sistem Linux server

## Solusi Lengkap

### ✅ **Solusi Otomatis (Recommended)**

#### 1. **Script Postinstall sudah menangani ini:**
```bash
npm install  # Otomatis menjalankan npm rebuild
```

#### 2. **Jika masih error, coba manual:**
```bash
# Rebuild native modules
npm rebuild

# Atau rebuild spesifik untuk sqlite3
npm rebuild sqlite3
```

#### 3. **Build from source untuk Linux:**
```bash
npm install sqlite3 --build-from-source
```

### 🔧 **Solusi Manual (Advanced)**

#### 1. **Install build tools:**
```bash
sudo apt update
sudo apt install -y build-essential python3-dev libsqlite3-dev
```

#### 2. **Clean install:**
```bash
# Hapus node_modules lama
rm -rf node_modules package-lock.json

# Install ulang
npm install

# Rebuild untuk sistem ini
npm rebuild
```

#### 3. **Force rebuild semua native modules:**
```bash
# Rebuild semua native modules
npm rebuild

# Atau spesifik untuk sqlite3
npm install sqlite3 --build-from-source --sqlite=/usr
```

### 🎯 **Quick Fix Commands**

```bash
# Masuk ke direktori aplikasi
cd ~/gembok-bill

# Quick fix 1: Rebuild otomatis
npm rebuild

# Quick fix 2: Clean install
rm -rf node_modules && npm install

# Quick fix 3: Build from source
npm install sqlite3 --build-from-source

# Quick fix 4: Install versi stabil
npm install sqlite3@5.1.1 --build-from-source
```

### ✅ **Verifikasi Instalasi**

```bash
# Cek versi sqlite3
npm list sqlite3

# Test aplikasi
npm start

# Jika berhasil, akan muncul:
# 🚀 CacheManager initialized with default TTL: 5 minutes
```

### 🚨 **Troubleshooting Lanjutan**

#### Jika masih error setelah rebuild:

1. **Cek Node.js versi:**
```bash
node --version  # Pastikan v20+
```

2. **Cek arsitektur sistem:**
```bash
uname -m  # x86_64, aarch64, dll
```

3. **Cek library SQLite3 sistem:**
```bash
ldconfig -p | grep sqlite
```

4. **Force rebuild dengan environment variables:**
```bash
export npm_config_build_from_source=true
export npm_config_sqlite=/usr
npm install sqlite3
```

### 📞 **Support**

Jika masih mengalami masalah:
- **WhatsApp:** 081947215703
- **GitHub Issues:** [Buat Issue](https://github.com/alijayanet/gembok-bill/issues)
- **Telegram:** [https://t.me/alijayaNetAcs](https://t.me/alijayaNetAcs)

---

**🎯 Dengan mengikuti langkah di atas, aplikasi akan berjalan normal di server Linux baru!**
