#!/bin/bash

# Script validasi data di server
# Generated: 2025-09-30T05:34:58.329Z

echo "✅ Memulai validasi data di server..."

# 1. Cek jumlah customers
echo "👥 Validasi customers..."
CUSTOMER_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM customers;")
echo "Total customers: $CUSTOMER_COUNT"

# 2. Cek jumlah packages
echo "📦 Validasi packages..."
PACKAGE_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM packages;")
echo "Total packages: $PACKAGE_COUNT"

# 3. Cek jumlah technicians
echo "👨‍💼 Validasi technicians..."
TECHNICIAN_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM technicians;")
echo "Total technicians: $TECHNICIAN_COUNT"

# 4. Cek jumlah ODPs
echo "🏗️ Validasi ODPs..."
ODP_COUNT=$(sqlite3 /path/to/server/data/billing.db "SELECT COUNT(*) FROM odps;")
echo "Total ODPs: $ODP_COUNT"

# 5. Cek status aplikasi
echo "🔍 Cek status aplikasi..."
pm2 status gembok-bill

echo "✅ Validasi selesai!"
