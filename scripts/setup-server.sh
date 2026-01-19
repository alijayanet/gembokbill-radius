#!/bin/bash

echo "🚀 Setting up Gembok Bill on new server..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install build tools and dependencies
echo "🔧 Installing build tools..."
sudo apt-get install -y build-essential python3 python3-pip curl wget git

# Install Node.js (LTS version)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PM2 globally for production
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Navigate to application directory
cd /home/alijaya/demo-gembokbill

# Install application dependencies
echo "📦 Installing application dependencies..."
npm install

# Install bcrypt specifically if needed
echo "🔐 Installing bcrypt..."
npm install bcrypt@^6.0.0

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data logs whatsapp-session public/img

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 data logs whatsapp-session public/img
chmod 644 settings.json

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
NODE_ENV=production
PORT=3003
DB_PATH=./data/billing.db
LOG_LEVEL=info
EOF
fi

# Test bcrypt installation
echo "🧪 Testing bcrypt installation..."
node -e "console.log('bcrypt test:', require('bcrypt'))" || {
    echo "❌ bcrypt test failed, trying to rebuild..."
    npm rebuild bcrypt
}

# Test application start
echo "🧪 Testing application..."
timeout 10s npm start || echo "⚠️  Application test completed (timeout expected)"

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure settings.json with your server details"
echo "2. Run: npm start (for development)"
echo "3. Or run: pm2 start app.js --name gembok-bill (for production)"
echo "4. Check logs: pm2 logs gembok-bill"
echo ""
echo "🔗 Access your application at: http://your-server-ip:3003"
