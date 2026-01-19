#!/bin/bash

# ========================================
# GENIEACS ENVIRONMENT FIX SCRIPT
# ========================================

echo "🔧 Fixing GenieACS environment for TR-069 session issues..."

# 1. Update GenieACS environment variables
echo "📝 Updating GenieACS environment variables..."

# Create or update GenieACS environment file
cat > /etc/genieacs/.env << EOF
# GenieACS Configuration for TR-069 Session Fix

# Session Management
GENIEACS_SESSION_TIMEOUT=300000
GENIEACS_CONNECTION_TIMEOUT=60000
GENIEACS_KEEP_ALIVE_INTERVAL=30000
GENIEACS_MAX_RETRIES=3
GENIEACS_RETRY_DELAY=5000

# Network Configuration
GENIEACS_TCP_KEEP_ALIVE=true
GENIEACS_TCP_KEEP_ALIVE_INTERVAL=30000
GENIEACS_TCP_KEEP_ALIVE_PROBES=3
GENIEACS_SOCKET_TIMEOUT=120000
GENIEACS_SOCKET_BUFFER_SIZE=65536

# Connection Pooling
GENIEACS_MAX_CONNECTIONS=100
GENIEACS_CONNECTION_POOL_SIZE=10

# Error Handling
GENIEACS_RETRY_ON_TERMINATION=true
GENIEACS_MAX_RETRY_ATTEMPTS=3
GENIEACS_LOG_LEVEL=debug
GENIEACS_ENABLE_SESSION_MONITORING=true

# Provision Script Optimization
GENIEACS_BATCH_SIZE=50
GENIEACS_BATCH_DELAY=1000
GENIEACS_GROUP_PARAMETERS=true
GENIEACS_SKIP_INVALID_PARAMS=true
GENIEACS_VALIDATE_PARAMS=true

# Database Configuration
GENIEACS_DB_CONNECTION_TIMEOUT=30000
GENIEACS_DB_POOL_SIZE=10
GENIEACS_DB_MAX_RETRIES=3

# Logging Configuration
GENIEACS_LOG_LEVEL=info
GENIEACS_LOG_FILE=/var/log/genieacs/genieacs.log
GENIEACS_LOG_MAX_SIZE=100MB
GENIEACS_LOG_MAX_FILES=5
EOF

# 2. Update systemd service files
echo "🔧 Updating systemd service files..."

# Update GenieACS CWMP service
cat > /etc/systemd/system/genieacs-cwmp.service << EOF
[Unit]
Description=GenieACS CWMP Server
After=network.target

[Service]
Type=simple
User=genieacs
Group=genieacs
WorkingDirectory=/opt/genieacs
ExecStart=/usr/bin/node /opt/genieacs/bin/cwmp
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/etc/genieacs/.env

# Resource limits
LimitNOFILE=65536
LimitNPROC=32768

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/genieacs /opt/genieacs

[Install]
WantedBy=multi-user.target
EOF

# Update GenieACS FS service
cat > /etc/systemd/system/genieacs-fs.service << EOF
[Unit]
Description=GenieACS FS Server
After=network.target

[Service]
Type=simple
User=genieacs
Group=genieacs
WorkingDirectory=/opt/genieacs
ExecStart=/usr/bin/node /opt/genieacs/bin/fs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/etc/genieacs/.env

# Resource limits
LimitNOFILE=65536
LimitNPROC=32768

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/genieacs /opt/genieacs

[Install]
WantedBy=multi-user.target
EOF

# 3. Update nginx configuration for GenieACS
echo "🌐 Updating nginx configuration..."

cat > /etc/nginx/sites-available/genieacs << EOF
server {
    listen 80;
    server_name your-genieacs-domain.com;
    
    # Increase client body size
    client_max_body_size 100M;
    
    # Increase timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    
    # Enable keep alive
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    
    # GenieACS API
    location /api/ {
        proxy_pass http://localhost:7557;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase buffer sizes
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # GenieACS UI
    location / {
        proxy_pass http://localhost:7557;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# TR-069 ACS Server
server {
    listen 7547;
    server_name your-genieacs-domain.com;
    
    # TR-069 specific settings
    client_max_body_size 10M;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    
    location / {
        proxy_pass http://localhost:7557;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # TR-069 specific headers
        proxy_set_header SOAPAction "";
        proxy_set_header Content-Type "text/xml; charset=utf-8";
    }
}
EOF

# 4. Update system limits
echo "⚙️ Updating system limits..."

# Update limits.conf
cat >> /etc/security/limits.conf << EOF
# GenieACS limits
genieacs soft nofile 65536
genieacs hard nofile 65536
genieacs soft nproc 32768
genieacs hard nproc 32768
EOF

# Update sysctl.conf
cat >> /etc/sysctl.conf << EOF
# Network optimization for GenieACS
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr
EOF

# Apply sysctl changes
sysctl -p

# 5. Restart services
echo "🔄 Restarting services..."

# Reload systemd
systemctl daemon-reload

# Restart GenieACS services
systemctl restart genieacs-cwmp
systemctl restart genieacs-fs
systemctl restart genieacs-nbi

# Restart nginx
systemctl restart nginx

# 6. Check service status
echo "✅ Checking service status..."
systemctl status genieacs-cwmp
systemctl status genieacs-fs
systemctl status genieacs-nbi

echo "🎉 GenieACS configuration fix completed!"
echo "📋 Next steps:"
echo "1. Monitor logs: tail -f /var/log/genieacs/cwmp.log"
echo "2. Test TR-069 connection: telnet localhost 7547"
echo "3. Check device connectivity from CPE"
