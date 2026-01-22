#!/bin/bash

# ============================================
# Gembok Bill Radius - Automated Installation Script
# ============================================
# Author: GEMBOK Team
# Description: One-click installation for Gembok Bill with MySQL
# Compatible: Ubuntu 20.04+, Debian 10+, CentOS 7+
# Note: Script is idempotent - can be run multiple times safely
# ============================================

# Don't exit on error - handle errors manually
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Print company header
print_company_header() {
    echo -e "${GREEN}"
    echo -e "╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}   ${YELLOW}Mode by ALIJAYA-NET${NC}               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${YELLOW}Info  : 081947215703${NC}               ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo -e "${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (sudo)"
        exit 1
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
    
    print_info "Detected OS: $OS $OS_VERSION"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if Node.js is installed
    NODE_CMD=""
    if command -v node &> /dev/null; then
        NODE_CMD="node"
    elif command -v nodejs &> /dev/null; then
        NODE_CMD="nodejs"
    elif [ -f "/usr/bin/node" ]; then
        NODE_CMD="/usr/bin/node"
    elif [ -f "/usr/local/bin/node" ]; then
        NODE_CMD="/usr/local/bin/node"
    elif [ -f "/opt/nodejs/bin/node" ]; then
        NODE_CMD="/opt/nodejs/bin/node"
    fi

    if [ -z "$NODE_CMD" ]; then
        print_error "Node.js is not installed. Installing now..."
        install_nodejs
    else
        NODE_VERSION=$($NODE_CMD --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 20 ]; then
            print_warning "Node.js version is $NODE_VERSION (required: 20+). Updating..."
            install_nodejs
        else
            print_success "Node.js $NODE_VERSION installed"
        fi
    fi

    # Check if MySQL is installed
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL is not installed. Installing now..."
        install_mysql
    else
        print_success "MySQL installed"
    fi

    # Check if MySQL is running
    if ! systemctl is-active --quiet mysql; then
        print_warning "MySQL is not running. Starting..."
        systemctl start mysql
        systemctl enable mysql
        print_success "MySQL started"
    fi
}

# Install Node.js 20+
install_nodejs() {
    print_header "Installing Node.js 20+"

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        print_info "Installing Node.js 20.x for Ubuntu/Debian..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        print_info "Installing Node.js 20.x for CentOS/RHEL..."
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi

    # Verify installation
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION installed"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
}

# Install MySQL
install_mysql() {
    print_header "Installing MySQL Server"

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        print_info "Installing MySQL for Ubuntu/Debian..."
        sudo apt update
        sudo apt install -y mysql-server mysql-client
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        print_info "Installing MySQL for CentOS/RHEL..."
        sudo yum install -y mysql-server mysql
    fi

    # Start MySQL
    sudo systemctl start mysql
    sudo systemctl enable mysql

    print_success "MySQL installed and started"
}

# Setup MySQL database
setup_mysql_database() {
    print_header "Setting up MySQL Database"

    # Read MySQL credentials from settings.json
    MYSQL_USER=$(grep -o '"db_user": "[^"]*"' settings.json | grep -o '"[^"]*"$' | tr -d '"')
    MYSQL_PASSWORD=$(grep -o '"db_password": "[^"]*"' settings.json | grep -o '"[^"]*"$' | tr -d '"')

    # Default to root if not found in settings
    if [ -z "$MYSQL_USER" ]; then
        MYSQL_USER="root"
    fi

    print_info "Using MySQL user: $MYSQL_USER"

    # Create database and user
    print_info "Creating database and user..."
    
    # Generate random password for gembokbill user
    GEMBOK_PASSWORD=$(openssl rand -base64 16 | tr -d '/=' | head -c 16)
    
    if [ -z "$MYSQL_PASSWORD" ]; then
        mysql -u $MYSQL_USER << EOF
CREATE DATABASE IF NOT EXISTS gembok_bill CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gembokbill'@'localhost' IDENTIFIED BY '$GEMBOK_PASSWORD';
GRANT ALL PRIVILEGES ON gembok_bill.* TO 'gembokbill'@'localhost';
FLUSH PRIVILEGES;
EOF
    else
        mysql -u $MYSQL_USER -p"$MYSQL_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS gembok_bill CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gembokbill'@'localhost' IDENTIFIED BY '$GEMBOK_PASSWORD';
GRANT ALL PRIVILEGES ON gembok_bill.* TO 'gembokbill'@'localhost';
FLUSH PRIVILEGES;
EOF
    fi

    print_success "Database and user created"
    print_info "Database: gembok_bill"
    print_info "User: gembokbill"
    print_warning "Please save this password securely!"

    # Save credentials to file
    echo "MYSQL_USER=$MYSQL_USER" > .mysql-credentials
    echo "MYSQL_PASSWORD=$MYSQL_PASSWORD" >> .mysql-credentials
    echo "GEMBOKBILL_PASSWORD=$GEMBOK_PASSWORD" >> .mysql-credentials
    chmod 600 .mysql-credentials
}

# Install application dependencies
install_app_dependencies() {
    print_header "Installing Application Dependencies"

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the gembokbill-radius directory."
        exit 1
    fi

    print_info "Installing Node.js dependencies..."
    npm install

    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        print_info "Installing PM2 for production..."
        
        # Try installing with sudo first
        if command -v npm &> /dev/null; then
            sudo npm install -g pm2
        fi
        
        # If sudo failed, try without sudo (for cases where user is already root)
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
        fi
        
        if command -v pm2 &> /dev/null; then
            print_success "PM2 installed"
        else
            print_error "Failed to install PM2. Please install manually: npm install -g pm2"
            exit 1
        fi
    else
        print_success "PM2 already installed"
    fi
}

# Create settings.json
create_settings() {
    print_header "Creating Configuration File"

    # Load MySQL credentials
    if [ -f ".mysql-credentials" ]; then
        source .mysql-credentials
    fi

    # Use server template if available
    if [ -f "settings.server.template.json" ]; then
        print_info "Using settings.server.template.json as base..."
        cp settings.server.template.json settings.json
    elif [ -f "settings.json.example" ]; then
        print_info "Using settings.json.example as base..."
        cp settings.json.example settings.json
    else
        print_error "No settings template found. Creating basic settings.json..."
        cat > settings.json << 'EOF'
{
  "db_type": "mysql",
  "db_host": "localhost",
  "db_user": "gembokbill",
  "db_password": "",
  "db_name": "gembok_bill",
  "radius_host": "localhost",
  "radius_user": "radius",
  "radius_password": "radpassword",
  "mikrotik_host": "192.168.1.1",
  "mikrotik_user": "admin",
  "mikrotik_password": "password",
  "port": 3000,
  "host": "0.0.0.0"
}
EOF
    fi

    # Update MySQL password in settings.json
    if [ -n "$GEMBOKBILL_PASSWORD" ]; then
        print_info "Updating MySQL password in settings.json..."
        sed -i "s/\"db_password\": \"\"/\"db_password\": \"$GEMBOKBILL_PASSWORD\"/" settings.json
        print_success "MySQL password updated in settings.json"
    fi

    print_success "settings.json created"
    print_warning "You can update settings via the web admin panel after installation"
}

# Initialize database
initialize_database() {
    print_header "Initializing Database"

    # Check if setup script exists
    if [ -f "scripts/new-server-setup-mysql.js" ]; then
        print_info "Running new server setup script..."
        node scripts/new-server-setup-mysql.js
        print_success "Database initialized"
    elif [ -f "migrate-to-mysql-comprehensive.js" ]; then
        print_info "Running comprehensive migration..."
        node migrate-to-mysql-comprehensive.js
        print_success "Database initialized"
    else
        print_error "No database initialization script found"
        exit 1
    fi
}

# Install FreeRADIUS (optional)
install_freeradius() {
    print_header "Installing FreeRADIUS (Optional)"

    print_info "Do you want to install FreeRADIUS? (y/n)"
    read -r INSTALL_FREERADIUS

    if [ "$INSTALL_FREERADIUS" = "y" ] || [ "$INSTALL_FREERADIUS" = "Y" ]; then
        print_info "Installing FreeRADIUS..."
        
        if [ -f "install-freeradius.sh" ]; then
            sudo bash install-freeradius.sh
            print_success "FreeRADIUS installed"
        else
            print_warning "install-freeradius.sh not found. Skipping..."
        fi
    else
        print_info "Skipping FreeRADIUS installation"
    fi
}

# Read settings.json
read_settings() {
    # Default values
    APP_PORT=3000
    APP_HOST="0.0.0.0"

    if [ -f "settings.json" ]; then
        # Extract server_port from settings.json (handle both string and number formats)
        APP_PORT=$(grep -o '"server_port": "[0-9]*"' settings.json | grep -o '[0-9]*')
        if [ -z "$APP_PORT" ]; then
            APP_PORT=$(grep -o '"server_port": [0-9]*' settings.json | grep -o '[0-9]*')
        fi
        # Fallback to port if server_port not found
        if [ -z "$APP_PORT" ]; then
            APP_PORT=$(grep -o '"port": "[0-9]*"' settings.json | grep -o '[0-9]*')
        fi
        if [ -z "$APP_PORT" ]; then
            APP_PORT=$(grep -o '"port": [0-9]*' settings.json | grep -o '[0-9]*')
        fi
        
        # Extract server_host from settings.json
        APP_HOST=$(grep -o '"server_host": "[^"]*"' settings.json | grep -o '"[^"]*"$' | tr -d '"')
        # Fallback to host if server_host not found
        if [ -z "$APP_HOST" ]; then
            APP_HOST=$(grep -o '"host": "[^"]*"' settings.json | grep -o '"[^"]*"$' | tr -d '"')
        fi
    fi

    print_info "Using port: $APP_PORT"
    print_info "Using host: $APP_HOST"
}

# Setup firewall
setup_firewall() {
    print_header "Configuring Firewall"

    print_info "Configuring firewall for Gembok Bill..."

    # Read settings to get port
    read_settings

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        # Ubuntu/Debian (UFW)
        if command -v ufw &> /dev/null; then
            sudo ufw allow 22/tcp
            sudo ufw allow $APP_PORT/tcp
            sudo ufw --force enable
            print_success "Firewall configured (UFW)"
        else
            print_warning "UFW not found. Skipping firewall configuration."
        fi
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        # CentOS/RHEL (firewalld)
        if command -v firewall-cmd &> /dev/null; then
            sudo firewall-cmd --permanent --add-port=$APP_PORT/tcp
            sudo firewall-cmd --permanent --add-port=22/tcp
            sudo firewall-cmd --reload
            print_success "Firewall configured (firewalld)"
        else
            print_warning "firewalld not found. Skipping firewall configuration."
        fi
    fi
}

# Create backup script
create_backup_script() {
    print_header "Creating Backup Script"

    cat > /home/backup-gembokbill.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/backups/gembokbill"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u gembokbill -pPASSWORD gembokbill > $BACKUP_DIR/gembokbill_$DATE.sql
find $BACKUP_DIR -name "gembokbill_*.sql" -mtime +7 -delete
EOF

    chmod +x /home/backup-gembokbill.sh

    # Schedule daily backup
    (crontab -l 2>/dev/null; echo "0 2 * * * /home/backup-gembokbill.sh") | crontab -

    print_success "Backup script created and scheduled"
}

# Start application
start_application() {
    print_header "Starting Application"

    print_info "Starting Gembok Bill with PM2..."

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 not installed. Please run: sudo npm install -g pm2"
        exit 1
    fi

    # Start application
    pm2 start app.js --name "gembokbill" || pm2 restart gembokbill
    pm2 save

    # Setup PM2 startup
    pm2 startup

    print_success "Application started"
}

# Display access information
display_access_info() {
    print_header "Access Information"

    # Read settings to get port
    read_settings

    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $2}')
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"
    fi

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Installation Complete!${NC}"
    echo -e "${GREEN}========================================${NC}\n"

    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  Admin Dashboard:  http://$SERVER_IP:$APP_PORT/admin"
    echo -e "  Technician Portal: http://$SERVER_IP:$APP_PORT/technician"
    echo -e "  Collector Portal:  http://$SERVER_IP:$APP_PORT/collector"
    echo -e "  Customer Portal:  http://$SERVER_IP:$APP_PORT/customer"
    echo -e ""

    echo -e "${BLUE}Default Login:${NC}"
    echo -e "  Username: admin"
    echo -e "  Password: admin123"
    echo -e ""

    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Access the admin dashboard"
    echo -e "  2. Change the default password immediately"
    echo -e "  3. Configure Mikrotik settings (if applicable)"
    echo -e "  4. Setup WhatsApp (if needed)"
    echo -e "  5. Add customers and packages"
    echo -e ""

    echo -e "${BLUE}Management Commands:${NC}"
    echo -e "  View logs:     pm2 logs gembokbill"
    echo -e "  Restart:      pm2 restart gembokbill"
    echo -e "  Stop:         pm2 stop gembokbill"
    echo -e "  Start:        pm2 start gembokbill"
    echo -e "  Status:       pm2 status gembokbill"
    echo -e ""

    echo -e "${BLUE}Documentation:${NC}"
    echo -e "  README.md              - Complete documentation"
    echo -e "  INSTALL_NEW_SERVER.md - Detailed installation guide"
    echo -e "  DEPLOYMENT_GUIDE.md    - Deployment guide"
    echo -e ""
}

# Main installation flow
main() {
    clear
    print_company_header
    echo -e "${BLUE}"
    echo -e "╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}   ${GREEN}Gembok Bill Radius - Installation${NC}   ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo -e ""

    check_root
    detect_os
    check_prerequisites
    install_app_dependencies
    setup_mysql_database
    create_settings
    initialize_database
    install_freeradius
    setup_firewall
    create_backup_script
    start_application
    display_access_info

    echo -e "${GREEN}✓ Installation completed successfully!${NC}\n"
}

# Run main function
main
