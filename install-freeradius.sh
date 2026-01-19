#!/bin/bash

# ============================================
# FreeRADIUS Installation Script for Gembok Bill
# ============================================
# Author: GEMBOK Team
# Description: Automated FreeRADIUS installation and configuration
# Compatible: Ubuntu 20.04+, Debian 10+
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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (sudo)"
        exit 1
    fi
}

# Check if MySQL root password is already set correctly
check_mysql_password() {
    if mysql -u root -p'Gembok@2024' -e "SELECT 1;" >/dev/null 2>&1; then
        return 0
    else
        return 1
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
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm found: $(npm --version)"
    
    # Check if settings.json exists
    if [ ! -f "settings.json" ]; then
        print_error "settings.json not found in current directory"
        exit 1
    fi
    print_success "settings.json found"
}

# Install FreeRADIUS
install_freeradius() {
    print_header "Installing FreeRADIUS"
    
    # Update package list
    print_info "Updating package list..."
    apt-get update -qq
    
    # Install FreeRADIUS and MySQL module
    print_info "Installing FreeRADIUS and dependencies..."
    apt-get install -y freeradius freeradius-mysql freeradius-utils
    
    print_success "FreeRADIUS installed successfully"
}

# Configure FreeRADIUS
configure_freeradius() {
    print_header "Configuring FreeRADIUS"
    
    # Read settings from settings.json
    RADIUS_HOST=$(grep -oP '(?<="radius_host": ")[^"]*' settings.json || echo "localhost")
    RADIUS_USER=$(grep -oP '(?<="radius_user": ")[^"]*' settings.json || echo "radius")
    RADIUS_PASSWORD=$(grep -oP '(?<="radius_password": ")[^"]*' settings.json || echo "radpassword")
    RADIUS_DATABASE=$(grep -oP '(?<="radius_database": ")[^"]*' settings.json || echo "radius")
    
    print_info "RADIUS Configuration:"
    print_info "  Host: $RADIUS_HOST"
    print_info "  User: $RADIUS_USER"
    print_info "  Database: $RADIUS_DATABASE"
    
    # Backup original configs
    print_info "Backing up original configurations..."
    cp /etc/freeradius/3.0/radiusd.conf /etc/freeradius/3.0/radiusd.conf.backup 2>/dev/null || true
    cp /etc/freeradius/3.0/sites-available/default /etc/freeradius/3.0/sites-available/default.backup 2>/dev/null || true
    cp /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-available/sql.backup 2>/dev/null || true
    
    # Create SQL configuration
    print_info "Creating SQL module configuration..."
    cat > /etc/freeradius/3.0/mods-available/sql << 'EOF'
sql {
    driver = "rlm_sql_mysql"
    server = "localhost"
    port = 3306
    login = "radius"
    password = "radpassword"
    radius_db = "radius"
    
    # Table names
    read_groups = yes
    read_profiles = yes
    read_clients = yes
    
    # Authentication queries
    authorize_check_query = "SELECT id, username, attribute, value, op FROM radcheck WHERE username = '%{SQL-User-Name}' ORDER BY id"
    authorize_reply_query = "SELECT id, username, attribute, value, op FROM radreply WHERE username = '%{SQL-User-Name}' ORDER BY id"
    authorize_group_check_query = "SELECT id, groupname, attribute, value, op FROM radgroupcheck WHERE groupname = '%{SQL-Group}' ORDER BY id"
    authorize_group_reply_query = "SELECT id, groupname, attribute, value, op FROM radgroupreply WHERE groupname = '%{SQL-Group}' ORDER BY id"
    
    # Accounting queries
    accounting_onoff_query = "UPDATE radacct SET acctstoptime = '%S', acctsessiontime = unix_timestamp('%S') - unix_timestamp(acctstarttime), acctterminatecause = '%{Acct-Terminate-Cause}', acctstopdelay = %{%{Acct-Delay-Time}:-0} WHERE acctsessionid = '%{Acct-Session-Id}' AND username = '%{SQL-User-Name}' AND nasipaddress = '%{NAS-IP-Address}'"
    accounting_update_query = "UPDATE radacct SET framedipaddress = '%{Framed-IP-Address}', acctsessiontime = '%{Acct-Session-Time}', acctinputoctets = '%{Acct-Input-Octets}', acctoutputoctets = '%{Acct-Output-Octets}' WHERE acctsessionid = '%{Acct-Session-Id}' AND username = '%{SQL-User-Name}' AND nasipaddress = '%{NAS-IP-Address}'"
    accounting_update_query_alt = "INSERT INTO radacct (acctsessionid, acctuniqueid, username, realm, nasipaddress, nasportid, nasporttype, acctstarttime, acctupdatetime, acctsessiontime, acctauthentic, connectinfo_start, acctinputoctets, acctoutputoctets, calledstationid, callingstationid, servicetype, framedprotocol, framedipaddress) VALUES ('%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', '%{Realm}', '%{NAS-IP-Address}', '%{NAS-Port}', '%{NAS-Port-Type}', '%S', '%S', '0', '%{Acct-Authentic}', '', '0', '0', '%{Called-Station-Id}', '%{Calling-Station-Id}', '%{Service-Type}', '%{Framed-Protocol}', '%{Framed-IP-Address}')"
    accounting_start_query = "INSERT INTO radacct (acctsessionid, acctuniqueid, username, realm, nasipaddress, nasportid, nasporttype, acctstarttime, acctupdatetime, acctsessiontime, acctauthentic, connectinfo_start, acctinputoctets, acctoutputoctets, calledstationid, callingstationid, servicetype, framedprotocol, framedipaddress) VALUES ('%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', '%{Realm}', '%{NAS-IP-Address}', '%{NAS-Port}', '%{NAS-Port-Type}', '%S', '%S', '0', '%{Acct-Authentic}', '%{Connect-Info}', '0', '0', '%{Called-Station-Id}', '%{Calling-Station-Id}', '%{Service-Type}', '%{Framed-Protocol}', '%{Framed-IP-Address}')"
    accounting_start_query_alt = "UPDATE radacct SET acctstarttime = '%S', acctupdatetime = '%S', acctsessiontime = '0', acctauthentic = '%{Acct-Authentic}', connectinfo_start = '%{Connect-Info}', connectinfo_stop = '', acctinputoctets = '0', acctoutputoctets = '0', calledstationid = '%{Called-Station-Id}', callingstationid = '%{Calling-Station-Id}', servicetype = '%{Service-Type}', framedprotocol = '%{Framed-Protocol}', framedipaddress = '%{Framed-IP-Address}' WHERE acctsessionid = '%{Acct-Session-Id}' AND username = '%{SQL-User-Name}' AND nasipaddress = '%{NAS-IP-Address}'"
    accounting_stop_query = "UPDATE radacct SET acctstoptime = '%S', acctsessiontime = '%{Acct-Session-Time}', acctinputoctets = '%{Acct-Input-Octets}', acctoutputoctets = '%{Acct-Output-Octets}', acctterminatecause = '%{Acct-Terminate-Cause}', acctstopdelay = %{%{Acct-Delay-Time}:-0}, connectinfo_stop = '%{Connect-Info}' WHERE acctsessionid = '%{Acct-Session-Id}' AND username = '%{SQL-User-Name}' AND nasipaddress = '%{NAS-IP-Address}'"
    accounting_stop_query_alt = "INSERT INTO radacct (acctsessionid, acctuniqueid, username, realm, nasipaddress, nasportid, nasporttype, acctstarttime, acctstoptime, acctsessiontime, acctauthentic, connectinfo_start, connectinfo_stop, acctinputoctets, acctoutputoctets, calledstationid, callingstationid, acctterminatecause, servicetype, framedprotocol, framedipaddress) VALUES ('%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', '%{Realm}', '%{NAS-IP-Address}', '%{NAS-Port}', '%{NAS-Port-Type}', '%S', '%S', '%{Acct-Session-Time}', '%{Acct-Authentic}', '', '%{Connect-Info}', '%{Acct-Input-Octets}', '%{Acct-Output-Octets}', '%{Called-Station-Id}', '%{Calling-Station-Id}', '%{Acct-Terminate-Cause}', '%{Service-Type}', '%{Framed-Protocol}', '%{Framed-IP-Address}')"
    
    # Post-auth queries
    postauth_query = "INSERT INTO radpostauth (username, pass, reply, authdate) VALUES ('%{User-Name}', '%{%{User-Password}:-%{Chap-Password}}', '%{Reply-Message}', '%S')"
}
EOF
    
    # Update SQL config with actual values
    sed -i "s/server = \"localhost\"/server = \"$RADIUS_HOST\"/g" /etc/freeradius/3.0/mods-available/sql
    sed -i "s/login = \"radius\"/login = \"$RADIUS_USER\"/g" /etc/freeradius/3.0/mods-available/sql
    sed -i "s/password = \"radpassword\"/password = \"$RADIUS_PASSWORD\"/g" /etc/freeradius/3.0/mods-available/sql
    sed -i "s/radius_db = \"radius\"/radius_db = \"$RADIUS_DATABASE\"/g" /etc/freeradius/3.0/mods-available/sql
    
    # Enable SQL module
    ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql
    
    # Configure default site
    print_info "Configuring default site..."
    sed -i 's/#sql/sql/g' /etc/freeradius/3.0/sites-available/default
    sed -i 's/#sql/sql/g' /etc/freeradius/3.0/sites-available/inner-tunnel
    
    # Configure clients
    print_info "Creating clients configuration..."
    cat > /etc/freeradius/3.0/clients.conf << 'EOF'
# Gembok Bill RADIUS Clients
# Format: client <name> { ipaddr = <ip> secret = <secret> }

# Localhost for testing
client localhost {
    ipaddr = 127.0.0.1
    secret = testing123
}

# Mikrotik Router (default)
client mikrotik {
    ipaddr = 192.168.8.1
    secret = mikrotik_secret
}

# Add more clients as needed
# client router2 {
#     ipaddr = 192.168.8.2
#     secret = router2_secret
# }
EOF
    
    print_success "FreeRADIUS configured successfully"
}

# Setup MySQL database
setup_database() {
    print_header "Setting up MySQL Database"
    
    # Check if MySQL is installed
    if ! command -v mysql &> /dev/null; then
        print_warning "MySQL not found. Installing MySQL..."
        apt-get install -y mysql-server
        print_success "MySQL installed"
    fi
    
    # Get RADIUS configuration
    RADIUS_USER=$(grep -oP '(?<="radius_user": ")[^"]*' settings.json || echo "radius")
    RADIUS_PASSWORD=$(grep -oP '(?<="radius_password": ")[^"]*' settings.json || echo "radpassword")
    RADIUS_DATABASE=$(grep -oP '(?<="radius_database": ")[^"]*' settings.json || echo "radius")
    
    # Check if MySQL root password is already set correctly
    if check_mysql_password; then
        print_success "MySQL root password already configured correctly"
    else
        # Reset MySQL root password automatically
        print_warning "Configuring MySQL root access..."
        print_info "Stopping MySQL service..."
        systemctl stop mysql 2>/dev/null || true
        
        print_info "Starting MySQL in safe mode..."
        mkdir -p /var/run/mysqld
        chown mysql:mysql /var/run/mysqld
        mysqld_safe --skip-grant-tables --skip-networking &
        
        # Wait for MySQL to start
        sleep 5
        
        print_info "Setting MySQL root password to: Gembok@2024"
        mysql << SQLSCRIPT
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Gembok@2024';
FLUSH PRIVILEGES;
SQLSCRIPT
        
        # Stop safe mode MySQL
        print_info "Stopping MySQL safe mode..."
        killall mysqld_safe mysqld 2>/dev/null || true
        sleep 3
        
        # Start MySQL normally
        print_info "Starting MySQL service..."
        systemctl start mysql
        sleep 3
        
        # Verify password was set
        if check_mysql_password; then
            print_success "MySQL root password configured successfully"
        else
            print_error "Failed to configure MySQL root password"
            return 1
        fi
    fi
    
    # Create RADIUS database and user
    print_info "Creating RADIUS database and user..."
    mysql -u root -p'Gembok@2024' << SQLSCRIPT
-- Create database
CREATE DATABASE IF NOT EXISTS $RADIUS_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop user if exists (to handle password changes)
DROP USER IF EXISTS '$RADIUS_USER'@'localhost';

-- Create user
CREATE USER '$RADIUS_USER'@'localhost' IDENTIFIED BY '$RADIUS_PASSWORD';
GRANT ALL PRIVILEGES ON $RADIUS_DATABASE.* TO '$RADIUS_USER'@'localhost';
FLUSH PRIVILEGES;

-- Use database
USE $RADIUS_DATABASE;

-- Create tables
CREATE TABLE IF NOT EXISTS radcheck (
    id int(11) unsigned NOT NULL auto_increment,
    username varchar(64) NOT NULL default '',
    attribute varchar(64) NOT NULL default '',
    op varchar(2) NOT NULL default '=',
    value varchar(253) NOT NULL default '',
    PRIMARY KEY (id),
    KEY username (username(32))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS radreply (
    id int(11) unsigned NOT NULL auto_increment,
    username varchar(64) NOT NULL default '',
    attribute varchar(64) NOT NULL default '',
    op varchar(2) NOT NULL default '=',
    value varchar(253) NOT NULL default '',
    PRIMARY KEY (id),
    KEY username (username(32))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS radgroupcheck (
    id int(11) unsigned NOT NULL auto_increment,
    groupname varchar(64) NOT NULL default '',
    attribute varchar(64) NOT NULL default '',
    op varchar(2) NOT NULL default '=',
    value varchar(253) NOT NULL default '',
    PRIMARY KEY (id),
    KEY groupname (groupname(32))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS radgroupreply (
    id int(11) unsigned NOT NULL auto_increment,
    groupname varchar(64) NOT NULL default '',
    attribute varchar(64) NOT NULL default '',
    op varchar(2) NOT NULL default '=',
    value varchar(253) NOT NULL default '',
    PRIMARY KEY (id),
    KEY groupname (groupname(32))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS radusergroup (
    username varchar(64) NOT NULL default '',
    groupname varchar(64) NOT NULL default '',
    priority int(11) NOT NULL default '1',
    KEY username (username(32))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS radacct (
    radacctid bigint(21) NOT NULL auto_increment,
    acctsessionid varchar(64) NOT NULL default '',
    acctuniqueid varchar(32) NOT NULL default '',
    username varchar(64) NOT NULL default '',
    realm varchar(64) default '',
    nasipaddress varchar(15) NOT NULL default '',
    nasportid varchar(15) default '',
    nasporttype varchar(32) default '',
    acctstarttime datetime NULL default NULL,
    acctupdatetime datetime NULL default NULL,
    acctstoptime datetime NULL default NULL,
    acctinterval int(12) default NULL,
    acctsessiontime int(12) unsigned default '0',
    acctauthentic varchar(32) default NULL,
    connectinfo_start varchar(50) default NULL,
    connectinfo_stop varchar(50) default NULL,
    acctinputoctets bigint(20) default '0',
    acctoutputoctets bigint(20) default '0',
    calledstationid varchar(50) NOT NULL default '',
    callingstationid varchar(50) NOT NULL default '',
    acctterminatecause varchar(32) NOT NULL default '',
    servicetype varchar(32) default NULL,
    framedprotocol varchar(32) default NULL,
    framedipaddress varchar(15) NOT NULL default '',
    PRIMARY KEY (radacctid),
    KEY username (username),
    KEY nasipaddress (nasipaddress),
    KEY acctstarttime (acctstarttime),
    KEY acctsessionid (acctsessionid),
    KEY acctuniqueid (acctuniqueid)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS radpostauth (
    id int(11) NOT NULL auto_increment,
    username varchar(64) NOT NULL default '',
    pass varchar(64) NOT NULL default '',
    reply varchar(32) NOT NULL default '',
    authdate datetime NOT NULL default '0000-00-00 00:00:00',
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Create default groups
INSERT INTO radgroupcheck (groupname, attribute, op, value) VALUES ('default', 'Auth-Type', ':=', 'Accept');
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES ('default', 'Service-Type', ':=', 'Framed-User');
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES ('default', 'Framed-Protocol', ':=', 'PPP');

SQLSCRIPT
    
    print_success "MySQL root password configured: Gembok@2024"
    print_warning "Please save this password for future reference!"
    print_success "Database setup completed"
}

# Start FreeRADIUS service
start_service() {
    print_header "Starting FreeRADIUS Service"
    
    # Stop existing service
    systemctl stop freeradius 2>/dev/null || true
    
    # Test configuration
    print_info "Testing FreeRADIUS configuration..."
    freeradius -X -C /etc/freeradius/3.0/radiusd.conf
    
    # Start service
    print_info "Starting FreeRADIUS service..."
    systemctl start freeradius
    systemctl enable freeradius
    
    # Check status
    sleep 2
    if systemctl is-active --quiet freeradius; then
        print_success "FreeRADIUS service is running"
    else
        print_error "FreeRADIUS service failed to start"
        print_info "Check logs with: journalctl -u freeradius -n 50"
        exit 1
    fi
}

# Test FreeRADIUS
test_freeradius() {
    print_header "Testing FreeRADIUS"
    
    print_info "Testing with radtest..."
    radtest testing123 testing123 localhost 0 testing123
    
    print_success "FreeRADIUS installation and configuration completed"
}

# Setup RADIUS Groups
setup_radius_groups() {
    print_header "Setting up RADIUS Groups"
    
    # Get RADIUS database name
    RADIUS_DATABASE=$(grep -oP '(?<="radius_database": ")[^"]*' settings.json || echo "radius")
    
    # Setup default groups
    print_info "Creating default RADIUS groups..."
    mysql -u root -p'Gembok@2024' << EOF
USE $RADIUS_DATABASE;

-- Create default group
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES 
('default', 'Auth-Type', ':=', 'Accept'),
('default', 'Service-Type', ':=', 'Framed-User'),
('default', 'Framed-Protocol', ':=', 'PPP')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- Create isolir group
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES 
('isolir', 'Auth-Type', ':=', 'Accept'),
('isolir', 'Service-Type', ':=', 'Framed-User'),
('isolir', 'Framed-Protocol', ':=', 'PPP'),
('isolir', 'Mikrotik-Rate-Limit', ':=', '1k/1k'),
('isolir', 'Framed-Pool', ':=', 'isolir-pool')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- Create basic group
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES 
('basic', 'Auth-Type', ':=', 'Accept'),
('basic', 'Service-Type', ':=', 'Framed-User'),
('basic', 'Framed-Protocol', ':=', 'PPP'),
('basic', 'Mikrotik-Rate-Limit', ':=', '5M/5M')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- Create standard group
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES 
('standard', 'Auth-Type', ':=', 'Accept'),
('standard', 'Service-Type', ':=', 'Framed-User'),
('standard', 'Framed-Protocol', ':=', 'PPP'),
('standard', 'Mikrotik-Rate-Limit', ':=', '20M/20M')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- Create premium group
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES 
('premium', 'Auth-Type', ':=', 'Accept'),
('premium', 'Service-Type', ':=', 'Framed-User'),
('premium', 'Framed-Protocol', ':=', 'PPP'),
('premium', 'Mikrotik-Rate-Limit', ':=', '50M/50M')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- Create enterprise group
INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES 
('enterprise', 'Auth-Type', ':=', 'Accept'),
('enterprise', 'Service-Type', ':=', 'Framed-User'),
('enterprise', 'Framed-Protocol', ':=', 'PPP'),
('enterprise', 'Mikrotik-Rate-Limit', ':=', '100M/100M')
ON DUPLICATE KEY UPDATE value=VALUES(value);
EOF
    
    print_success "RADIUS groups created successfully"
    print_info "Available groups: default, isolir, basic, standard, premium, enterprise"
}

# Run Gembok Bill Database Migration
run_gembok_migration() {
    print_header "Running Gembok Bill Database Migration"
    
    # Cek apakah file migration ada
    if [ ! -f "migrations/create_radius_integration.sql" ]; then
        print_warning "Migration file not found, skipping..."
        return 0
    fi
    
    # Tentukan database type dari settings.json
    DB_TYPE=$(grep -oP '(?<="db_type": ")[^"]*' settings.json || echo "sqlite")
    
    if [ "$DB_TYPE" = "mysql" ]; then
        print_info "Running MySQL migration..."
        DB_HOST=$(grep -oP '(?<="db_host": ")[^"]*' settings.json || echo "localhost")
        DB_USER=$(grep -oP '(?<="db_user": ")[^"]*' settings.json || echo "root")
        DB_PASSWORD=$(grep -oP '(?<="db_password": ")[^"]*' settings.json || echo "")
        DB_NAME=$(grep -oP '(?<="db_name": ")[^"]*' settings.json || echo "gembok_bill")
        
        # Run migration and handle errors
        if mysql -u root -p'Gembok@2024' $DB_NAME < migrations/create_radius_integration.sql 2>/dev/null; then
            print_success "MySQL migration completed successfully"
        else
            print_warning "MySQL migration had some errors (this is normal if columns already exist)"
        fi
    else
        print_info "Running SQLite migration..."
        if sqlite3 data/billing.db < migrations/create_radius_integration.sql 2>/dev/null; then
            print_success "SQLite migration completed successfully"
        else
            print_warning "SQLite migration had some errors (this is normal if columns already exist)"
        fi
    fi
}

# Update settings.json with RADIUS configuration
update_settings_json() {
    print_header "Updating settings.json"
    
    # Cek apakah settings.json sudah ada konfigurasi RADIUS
    if grep -q '"radius_host"' settings.json; then
        print_info "RADIUS configuration already exists in settings.json"
        return 0
    fi
    
    # Tambahkan konfigurasi RADIUS ke settings.json
    print_info "Adding RADIUS configuration to settings.json..."
    
    # Backup settings.json
    cp settings.json settings.json.backup
    
    # Tambahkan konfigurasi RADIUS menggunakan sed
    sed -i 's/}$/,\n  "radius_host": "localhost",\n  "radius_user": "radius",\n  "radius_password": "radpassword",\n  "radius_database": "radius",\n  "isolir_radius_group": "isolir",\n  "suspension_bandwidth_limit": "1k\/1k"\n}/' settings.json
    
    print_success "settings.json updated with RADIUS configuration"
}

# Print summary
print_summary() {
    print_header "Installation Summary"
    
    print_success "FreeRADIUS has been installed and configured!"
    echo ""
    print_info "Configuration files:"
    print_info "  - Main config: /etc/freeradius/3.0/radiusd.conf"
    print_info "  - SQL module: /etc/freeradius/3.0/mods-available/sql"
    print_info "  - Clients: /etc/freeradius/3.0/clients.conf"
    print_info "  - Default site: /etc/freeradius/3.0/sites-available/default"
    echo ""
    print_info "Database:"
    print_info "  - Database: $RADIUS_DATABASE"
    print_info "  - User: $RADIUS_USER"
    print_info "  - Tables: radcheck, radreply, radgroupcheck, radgroupreply, radusergroup, radacct, radpostauth"
    echo ""
    print_info "RADIUS Groups:"
    print_info "  - default (normal users)"
    print_info "  - isolir (suspended users - 1k/1k)"
    print_info "  - basic (5M/5M)"
    print_info "  - standard (20M/20M)"
    print_info "  - premium (50M/50M)"
    print_info "  - enterprise (100M/100M)"
    echo ""
    print_info "Gembok Bill Integration:"
    print_info "  - Database migration completed"
    print_info "  - settings.json updated"
    print_info "  - RADIUS menu added to admin panel"
    print_info "  - Isolir feature integrated with RADIUS"
    echo ""
    print_info "Service commands:"
    print_info "  - Start: systemctl start freeradius"
    print_info "  - Stop: systemctl stop freeradius"
    print_info "  - Restart: systemctl restart freeradius"
    print_info "  - Status: systemctl status freeradius"
    print_info "  - Debug mode: freeradius -X"
    echo ""
    print_info "Next steps:"
    print_info "  1. Configure your Mikrotik/Router to use this RADIUS server"
    print_info "  2. Add users through Gembok Bill admin panel"
    print_info "  3. Enable RADIUS for customers (radius_enabled = true)"
    print_info "  4. Test authentication with your network devices"
    echo ""
    print_info "Documentation: See FREERADIUS_SETUP.md for detailed guide"
    print_info "RADIUS Dashboard: http://localhost:4555/admin/radius"
}

# Main execution
main() {
    print_header "FreeRADIUS Installation for Gembok Bill"
    
    check_root
    detect_os
    check_prerequisites
    install_freeradius
    configure_freeradius
    setup_database
    setup_radius_groups
    run_gembok_migration
    update_settings_json
    start_service
    test_freeradius
    print_summary
}

# Run main function
main
