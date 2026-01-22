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
        print_error "Node.js is not installed. Please install Node.js first."
        print_info "If Node.js is installed but not detected, try running without sudo:"
        print_info "  bash install-freeradius.sh"
        exit 1
    fi

    NODE_VERSION=$($NODE_CMD --version 2>/dev/null || echo "unknown")
    print_success "Node.js found: $NODE_VERSION (path: $NODE_CMD)"

    # Check if npm is installed
    NPM_CMD=""
    if command -v npm &> /dev/null; then
        NPM_CMD="npm"
    elif [ -f "/usr/bin/npm" ]; then
        NPM_CMD="/usr/bin/npm"
    elif [ -f "/usr/local/bin/npm" ]; then
        NPM_CMD="/usr/local/bin/npm"
    elif [ -f "/opt/nodejs/bin/npm" ]; then
        NPM_CMD="/opt/nodejs/bin/npm"
    fi

    if [ -z "$NPM_CMD" ]; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    NPM_VERSION=$($NPM_CMD --version 2>/dev/null || echo "unknown")
    print_success "npm found: $NPM_VERSION (path: $NPM_CMD)"

    # Check if settings.json exists
    if [ ! -f "settings.json" ]; then
        print_error "settings.json not found in current directory"
        exit 1
    fi
    print_success "settings.json found"
}

# Install FreeRADIUS and MySQL/MariaDB
install_freeradius() {
    print_header "Installing FreeRADIUS and Database"
    
    # Update package list
    print_info "Updating package list..."
    apt-get update -qq
    
    # Detect OS and install appropriate database
    if [ "$OS" = "debian" ] || [ "$OS" = "ubuntu" ]; then
        print_info "Detected Debian/Ubuntu - Installing MariaDB (compatible with MySQL)..."
        apt-get install -y mariadb-server mariadb-client
        print_success "MariaDB installed successfully"
    else
        print_info "Installing MySQL..."
        apt-get install -y mysql-server
        print_success "MySQL installed successfully"
    fi
    
    # Install FreeRADIUS and MySQL module
    print_info "Installing FreeRADIUS and dependencies..."
    apt-get install -y freeradius freeradius-mysql freeradius-utils
    
    print_success "FreeRADIUS installed successfully"
}

# Configure FreeRADIUS
configure_freeradius() {
    print_header "Configuring FreeRADIUS"

    # Read settings from settings.json
    DB_TYPE=$(grep -oP '(?<="db_type": ")[^"]*' settings.json || echo "sqlite")
    RADIUS_HOST=$(grep -oP '(?<="radius_host": ")[^"]*' settings.json || echo "localhost")
    RADIUS_USER=$(grep -oP '(?<="radius_user": ")[^"]*' settings.json || echo "radius")
    RADIUS_PASSWORD=$(grep -oP '(?<="radius_password": ")[^"]*' settings.json || echo "radpassword")
    RADIUS_DATABASE=$(grep -oP '(?<="radius_database": ")[^"]*' settings.json || echo "radius")

    print_info "Database Type: $DB_TYPE"
    print_info "RADIUS Configuration:"
    print_info "  Host: $RADIUS_HOST"
    print_info "  User: $RADIUS_USER"
    print_info "  Database: $RADIUS_DATABASE"

    # Backup original configs
    print_info "Backing up original configurations..."
    cp /etc/freeradius/3.0/radiusd.conf /etc/freeradius/3.0/radiusd.conf.backup 2>/dev/null || true
    cp /etc/freeradius/3.0/sites-available/default /etc/freeradius/3.0/sites-available/default.backup 2>/dev/null || true
    cp /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-available/sql.backup 2>/dev/null || true

    # Configure based on database type
    if [ "$DB_TYPE" = "mysql" ]; then
        # Check if MySQL is installed and running
        if ! command -v mysql &> /dev/null; then
            print_warning "MySQL is not installed. Installing MySQL..."
            apt-get install -y mysql-server
        fi

        # Check if MySQL is running
        if ! systemctl is-active --quiet mysql; then
            print_warning "MySQL is not running. Starting MySQL..."
            systemctl start mysql
        fi

    # Create SQL configuration for MySQL
    print_info "Creating SQL module configuration for MySQL..."
    cat > /etc/freeradius/3.0/mods-available/sql <<'EOF'
sql {
    driver = "rlm_sql_mysql"
    dialect = "mysql"
    
    # Connection info
    server = "localhost"
    port = 3306
    login = "radius"
    password = "radpassword"
    radius_db = "radius"
    
    # CRITICAL: Read clients from database
    read_clients = yes
    client_table = "nas"
    
    # Tables
    acct_table1 = "radacct"
    acct_table2 = "radacct"
    postauth_table = "radpostauth"
    authcheck_table = "radcheck"
    groupcheck_table = "radgroupcheck"
    authreply_table = "radreply"
    groupreply_table = "radgroupreply"
    usergroup_table = "radusergroup"
    
    # Clean up stale sessions
    delete_stale_sessions = yes
    
    # Connection pool
    pool {
        start = 5
        min = 4
        max = 10
        spare = 3
        uses = 0
        lifetime = 0
        idle_timeout = 60
        retry_delay = 1
    }
    
    # Helper attribute
    group_attribute = "SQL-Group"
    
    # Include standard queries
    $INCLUDE ${modconfdir}/${.:name}/main/${dialect}/queries.conf
}
EOF

    # Update SQL config with actual values from settings
    sed -i "s/server = \"localhost\"/server = \"$RADIUS_HOST\"/g" /etc/freeradius/3.0/mods-available/sql
    sed -i "s/login = \"radius\"/login = \"$RADIUS_USER\"/g" /etc/freeradius/3.0/mods-available/sql
    sed -i "s/password = \"radpassword\"/password = \"$RADIUS_PASSWORD\"/g" /etc/freeradius/3.0/mods-available/sql
    sed -i "s/radius_db = \"radius\"/radius_db = \"$RADIUS_DATABASE\"/g" /etc/freeradius/3.0/mods-available/sql

    # Enable SQL module
    ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql

    # Configure default site - SIMPLE & ROBUST WAY form ultimate fix
    print_info "Configuring default site..."
    sed -i 's/^[[:space:]]*#[[:space:]]*sql$/\tsql/g' /etc/freeradius/3.0/sites-available/default
    
    # Configure inner-tunnel - SIMPLE & ROBUST WAY
    print_info "Configuring inner-tunnel..."
    sed -i 's/^[[:space:]]*#[[:space:]]*sql$/\tsql/g' /etc/freeradius/3.0/sites-available/inner-tunnel

    print_success "FreeRADIUS configured for MySQL"
    
    # Ensure MikroTik dictionary is available
    print_info "Setting up MikroTik dictionary..."
    if [ ! -f "/usr/share/freeradius/dictionary.mikrotik" ]; then
        print_info "Downloading MikroTik dictionary..."
        wget -q -O /usr/share/freeradius/dictionary.mikrotik https://raw.githubusercontent.com/FreeRADIUS/freeradius-server/master/share/dictionary.mikrotik || print_warning "Failed to download dictionary"
    fi
    
    # Check if include exists, if not add it
    if ! grep -q "dictionary.mikrotik" /usr/share/freeradius/dictionary; then
        print_info "Adding dictionary include..."
        echo '$INCLUDE dictionary.mikrotik' >> /usr/share/freeradius/dictionary
    fi
    print_success "MikroTik dictionary configured"
    else
        # SQLite mode - disable SQL module for now
        print_info "SQLite mode detected - SQL module will be disabled"
        print_warning "FreeRADIUS will use files-based authentication"
        print_warning "For full RADIUS functionality, consider using MySQL"

        # Disable SQL module
        rm -f /etc/freeradius/3.0/mods-enabled/sql

        # Configure default site to not use SQL
        print_info "Configuring default site without SQL..."
        sed -i 's/^sql/#sql/g' /etc/freeradius/3.0/sites-available/default
        sed -i 's/^sql/#sql/g' /etc/freeradius/3.0/sites-available/inner-tunnel

        print_success "FreeRADIUS configured for files-based authentication"
    fi
    
    # Configure clients (Safe version)
    print_info "Creating clients configuration..."
    cat > /etc/freeradius/3.0/clients.conf <<'EOF'
# Gembok Bill RADIUS Clients
# Auto-generated by install script

# Localhost for testing
client localhost {
    ipaddr = 127.0.0.1
    secret = testing123
    nas_type = other
}

# Other clients will be loaded from 'nas' table in database
# because sql module has 'read_clients = yes'
EOF
    
    print_success "FreeRADIUS configured successfully"
}

# Setup MySQL/MariaDB database
setup_database() {
    # Check database type from settings.json
    DB_TYPE=$(grep -oP '(?<="db_type": ")[^"]*' settings.json || echo "sqlite")

    # Skip MySQL setup if using SQLite
    if [ "$DB_TYPE" != "mysql" ]; then
        print_info "SQLite mode detected - skipping MySQL/MariaDB database setup"
        return 0
    fi

    print_header "Setting up MySQL/MariaDB Database"

    # Check if MySQL/MariaDB is installed
    DB_SERVICE="mysql"
    if command -v mariadb &> /dev/null || systemctl list-units --type=service | grep -q mariadb; then
        DB_SERVICE="mariadb"
        print_info "MariaDB detected"
    elif command -v mysql &> /dev/null || systemctl list-units --type=service | grep -q mysql; then
        DB_SERVICE="mysql"
        print_info "MySQL detected"
    else
        print_error "Neither MySQL nor MariaDB is installed"
        return 1
    fi
    
    # Check if database service is running
    if ! systemctl is-active --quiet $DB_SERVICE; then
        print_warning "$DB_SERVICE is not running. Starting..."
        systemctl start $DB_SERVICE
        sleep 3
    fi
    
    # Enable service
    systemctl enable $DB_SERVICE
    
    # Get database configuration
    DB_HOST=$(grep -oP '(?<="db_host": ")[^"]*' settings.json || echo "localhost")
    DB_USER=$(grep -oP '(?<="db_user": ")[^"]*' settings.json || echo "root")
    DB_PASSWORD=$(grep -oP '(?<="db_password": ")[^"]*' settings.json || echo "")
    DB_NAME=$(grep -oP '(?<="db_name": ")[^"]*' settings.json || echo "gembok_bill")
    
    # Get RADIUS configuration
    RADIUS_USER=$(grep -oP '(?<="radius_user": ")[^"]*' settings.json || echo "radius")
    RADIUS_PASSWORD=$(grep -oP '(?<="radius_password": ")[^"]*' settings.json || echo "radpassword")
    RADIUS_DATABASE=$(grep -oP '(?<="radius_database": ")[^"]*' settings.json || echo "radius")
    
    # Setup root user with empty password (for compatibility with settings.json)
    print_info "Configuring database root access..."
    
    # Try to connect with empty password
    if mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database root access already configured"
    else
        print_info "Setting up database root access with empty password..."
        
        # Stop database service
        print_info "Stopping database service..."
        systemctl stop $DB_SERVICE 2>/dev/null || true
        sleep 2
        
        # Start in safe mode
        print_info "Starting database in safe mode..."
        mkdir -p /var/run/mysqld
        chown mysql:mysql /var/run/mysqld 2>/dev/null || true
        mysqld_safe --skip-grant-tables --skip-networking &
        
        # Wait for database to start
        sleep 5
        
        # Set password to empty
        print_info "Setting root password to empty..."
        mysql << SQLSCRIPT
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
SQLSCRIPT
        
        # Stop safe mode
        print_info "Stopping safe mode..."
        killall mysqld_safe mysqld 2>/dev/null || true
        sleep 3
        
        # Start normally
        print_info "Starting database service..."
        systemctl start $DB_SERVICE
        sleep 3
        
        # Verify
        if mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
            print_success "Database root access configured successfully"
        else
            print_error "Failed to configure database root access"
            return 1
        fi
    fi
    
    # Create Gembok Bill database
    print_info "Creating Gembok Bill database..."
    mysql -u root << SQLSCRIPT
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQLSCRIPT
    print_success "Database $DB_NAME created"
    
    # Create RADIUS clients table in gembok_bill database
    print_info "Creating RADIUS clients table..."
    mysql -u root << SQLSCRIPT
USE $DB_NAME;

CREATE TABLE IF NOT EXISTS radius_clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ipaddr VARCHAR(255) NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL,
    shortname VARCHAR(255),
    nas_type VARCHAR(50) DEFAULT 'other',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO radius_clients (name, ipaddr, secret, shortname, nas_type) VALUES
('localhost', '127.0.0.1', 'testing123', 'localhost', 'other'),
('mikrotik', '192.168.8.1', 'mikrotik_secret', 'mikrotik', 'other');

CREATE INDEX IF NOT EXISTS idx_radius_clients_ipaddr ON radius_clients(ipaddr);
CREATE INDEX IF NOT EXISTS idx_radius_clients_active ON radius_clients(is_active);
SQLSCRIPT
    print_success "RADIUS clients table created"
    
    # Create RADIUS database and user
    print_info "Creating RADIUS database and user..."
    mysql -u root << SQLSCRIPT
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

-- Create nas table for RADIUS clients
CREATE TABLE IF NOT EXISTS nas (
    id int(10) NOT NULL auto_increment,
    nasname varchar(128) NOT NULL,
    shortname varchar(32),
    type varchar(30) DEFAULT 'other',
    ports int(5),
    secret varchar(60) DEFAULT 'secret' NOT NULL,
    server varchar(64),
    community varchar(50),
    description varchar(200) DEFAULT 'RADIUS Client',
    PRIMARY KEY (id),
    KEY nasname (nasname)
) ENGINE=InnoDB;

-- Clean up any existing duplicate entries (keep smallest ID)
DELETE t1 FROM nas t1
INNER JOIN nas t2 
WHERE t1.id > t2.id 
AND t1.nasname = t2.nasname;

-- Insert or Update default NAS entries
INSERT INTO nas (nasname, shortname, type, secret, description) VALUES 
('127.0.0.1', 'localhost', 'other', 'testing123', 'Localhost for testing')
ON DUPLICATE KEY UPDATE 
    shortname='localhost', 
    type='other', 
    secret='testing123', 
    description='Localhost for testing';

INSERT INTO nas (nasname, shortname, type, secret, description) VALUES 
('192.168.8.1', 'mikrotik', 'other', 'mikrotik_secret', 'Mikrotik Router')
ON DUPLICATE KEY UPDATE 
    shortname='mikrotik', 
    type='other', 
    secret='mikrotik_secret', 
    description='Mikrotik Router';

-- Create default groups if they don't exist
INSERT INTO radgroupcheck (groupname, attribute, op, value) VALUES ('default', 'Auth-Type', ':=', 'Accept')
ON DUPLICATE KEY UPDATE attribute=attribute;

INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES ('default', 'Service-Type', ':=', 'Framed-User')
ON DUPLICATE KEY UPDATE attribute=attribute;

INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES ('default', 'Framed-Protocol', ':=', 'PPP')
ON DUPLICATE KEY UPDATE attribute=attribute;

SELECT 'Current NAS Clients:' as Info;
SELECT nasname, shortname, type, secret, description FROM nas;
SQLSCRIPT
    
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
    mysql -u root << EOF
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
    
    # Tentukan database type dari settings.json
    DB_TYPE=$(grep -oP '(?<="db_type": ")[^"]*' settings.json || echo "sqlite")
    
    # Run create_radius_integration.sql
    if [ -f "migrations/create_radius_integration.sql" ]; then
        print_info "Running RADIUS integration migration..."
        if [ "$DB_TYPE" = "mysql" ]; then
            print_info "Running MySQL migration..."
            DB_HOST=$(grep -oP '(?<="db_host": ")[^"]*' settings.json || echo "localhost")
            DB_USER=$(grep -oP '(?<="db_user": ")[^"]*' settings.json || echo "root")
            DB_PASSWORD=$(grep -oP '(?<="db_password": ")[^"]*' settings.json || echo "")
            DB_NAME=$(grep -oP '(?<="db_name": ")[^"]*' settings.json || echo "gembok_bill")
            
            if mysql -u root $DB_NAME < migrations/create_radius_integration.sql 2>/dev/null; then
                print_success "MySQL RADIUS integration migration completed successfully"
            else
                print_warning "MySQL migration had some errors (this is normal if columns already exist)"
            fi
        else
            print_info "Running SQLite migration..."
            if sqlite3 data/billing.db < migrations/create_radius_integration.sql 2>/dev/null; then
                print_success "SQLite RADIUS integration migration completed successfully"
            else
                print_warning "SQLite migration had some errors (this is normal if columns already exist)"
            fi
        fi
    else
        print_warning "Migration file create_radius_integration.sql not found, skipping..."
    fi
    
    # Run create_radius_clients_table.sql
    if [ -f "migrations/create_radius_clients_table.sql" ]; then
        print_info "Running RADIUS clients table migration..."
        if [ "$DB_TYPE" = "mysql" ]; then
            print_info "Running MySQL migration..."
            DB_HOST=$(grep -oP '(?<="db_host": ")[^"]*' settings.json || echo "localhost")
            DB_USER=$(grep -oP '(?<="db_user": ")[^"]*' settings.json || echo "root")
            DB_PASSWORD=$(grep -oP '(?<="db_password": ")[^"]*' settings.json || echo "")
            DB_NAME=$(grep -oP '(?<="db_name": ")[^"]*' settings.json || echo "gembok_bill")
            
            if mysql -u root $DB_NAME < migrations/create_radius_clients_table.sql 2>/dev/null; then
                print_success "MySQL RADIUS clients table migration completed successfully"
            else
                print_warning "MySQL migration had some errors (this is normal if table already exists)"
            fi
        else
            print_info "Running SQLite migration..."
            if sqlite3 data/billing.db < migrations/create_radius_clients_table.sql 2>/dev/null; then
                print_success "SQLite RADIUS clients table migration completed successfully"
            else
                print_warning "SQLite migration had some errors (this is normal if table already exists)"
            fi
        fi
    else
        print_warning "Migration file create_radius_clients_table.sql not found, skipping..."
    fi
}

# Fix FreeRADIUS SQL configuration
fix_freeradius_sql_config() {
    print_header "Fixing FreeRADIUS SQL Configuration"

    # Tambahkan sql_user_name ke konfigurasi SQL
    print_info "Adding sql_user_name to FreeRADIUS SQL configuration..."

    if grep -q "sql_user_name" /etc/freeradius/3.0/mods-available/sql; then
        print_info "sql_user_name already configured"
    else
        # Tambahkan sql_user_name setelah radius_db
        sed -i '/radius_db = "radius"/a\    sql_user_name = "%{User-Name}"' /etc/freeradius/3.0/mods-available/sql
        print_success "sql_user_name added to FreeRADIUS SQL configuration"
    fi

    # Restart FreeRADIUS
    print_info "Restarting FreeRADIUS..."
    systemctl restart freeradius
    print_success "FreeRADIUS restarted"
}

# Generate NT-Password for RADIUS users
generate_nt_passwords() {
    print_header "Generating NT-Passwords for RADIUS Users"

    # Install smbclient untuk generate NT-Password
    if ! command -v smbclient &> /dev/null; then
        print_info "Installing smbclient for NT-Password generation..."
        apt install -y smbclient > /dev/null 2>&1
    fi

    # Get all users with Cleartext-Password but no NT-Password
    print_info "Checking users without NT-Password..."

    USERS=$(mysql -u root $RADIUS_DATABASE -N -e "SELECT DISTINCT username FROM radcheck WHERE attribute='Cleartext-Password' AND username NOT IN (SELECT username FROM radcheck WHERE attribute='NT-Password');" 2>/dev/null)

    if [ -z "$USERS" ]; then
        print_info "All users already have NT-Password"
        return 0
    fi

    for USERNAME in $USERS; do
        # Get cleartext password
        PASSWORD=$(mysql -u root $RADIUS_DATABASE -N -e "SELECT value FROM radcheck WHERE username='$USERNAME' AND attribute='Cleartext-Password';" 2>/dev/null)

        if [ -z "$PASSWORD" ]; then
            print_warning "No password found for user $USERNAME"
            continue
        fi

        # Generate NT-Password
        NT_PASSWORD=$(echo -n "$PASSWORD" | iconv -t UTF-16LE 2>/dev/null | openssl md4 2>/dev/null | awk '{print $2}')

        if [ -z "$NT_PASSWORD" ]; then
            print_warning "Failed to generate NT-Password for user $USERNAME"
            continue
        fi

        # Add NT-Password to database
        mysql -u root $RADIUS_DATABASE -e "INSERT INTO radcheck (username, attribute, op, value) VALUES ('$USERNAME', 'NT-Password', ':=', '$NT_PASSWORD');" 2>/dev/null

        if [ $? -eq 0 ]; then
            print_success "NT-Password generated for user $USERNAME"
        else
            print_warning "Failed to add NT-Password for user $USERNAME"
        fi
    done

    print_success "NT-Password generation completed"
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

# Migrate SQLite to MySQL
migrate_sqlite_to_mysql() {
    # Tentukan database type dari settings.json
    DB_TYPE=$(grep -oP '(?<="db_type": ")[^"]*' settings.json || echo "sqlite")

    # Skip jika bukan MySQL
    if [ "$DB_TYPE" != "mysql" ]; then
        print_info "SQLite mode detected - skipping migration"
        return 0
    fi

    # Check if SQLite database exists
    if [ ! -f "data/billing.db" ]; then
        print_info "No SQLite database found. Skipping migration."
        return 0
    fi

    # Check if migration already done
    if mysql -u root -p'Gembok@2024' -e "USE gembok_bill; SELECT COUNT(*) FROM customers;" >/dev/null 2>&1; then
        print_warning "MySQL database already has data. Skipping migration."
        print_info "If you want to re-migrate, please drop the database first."
        return 0
    fi

    print_header "Migrating SQLite to MySQL"

    print_info "This will migrate all data from SQLite to MySQL"
    print_info "Backup will be created automatically"

    # Get MySQL configuration
    DB_HOST=$(grep -oP '(?<="db_host": ")[^"]*' settings.json || echo "localhost")
    DB_USER=$(grep -oP '(?<="db_user": ")[^"]*' settings.json || echo "root")
    DB_PASSWORD=$(grep -oP '(?<="db_password": ")[^"]*' settings.json || echo "")
    DB_NAME=$(grep -oP '(?<="db_name": ")[^"]*' settings.json || echo "gembok_bill")

    # Backup SQLite database
    print_info "Backing up SQLite database..."
    BACKUP_FILE="data/billing_backup_$(date +%Y%m%d_%H%M%S).db"
    cp data/billing.db "$BACKUP_FILE"
    print_success "Backup created: $BACKUP_FILE"

    # Create MySQL database
    print_info "Creating MySQL database..."
    mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    print_success "Database $DB_NAME created"

    # Export SQLite schema and data
    print_info "Exporting SQLite data..."
    sqlite3 data/billing.db .dump > /tmp/gembokbill_migration.sql
    print_success "SQLite data exported"

    # Get table count
    TABLE_COUNT=$(sqlite3 data/billing.db "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" | wc -l)
    print_info "Found $TABLE_COUNT tables"

    # Convert SQLite SQL to MySQL compatible format
    print_info "Converting SQLite SQL to MySQL format..."
    sed -i 's/INTEGER PRIMARY KEY AUTOINCREMENT/INT AUTO_INCREMENT PRIMARY KEY/g' /tmp/gembokbill_migration.sql
    sed -i 's/INTEGER PRIMARY KEY/INT PRIMARY KEY/g' /tmp/gembokbill_migration.sql
    sed -i 's/INTEGER/INT/g' /tmp/gembokbill_migration.sql
    sed -i 's/TEXT/VARCHAR(255)/g' /tmp/gembokbill_migration.sql
    sed -i 's/BLOB/BLOB/g' /tmp/gembokbill_migration.sql
    sed -i 's/REAL/DOUBLE/g' /tmp/gembokbill_migration.sql
    sed -i 's/BOOLEAN/TINYINT(1)/g' /tmp/gembokbill_migration.sql
    sed -i 's/DATETIME/DATETIME/g' /tmp/gembokbill_migration.sql
    sed -i 's/CREATE TABLE/CREATE TABLE IF NOT EXISTS/g' /tmp/gembokbill_migration.sql
    sed -i 's/INSERT INTO/INSERT IGNORE INTO/g' /tmp/gembokbill_migration.sql

    # Remove SQLite specific statements
    sed -i '/^BEGIN TRANSACTION;/d' /tmp/gembokbill_migration.sql
    sed -i '/^COMMIT;/d' /tmp/gembokbill_migration.sql
    sed -i '/^CREATE UNIQUE INDEX/d' /tmp/gembokbill_migration.sql
    sed -i '/^CREATE INDEX/d' /tmp/gembokbill_migration.sql

    # Add MySQL specific statements at the beginning
    cat > /tmp/gembokbill_mysql.sql << 'HEADER'
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
HEADER

    cat /tmp/gembokbill_migration.sql >> /tmp/gembokbill_mysql.sql

    # Add MySQL specific statements at the end
    cat >> /tmp/gembokbill_mysql.sql << 'FOOTER'
SET FOREIGN_KEY_CHECKS = 1;
FOOTER

    print_success "SQL converted to MySQL format"

    # Import data to MySQL
    print_info "Importing data to MySQL..."
    mysql -u root "$DB_NAME" < /tmp/gembokbill_mysql.sql

    if [ $? -eq 0 ]; then
        print_success "Data imported to MySQL successfully"
    else
        print_error "Failed to import data to MySQL"
        print_warning "Some errors may have occurred during import, but data might still be valid"
    fi

    # Verify migration
    print_info "Verifying migration..."
    MYSQL_TABLE_COUNT=$(mysql -u root "$DB_NAME" -N -e "SHOW TABLES;" | wc -l)
    print_info "SQLite tables: $TABLE_COUNT"
    print_info "MySQL tables: $MYSQL_TABLE_COUNT"

    if [ "$MYSQL_TABLE_COUNT" -ge "$TABLE_COUNT" ]; then
        print_success "Migration verification passed"
    else
        print_warning "Some tables may not have been migrated"
    fi

    # Show sample data
    print_info "Sample data from MySQL:"
    mysql -u root "$DB_NAME" -e "SELECT COUNT(*) as total_customers FROM customers;" 2>/dev/null || print_warning "Could not query customers table"

    print_success "Migration completed successfully!"
    print_info "Backup files:"
    print_info "  - SQLite backup: $BACKUP_FILE"
    print_info "  - Migration SQL: /tmp/gembokbill_migration.sql"
    print_info "  - MySQL SQL: /tmp/gembokbill_mysql.sql"
    print_warning "Please verify your data before deleting the SQLite database"
}

# Configure Firewall for RADIUS
configure_firewall() {
    print_header "Configuring Firewall for RADIUS"
    
    # Check if firewall is active
    if command -v ufw &> /dev/null; then
        print_info "Configuring UFW firewall..."
        
        # Allow RADIUS ports
        ufw allow 1812/udp comment 'RADIUS Authentication' 2>/dev/null || true
        ufw allow 1813/udp comment 'RADIUS Accounting' 2>/dev/null || true
        
        # Show status
        print_success "UFW rules added for RADIUS"
        ufw status | grep -E "1812|1813" || print_info "UFW may not be enabled"
        
    elif command -v iptables &> /dev/null; then
        print_info "Configuring iptables..."
        
        # Check if rules already exist
        if ! iptables -C INPUT -p udp --dport 1812 -j ACCEPT 2>/dev/null; then
            iptables -A INPUT -p udp --dport 1812 -j ACCEPT
            print_success "Added iptables rule for port 1812"
        else
            print_info "iptables rule for port 1812 already exists"
        fi
        
        if ! iptables -C INPUT -p udp --dport 1813 -j ACCEPT 2>/dev/null; then
            iptables -A INPUT -p udp --dport 1813 -j ACCEPT
            print_success "Added iptables rule for port 1813"
        else
            print_info "iptables rule for port 1813 already exists"
        fi
        
        # Save iptables rules
        if command -v iptables-save &> /dev/null; then
            iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
            print_success "iptables rules saved"
        fi
        
    else
        print_warning "No firewall detected (ufw or iptables)"
        print_info "RADIUS ports 1812/udp and 1813/udp should be open"
    fi
    
    print_success "Firewall configuration completed"
}

# Main execution
main() {
    clear
    print_company_header
    print_header "FreeRADIUS Installation for Gembok Bill"

    check_root
    detect_os
    check_prerequisites
    install_freeradius
    configure_freeradius
    setup_database
    configure_firewall
    setup_radius_groups

    # Check if migration is needed
    DB_TYPE=$(grep -oP '(?<="db_type": ")[^"]*' settings.json || echo "sqlite")
    if [ "$DB_TYPE" = "mysql" ] && [ -f "data/billing.db" ]; then
        migrate_sqlite_to_mysql
    fi

    run_gembok_migration
    update_settings_json
    start_service

    # Fix FreeRADIUS SQL configuration
    fix_freeradius_sql_config

    # Generate NT-Passwords for RADIUS users
    generate_nt_passwords

    test_freeradius
    print_summary
}

# Run main function
main
