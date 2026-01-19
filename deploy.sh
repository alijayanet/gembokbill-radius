#!/bin/bash

# 🚀 Gembok Bill Auto Deployment Script
# Mengotomatisasi proses deployment dari GitHub ke server production
# Updated: 2025-01-27

set -e  # Exit on any error

echo "🚀 Starting Gembok Bill deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function untuk logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Update sistem packages
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install sistem dependencies untuk native modules
log_info "Installing system dependencies..."
sudo apt install -y curl git build-essential python3-dev libsqlite3-dev

# 3. Install Node.js 20.x jika belum ada
if ! command -v node &> /dev/null || ! node --version | grep -q "v20"; then
    log_info "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js installed: $(node --version)"
else
    log_success "Node.js already installed: $(node --version)"
fi

# 4. Update dari GitHub
log_info "Pulling latest changes from GitHub..."
git pull origin main

# 5. Install dependencies dengan postinstall script
log_info "Installing Node.js dependencies..."
npm install

# 6. Rebuild native modules untuk sistem ini
log_info "Rebuilding native modules for this system..."
npm rebuild

# 7. Buat direktori yang diperlukan
log_info "Creating required directories..."
mkdir -p data/backup
mkdir -p logs
mkdir -p whatsapp-session

# 8. Set permissions
log_info "Setting permissions..."
chmod 755 data/
chmod 755 logs/
chmod 755 whatsapp-session/
chmod 644 settings.json

# 9. Test aplikasi
log_info "Testing application..."
timeout 5s npm start || true

if [ $? -eq 124 ]; then
    log_success "Application started successfully (terminated after 5s test)"
elif [ $? -eq 0 ]; then
    log_error "Application failed to start - check configuration"
    exit 1
fi

# 10. Install PM2 jika belum ada
if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    sudo npm install -g pm2
fi

# 11. Setup PM2 untuk production
log_info "Setting up PM2 for production..."
pm2 stop gembok-bill || true
pm2 delete gembok-bill || true
pm2 start app.js --name gembok-bill

# 12. Setup PM2 startup script
log_info "Setting up PM2 startup script..."
pm2 startup
pm2 save

# 13. Display status dan informasi
log_success "Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "  - Admin Portal: http://$(curl -s ifconfig.me || echo 'SERVER_IP'):3002/admin/login"
echo "  - Customer Portal: http://$(curl -s ifconfig.me || echo 'SERVER_IP'):3002"
echo ""
echo "🔧 Management Commands:"
echo "  - Check status: pm2 status gembok-bill"
echo "  - View logs: pm2 logs gembok-bill"
echo "  - Restart: pm2 restart gembok-bill"
echo "  - Stop: pm2 stop gembok-bill"
echo ""
echo "🔍 Troubleshooting:"
echo "  - SQLite3 errors: npm rebuild"
echo "  - Build from source: npm install sqlite3 --build-from-source"
echo "  - Check dependencies: npm run check-deps"
echo ""
echo "📋 Next steps:"
echo "  1. Configure settings.json with your credentials"
echo "  2. Setup WhatsApp bot by scanning QR code"
echo "  3. Test all features"
echo ""
echo "🎯 Gembok Bill is now running on port 3002!"
echo "   Check: $(curl -s ifconfig.me || echo 'SERVER_IP'):3002"

# 14. Verifikasi
log_info "Verifying deployment..."
pm2 status gembok-bill

echo ""
log_success "🎉 Deploy selesai! Aplikasi siap digunakan."
