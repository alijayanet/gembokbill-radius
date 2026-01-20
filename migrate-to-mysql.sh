#!/bin/bash

# ============================================
# SQLite to MySQL Migration Script for Gembok Bill
# ============================================
# Author: GEMBOK Team
# Description: Migrate all data from SQLite to MySQL
# Compatible: Gembok Bill with RADIUS integration
# ============================================

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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if SQLite database exists
    if [ ! -f "data/billing.db" ]; then
        print_error "SQLite database not found at data/billing.db"
        exit 1
    fi
    print_success "SQLite database found"

    # Check if MySQL is installed
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL is not installed. Please install MySQL first."
        exit 1
    fi
    print_success "MySQL found"

    # Check if sqlite3 is installed
    if ! command -v sqlite3 &> /dev/null; then
        print_error "sqlite3 is not installed. Installing sqlite3..."
        apt-get install -y sqlite3
    fi
    print_success "sqlite3 found"
}

# Read MySQL configuration from settings.json
read_mysql_config() {
    print_header "Reading MySQL Configuration"

    DB_HOST=$(grep -oP '(?<="db_host": ")[^"]*' settings.json || echo "localhost")
    DB_USER=$(grep -oP '(?<="db_user": ")[^"]*' settings.json || echo "root")
    DB_PASSWORD=$(grep -oP '(?<="db_password": ")[^"]*' settings.json || echo "Gembok@2024")
    DB_NAME=$(grep -oP '(?<="db_name": ")[^"]*' settings.json || echo "gembok_bill")

    print_info "MySQL Configuration:"
    print_info "  Host: $DB_HOST"
    print_info "  User: $DB_USER"
    print_info "  Database: $DB_NAME"
}

# Test MySQL connection
test_mysql_connection() {
    print_info "Testing MySQL connection..."

    if mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -e "SELECT 1;" &> /dev/null; then
        print_success "MySQL connection successful"
    else
        print_error "Failed to connect to MySQL. Please check your credentials."
        exit 1
    fi
}

# Create MySQL database
create_mysql_database() {
    print_header "Creating MySQL Database"

    mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

    print_success "Database $DB_NAME created"
}

# Export SQLite schema and data
export_sqlite_data() {
    print_header "Exporting SQLite Data"

    # Export schema and data to SQL file
    sqlite3 data/billing.db .dump > /tmp/gembokbill_migration.sql

    if [ $? -eq 0 ]; then
        print_success "SQLite data exported to /tmp/gembokbill_migration.sql"
    else
        print_error "Failed to export SQLite data"
        exit 1
    fi

    # Show number of tables
    TABLE_COUNT=$(sqlite3 data/billing.db ".tables" | wc -w)
    print_info "Found $TABLE_COUNT tables in SQLite database"
}

# Convert SQLite SQL to MySQL compatible format
convert_sqlite_to_mysql() {
    print_header "Converting SQLite SQL to MySQL Format"

    INPUT_FILE="/tmp/gembokbill_migration.sql"
    OUTPUT_FILE="/tmp/gembokbill_mysql.sql"

    # Convert SQLite specific syntax to MySQL
    sed -i 's/INTEGER PRIMARY KEY AUTOINCREMENT/INT AUTO_INCREMENT PRIMARY KEY/g' "$INPUT_FILE"
    sed -i 's/INTEGER PRIMARY KEY/INT PRIMARY KEY/g' "$INPUT_FILE"
    sed -i 's/INTEGER/INT/g' "$INPUT_FILE"
    sed -i 's/TEXT/VARCHAR(255)/g' "$INPUT_FILE"
    sed -i 's/BLOB/BLOB/g' "$INPUT_FILE"
    sed -i 's/REAL/DOUBLE/g' "$INPUT_FILE"
    sed -i 's/BOOLEAN/TINYINT(1)/g' "$INPUT_FILE"
    sed -i 's/DATETIME/DATETIME/g' "$INPUT_FILE"
    sed -i 's/CREATE TABLE/CREATE TABLE IF NOT EXISTS/g' "$INPUT_FILE"
    sed -i 's/INSERT INTO/INSERT IGNORE INTO/g' "$INPUT_FILE"

    # Remove SQLite specific statements
    sed -i '/^BEGIN TRANSACTION;/d' "$INPUT_FILE"
    sed -i '/^COMMIT;/d' "$INPUT_FILE"
    sed -i '/^CREATE UNIQUE INDEX/d' "$INPUT_FILE"
    sed -i '/^CREATE INDEX/d' "$INPUT_FILE"

    # Add MySQL specific statements at the beginning
    cat > "$OUTPUT_FILE" << 'HEADER'
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
HEADER

    cat "$INPUT_FILE" >> "$OUTPUT_FILE"

    # Add MySQL specific statements at the end
    cat >> "$OUTPUT_FILE" << 'FOOTER'
SET FOREIGN_KEY_CHECKS = 1;
FOOTER

    print_success "SQL converted to MySQL format"
}

# Import data to MySQL
import_to_mysql() {
    print_header "Importing Data to MySQL"

    mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" < /tmp/gembokbill_mysql.sql

    if [ $? -eq 0 ]; then
        print_success "Data imported to MySQL successfully"
    else
        print_error "Failed to import data to MySQL"
        print_warning "Some errors may have occurred during import, but data might still be valid"
    fi
}

# Verify migration
verify_migration() {
    print_header "Verifying Migration"

    # Count tables in MySQL
    MYSQL_TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" -N -e "SHOW TABLES;" | wc -l)

    # Count tables in SQLite
    SQLITE_TABLE_COUNT=$(sqlite3 data/billing.db ".tables" | wc -w)

    print_info "SQLite tables: $SQLITE_TABLE_COUNT"
    print_info "MySQL tables: $MYSQL_TABLE_COUNT"

    if [ "$MYSQL_TABLE_COUNT" -ge "$SQLITE_TABLE_COUNT" ]; then
        print_success "Migration verification passed"
    else
        print_warning "Some tables may not have been migrated"
    fi

    # Show some sample data
    print_info "Sample data from MySQL:"
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" -e "SELECT COUNT(*) as total_users FROM customers;" 2>/dev/null || print_warning "Could not query customers table"
}

# Backup SQLite database
backup_sqlite() {
    print_header "Backing Up SQLite Database"

    BACKUP_FILE="data/billing_backup_$(date +%Y%m%d_%H%M%S).db"

    cp data/billing.db "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        print_success "SQLite database backed up to $BACKUP_FILE"
    else
        print_error "Failed to backup SQLite database"
        exit 1
    fi
}

# Main execution
main() {
    print_header "SQLite to MySQL Migration for Gembok Bill"

    check_root
    check_prerequisites
    read_mysql_config
    test_mysql_connection
    backup_sqlite
    create_mysql_database
    export_sqlite_data
    convert_sqlite_to_mysql
    import_to_mysql
    verify_migration

    print_header "Migration Complete"

    print_success "Migration completed successfully!"
    echo ""
    print_info "Next steps:"
    print_info "  1. Update settings.json to use MySQL (db_type: \"mysql\")"
    print_info "  2. Restart the application: pm2 restart gembok-bill-radius"
    print_info "  3. Test the application to ensure everything works"
    echo ""
    print_info "Backup files:"
    print_info "  - SQLite backup: $BACKUP_FILE"
    print_info "  - Migration SQL: /tmp/gembokbill_migration.sql"
    print_info "  - MySQL SQL: /tmp/gembokbill_mysql.sql"
    echo ""
    print_warning "Please verify your data before deleting the SQLite database"
}

# Run main function
main
