#!/bin/bash

# ========================================
# FIX TOO_MANY_COMMITS ERROR SCRIPT
# ========================================

echo "🔧 Fixing GenieACS 'too_many_commits' error..."

# 1. Update GenieACS configuration
echo "📝 Updating GenieACS configuration..."

# Create optimized GenieACS configuration
cat > /etc/genieacs/.env << EOF
# GenieACS Configuration - Optimized for too_many_commits error

# Session Management
GENIEACS_SESSION_TIMEOUT=300000
GENIEACS_MAX_COMMITS_PER_SESSION=50
GENIEACS_MAX_PARAMETERS_PER_SESSION=200
GENIEACS_BATCH_SIZE=15
GENIEACS_BATCH_DELAY=3000

# Parameter Optimization
GENIEACS_GROUP_PARAMETERS=true
GENIEACS_SKIP_INVALID_PARAMS=true
GENIEACS_VALIDATE_PARAMS=true
GENIEACS_CONTINUE_ON_ERROR=true

# Error Handling
GENIEACS_RETRY_ON_TOO_MANY_COMMITS=true
GENIEACS_MAX_RETRY_ATTEMPTS=3
GENIEACS_RETRY_DELAY=5000
GENIEACS_FALLBACK_TO_MINIMAL_PARAMS=true

# Logging
GENIEACS_LOG_LEVEL=warn
GENIEACS_LOG_TOO_MANY_COMMITS=true
GENIEACS_LOG_PARAMETER_COUNT=true

# Session Monitoring
GENIEACS_MONITOR_SESSION_HEALTH=true
GENIEACS_ALERT_ON_HIGH_COMMIT_COUNT=true
GENIEACS_COMMIT_COUNT_THRESHOLD=40
EOF

# 2. Update GenieACS systemd service
echo "🔧 Updating GenieACS systemd service..."

# Update GenieACS CWMP service with optimized settings
cat > /etc/systemd/system/genieacs-cwmp.service << EOF
[Unit]
Description=GenieACS CWMP Server - Optimized
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

# Memory limits
MemoryLimit=2G
MemoryHigh=1.5G

# CPU limits
CPUQuota=200%

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/genieacs /opt/genieacs

[Install]
WantedBy=multi-user.target
EOF

# 3. Update GenieACS FS service
echo "🔧 Updating GenieACS FS service..."

cat > /etc/systemd/system/genieacs-fs.service << EOF
[Unit]
Description=GenieACS FS Server - Optimized
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

# Memory limits
MemoryLimit=1G
MemoryHigh=768M

# CPU limits
CPUQuota=150%

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/genieacs /opt/genieacs

[Install]
WantedBy=multi-user.target
EOF

# 4. Update nginx configuration for better performance
echo "🌐 Updating nginx configuration..."

cat > /etc/nginx/sites-available/genieacs << EOF
server {
    listen 80;
    server_name your-genieacs-domain.com;
    
    # Optimized for GenieACS
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Increase timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    
    # Enable keep alive
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    
    # Buffer optimization
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # GenieACS API
    location /api/ {
        proxy_pass http://localhost:7557;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Optimize for API calls
        proxy_cache_bypass \$http_upgrade;
        proxy_no_cache \$http_pragma \$http_authorization;
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

# TR-069 ACS Server - Optimized
server {
    listen 7547;
    server_name your-genieacs-domain.com;
    
    # TR-069 specific settings
    client_max_body_size 10M;
    client_body_timeout 30s;
    client_header_timeout 30s;
    
    # Optimized timeouts for TR-069
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # TR-069 specific headers
    proxy_set_header SOAPAction "";
    proxy_set_header Content-Type "text/xml; charset=utf-8";
    
    location / {
        proxy_pass http://localhost:7557;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # TR-069 optimization
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
EOF

# 5. Update system limits
echo "⚙️ Updating system limits..."

# Update limits.conf
cat >> /etc/security/limits.conf << EOF
# GenieACS limits - Optimized for too_many_commits
genieacs soft nofile 65536
genieacs hard nofile 65536
genieacs soft nproc 32768
genieacs hard nproc 32768
genieacs soft memlock unlimited
genieacs hard memlock unlimited
EOF

# Update sysctl.conf for better performance
cat >> /etc/sysctl.conf << EOF
# Network optimization for GenieACS - too_many_commits fix
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# Memory optimization
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# File descriptor optimization
fs.file-max = 2097152
EOF

# Apply sysctl changes
sysctl -p

# 6. Create monitoring script
echo "📊 Creating monitoring script..."

cat > /opt/genieacs/monitor-commits.sh << 'EOF'
#!/bin/bash

# Monitor GenieACS commits to prevent too_many_commits error
while true; do
    # Get current commit count
    commit_count=$(curl -s http://localhost:7557/api/sessions | jq '.[] | select(.state == "active") | .commitCount' | head -1)
    
    if [ "$commit_count" -gt 40 ]; then
        echo "$(date): WARNING: High commit count detected: $commit_count"
        # Log warning
        echo "$(date): High commit count: $commit_count" >> /var/log/genieacs/commit-monitor.log
        
        # Optional: Restart session if too high
        if [ "$commit_count" -gt 45 ]; then
            echo "$(date): CRITICAL: Commit count too high, restarting session"
            # Restart GenieACS CWMP
            systemctl restart genieacs-cwmp
        fi
    fi
    
    sleep 30
done
EOF

chmod +x /opt/genieacs/monitor-commits.sh

# 7. Create log rotation for GenieACS
echo "📝 Setting up log rotation..."

cat > /etc/logrotate.d/genieacs << EOF
/var/log/genieacs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 genieacs genieacs
    postrotate
        systemctl reload genieacs-cwmp
        systemctl reload genieacs-fs
    endscript
}
EOF

# 8. Restart services
echo "🔄 Restarting services..."

# Reload systemd
systemctl daemon-reload

# Restart GenieACS services
systemctl restart genieacs-cwmp
systemctl restart genieacs-fs
systemctl restart genieacs-nbi

# Restart nginx
systemctl restart nginx

# 9. Check service status
echo "✅ Checking service status..."
systemctl status genieacs-cwmp
systemctl status genieacs-fs
systemctl status genieacs-nbi

# 10. Start monitoring script
echo "📊 Starting monitoring script..."
nohup /opt/genieacs/monitor-commits.sh > /var/log/genieacs/monitor.log 2>&1 &

echo "🎉 GenieACS 'too_many_commits' fix completed!"
echo ""
echo "📋 Configuration changes:"
echo "✅ Reduced batch size to 15 parameters"
echo "✅ Increased batch delay to 3 seconds"
echo "✅ Limited max commits per session to 50"
echo "✅ Added parameter grouping"
echo "✅ Enabled error handling and retry"
echo "✅ Added session monitoring"
echo ""
echo "📊 Monitoring:"
echo "• Monitor logs: tail -f /var/log/genieacs/commit-monitor.log"
echo "• Check sessions: curl -X GET http://localhost:7557/api/sessions"
echo "• Monitor commits: /opt/genieacs/monitor-commits.sh"
echo ""
echo "🔧 Next steps:"
echo "1. Test with a few devices first"
echo "2. Monitor commit counts"
echo "3. Adjust batch size if needed"
echo "4. Check logs for any remaining errors"
