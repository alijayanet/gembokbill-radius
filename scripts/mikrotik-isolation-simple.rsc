# ========================================
# MIKROTIK ISOLATION SYSTEM - SIMPLE SETUP
# Copy-paste script ini ke terminal Mikrotik
# ========================================

# 1. Buat address list untuk blocked customers
/ip firewall address-list add list=blocked_customers address=0.0.0.0 comment="Placeholder - Auto managed by Gembok Bill"

# 2. Buat firewall rule untuk block traffic (FORWARD chain)
/ip firewall filter add chain=forward src-address-list=blocked_customers action=drop comment="Block suspended customers (static IP) - Gembok Bill" place-before=0

# 3. Buat firewall rule untuk block access ke router (INPUT chain)
/ip firewall filter add chain=input src-address-list=blocked_customers action=drop comment="Block suspended customers from accessing router (static IP) - Gembok Bill"

# ========================================
# COMMANDS UNTUK ISOLIR PELANGGAN:
# ========================================

# Isolir pelanggan (ganti IP_ADDRESS dengan IP pelanggan):
# /ip firewall address-list add list=blocked_customers address=IP_ADDRESS comment="SUSPENDED - [ALASAN] - [TANGGAL]"

# Contoh:
# /ip firewall address-list add list=blocked_customers address=192.168.1.100 comment="SUSPENDED - Telat bayar - 2024-01-15"

# Restore pelanggan (hapus dari address list):
# /ip firewall address-list remove [find where address=IP_ADDRESS and list=blocked_customers]

# Contoh:
# /ip firewall address-list remove [find where address=192.168.1.100 and list=blocked_customers]

# ========================================
# MONITORING COMMANDS:
# ========================================

# Cek address list blocked customers:
# /ip firewall address-list print where list=blocked_customers

# Cek firewall rules:
# /ip firewall filter print where comment~"Block suspended customers"

# ========================================
# BULK OPERATIONS:
# ========================================

# Isolir multiple IP sekaligus:
# :foreach i in={192.168.1.100;192.168.1.101;192.168.1.102} do={/ip firewall address-list add list=blocked_customers address=$i comment="BULK SUSPEND - [TANGGAL]"}

# Restore semua pelanggan yang diisolir:
# /ip firewall address-list remove [find where list=blocked_customers and comment~"SUSPENDED"]
