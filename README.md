\u003c!-- Improved modern README with vibrant colors and enhanced structure --\u003e
\u003cdiv align="center"\u003e
  \u003cimg src="public/img/logo.png" alt="Gembok Bill Logo" width="120" height="120"\u003e
  
  # Gembok Bill Radius
  **Integrated ISP Management System with RADIUS Server**
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![License](https://img.shields.io/badge/license-ISC-blue?style=for-the-badge)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](https://github.com/alijayanet/gembokbill-radius/pulls)
  [![GitHub Stars](https://img.shields.io/github/stars/alijayanet/gembokbill-radius?style=for-the-badge)](https://github.com/alijayanet/gembokbill-radius/stargazers)
  [![Version](https://img.shields.io/badge/v2.2.0-orange?style=for-the-badge)](https://github.com/alijayanet/gembokbill-radius/releases)
\u003c/div\u003e

## 🌐 About Gembok Bill

**Gembok Bill** is an integrated ISP management system designed to manage billing, customer service, and network operations through WhatsApp integration. This system provides end-to-end solutions for Internet Service Provider management with advanced features.

### 🚀 Main Features

- **📱 WhatsApp Gateway**: Customer interaction, voucher delivery, trouble reporting, and automated notifications
- **📡 GenieACS Integration**: Centralized CPE (Customer Premises Equipment) management
- **🔗 Mikrotik PPPoE & Hotspot Management**: User authentication and real-time bandwidth control
- **💳 Billing System**: Automated invoice generation payment tracking, and remittance
- **👥 Agent & Technician Management**: Flexible roles, access control, and job assignment
- **📂 Database Migration**: SQL-based schema updates for continuous development
- **🗺️ Cable Network Mapping**: Visual management of ODP, poles, and cable layouts

### 💬 WhatsApp Commands

The system supports WhatsApp LID (Lidded ID) registration for enhanced security and customer identification.

#### For Customers

| Command | Format | Description |
|---------|--------|-------------|
| **REG** | `REG [nama/nomor]` | Link WhatsApp LID to existing customer account |
| **DAFTAR** | `DAFTAR [Nama]#[NoHP]#[Alamat]#[ID_Paket]` | Register as new customer with complete data |
| **STATUS** | `STATUS` | Check billing and service status |
| **MENU** | `MENU` | Display available customer commands |

**Examples:**
```
REG Budi Santoso
REG 081234567890
DAFTAR Agus Setiawan#08123456789#Jl. Melati No 5#1
```

#### For Admins

| Command | Format | Description |
|---------|--------|-------------|
| **SETLID** | `SETLID [password]` | Save admin WhatsApp LID to settings (requires admin password) |
| **MENU** | `MENU` or `ADMIN` | Display admin menu |

**Examples:**
```
SETLID admin123
```

> **Note:** Admin password is configured in `settings.json` as `admin_password`

> **Security:** WhatsApp LID ensures secure identification even if phone numbers change format

## 🛠️ Technologies Used

| Category | Technology |
|----------|-----------|
| **Backend** | Node.js, Express |
| **Database** | SQLite (development), MySQL (production), FreeRADIUS |
| **Frontend** | EJS, HTML5, CSS3, JavaScript, Bootstrap 5 |
| **WhatsApp** | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) |
| **Network** | Node-routeros for Mikrotik, FreeRADIUS |
| **Payment** | Midtrans, Xendit, Tripay |
| **Logging** | Winston, Pino |

## 📋 System Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 6.0.0
- **Database** SQLite (for development) or MySQL (for production)
- **FreeRADIUS** >= 3.0 (for RADIUS authentication)
- **WhatsApp Business Access** (for WhatsApp Gateway features)
- **Mikrotik RouterOS** >= 6.x (for network management)
- **PM2** (for production process management)

## 🚀 Quick Installation

### 1. Clone Repository
```bash
git clone https://github.com/alijayanet/gembokbill-radius.git
```
```bash
cd gembokbill-radius
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure RADIUS Server

#### Install FreeRADIUS (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install freeradius freeradius-mysql freeradius-utils
```

#### Configure FreeRADIUS Database
```bash
# Create RADIUS database
mysql -u root -p -e "CREATE DATABASE radius;"

# Import FreeRADIUS schema
mysql -u root -p radius < /etc/freeradius/3.0/mods-config/sql/main/mysql/schema.sql
```

#### Configure FreeRADIUS Settings
Edit `/etc/freeradius/3.0/mods-config/sql/main/mysql/authorize`:
```sql
authorize_check_query = "\
    SELECT id, username, attribute, value, op \
    FROM ${authcheck_table} \
    WHERE username = '%{SQL-User-Name}' \
    ORDER BY id"
```

Edit `/etc/freeradius/3.0/mods-config/sql/main/mysql/accounting`:
```sql
accounting_update_query = "\
    UPDATE ${accounting_table} \
    SET \
        acctinputoctets = '%{%{Acct-Input-Octets}:-0}' + COALESCE(acctinputoctets, 0), \
        acctoutputoctets = '%{%{Acct-Output-Octets}:-0}' + COALESCE(acctoutputoctets, 0), \
        acctsessiontime = '%{Acct-Session-Time:-0}', \
        acctterminatecause = '%{Acct-Terminate-Cause}', \
        acctstopdelay = '%{%{Acct-Delay-Time:-0}}', \
        acctstoptime = FROM_UNIXTIME('%{Acct-Stop-Time:-%s}'), \
        acctupdatecause = 'Queue' \
    WHERE acctuniqueid = '%{Acct-Unique-Session-Id}' \
    AND username = '%{SQL-User-Name}' \
    AND acctstarttime <= FROM_UNIXTIME('%{Acct-Session-Time:-%s}')"
```

#### Start FreeRADIUS
```bash
sudo systemctl restart freeradius
sudo systemctl enable freeradius
sudo systemctl status freeradius
```

### 4. Configure Application Settings

Edit `settings.json` and update the following RADIUS-related settings:

```json
{
  "radius_host": "localhost",
  "radius_user": "radius",
  "radius_password": "radpassword",
  "radius_database": "radius",
  "radius_auth_port": 1812,
  "radius_acct_port": 1813
}
```

### 5. Configure Mikrotik RADIUS Client

#### Add RADIUS Client in Mikrotik
```
Radius → New
Name: gembok-radius
Address: [IP Server Gembok Bill]
Secret: [RADIUS Secret dari settings.json]
```

#### Configure PPPoE to use RADIUS
```
PPP → Secrets → PPP Authentication & Accounting → Use Radius: Yes
```

#### Configure Hotspot to use RADIUS
```
IP → Hotspot → Server Profile → Login → Use Radius: Yes
```

### 6. Initialize Database
```bash
npm run setup
```

### 7. Run Database Migration (Important for New Servers)
To ensure all required tables and columns exist in the database, run migration commands:

```bash
# Run all database migrations
node scripts/run-all-migrations.js

# Verify database structure
node scripts/verify-production-database.js
```

### 8. Access the Application

After starting the application, you can access different portals through these URLs:

#### 🔐 Login Portals

| Portal | URL | Default Credentials |
|--------|-----|-------------------|
| **Customer Portal** | `http://localhost:4555/customer/login` | Use customer username & phone |
| **Admin Portal** | `http://localhost:4555/admin/login` | Username: `admin` / Password: `admin` |
| **Admin Mobile** | `http://localhost:4555/admin/login/mobile` | Same as admin portal |
| **Agent Portal** | `http://localhost:4555/agent/login` | Register agent first via admin |
| **Technician Portal** | `http://localhost:4555/technician/login` | Register technician via admin |
| **Technician (ID)** | `http://localhost:4555/teknisi/login` | Same as technician portal |
| **Collector Portal** | `http://localhost:4555/collector/login` | Register collector via admin |

#### 🔐 RADIUS Management Portal

| Portal | URL | Description |
|--------|-----|-------------|
| **RADIUS Dashboard** | `http://localhost:4555/admin/radius` | RADIUS server management and user management |
| **RADIUS Users** | `http://localhost:4555/admin/radius/users` | CRUD RADIUS users with attributes |
| **RADIUS Groups** | `http://localhost:4555/admin/radius/groups` | Manage RADIUS user groups |
| **RADIUS Attributes** | `http://localhost:4555/admin/radius/attributes` | Manage RADIUS attributes |

#### 📱 Public Features

| Feature | URL | Description |
|---------|-----|-------------|
| **Voucher Purchase** | `http://localhost:4555/voucher` | Public voucher purchase page |
| **Trouble Report** | `http://localhost:4555/customer/trouble` | Customer trouble reporting |
| **WhatsApp Status** | `http://localhost:4555/whatsapp/status` | Check WhatsApp connection status |
| **API Health Check** | `http://localhost:4555/health` | Server health status |

> **Note:** Replace `localhost:4555` with your server IP/domain. Port `4555` can be changed in `settings.json`

> **Security:** Change default admin credentials immediately after first login via Settings menu

### 9. Run Application
```bash
# For production with PM2
pm2 start app.js --name gembok-bill-radius
pm2 save
pm2 startup

# For development
npm run dev
```

## 📁 Project Structure

```
gembok-bill/
├── app.js                  # Application entry point
├── package.json            # Dependencies and scripts
├── config/                 # Configuration files
├── data/                   # Database files and backups
├── migrations/             # Database migration files
├── public/                 # Static files (CSS, JS, images)
├── routes/                 # API endpoints
├── scripts/                # Utility scripts
├── utils/                  # Utility functions
└── views/                  # EJS templates
```

## 📖 Complete Documentation

| Document | Description |
|---------|-----------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Complete guide for deployment on new servers |
| [DATA_README.md](DATA_README.md) | Information about data management |
| [WHATSAPP_SETUP.md](WHATSAPP_SETUP.md) | WhatsApp Gateway configuration |
| [WHATSAPP_FIX_SUMMARY.md](WHATSAPP_FIX_SUMMARY.md) | WhatsApp fixes summary |
| [DATABASE_MIGRATION_SUMMARY.md](DATABASE_MIGRATION_SUMMARY.md) | Database migration summary |
| [RADIUS_SETUP_GUIDE.md](RADIUS_SETUP_GUIDE.md) | RADIUS server setup and configuration guide |

## 🔧 RADIUS Server Configuration

### RADIUS User Management

The system provides a comprehensive RADIUS user management interface accessible at `/admin/radius`. Features include:

- **User CRUD**: Create, Read, Update, Delete RADIUS users
- **Attribute Management**: Manage RADIUS attributes (Framed-IP-Address, Session-Timeout, etc.)
- **Group Management**: Organize users into groups with common attributes
- **Password Management**: Secure password hashing and management
- **Session Tracking**: Monitor active RADIUS sessions

### RADIUS Attributes

Common RADIUS attributes supported:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `Cleartext-Password` | Plain text password | `mypassword` |
| `Framed-IP-Address` | Static IP assignment | `192.168.1.100` |
| `Framed-IP-Netmask` | Netmask for static IP | `255.255.255.255` |
| `Session-Timeout` | Session duration in seconds | `86400` (24 hours) |
| `Idle-Timeout` | Idle timeout in seconds | `3600` (1 hour) |
| `Mikrotik-Rate-Limit` | Bandwidth limit | `10M/10M` |
| `Framed-Pool` | IP pool name | `pppoe_pool` |

### RADIUS Integration with Mikrotik

#### PPPoE Authentication Flow

1. User connects to PPPoE server
2. Mikrotik sends authentication request to RADIUS
3. RADIUS validates credentials from database
4. RADIUS returns attributes (IP, bandwidth, etc.)
5. Mikrotik applies attributes to user session
6. Accounting data sent to RADIUS during session

#### Hotspot Authentication Flow

1. User connects to hotspot
2. User enters credentials in login page
3. Hotspot sends authentication request to RADIUS
4. RADIUS validates credentials from database
5. RADIUS returns session attributes
6. User is authenticated and granted access

### Troubleshooting RADIUS

#### RADIUS Connection Failed

```bash
# Check FreeRADIUS status
sudo systemctl status freeradius

# Check FreeRADIUS logs
sudo tail -f /var/log/freeradius/radius.log

# Test RADIUS connection
radtest username password localhost 1812 testing123
```

#### User Authentication Failed

1. Check if user exists in RADIUS database
2. Verify password is correct
3. Check RADIUS attributes are properly configured
4. Verify Mikrotik RADIUS client settings
5. Check firewall allows RADIUS ports (1812, 1813)

#### Accounting Not Working

1. Verify accounting is enabled in Mikrotik
2. Check RADIUS accounting database table
3. Verify RADIUS secret matches between server and client
4. Check network connectivity

## 🔄 System Update

### Update via Admin Panel

The system supports automatic updates via Git integration:

1. Login to admin panel
2. Navigate to bottom of sidebar
3. Enter branch name (default: `main`)
4. Click "Check Update" to see available updates
5. Click "Update & Restart" to apply updates

**Repository URL**: `https://github.com/alijayanet/gembokbill-radius`

### Update Manual via Git

```bash
git fetch --all --prune
git reset --hard origin/main
npm install
pm2 restart gembok-bill-radius
```

## 🎯 How to Contribute

We welcome contributions from the community! Here's how to contribute:

1. **Fork** this repository
2. Create a **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

### Contribution Guidelines
- Follow the existing code style
- Add documentation for new features
- Ensure all tests pass
- Update README if necessary

## 📞 Support

If you need assistance:

- Create an **issue** at [GitHub Issues](https://github.com/alijayanet/gembok-bill/issues)
- Contact the development team via email
- Join the Discord community (if available)

## 📄 License

This project is licensed under the ISC license - see the [LICENSE](LICENSE) file for more details.

## 👥 Development Team

- **ALIJAYA Team** - [@alijayanet](https://github.com/alijayanet)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped develop this project
- The open source community for inspiration and support

---
\u003cdiv align="center"\u003e
  
  💻 Developed with ❤️ for the ISP community
  
  [Report Bug](https://github.com/alijayanet/gembok-bill/issues) · [Request Feature](https://github.com/alijayanet/gembok-bill/issues) · [Documentation](DEPLOYMENT_GUIDE.md)
  

\u003c/div\u003e