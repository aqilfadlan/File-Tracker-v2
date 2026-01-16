#!/bin/bash
set -e

# App Server Setup Script for File Tracker v2
# This script runs on EC2 instance first boot

echo "=========================================="
echo "Starting App Server Setup"
echo "=========================================="

# Update system
echo "Updating system packages..."
dnf update -y

# Install Node.js 20.x (LTS)
echo "Installing Node.js..."
dnf install -y nodejs npm git

# Install PM2 globally for process management
echo "Installing PM2..."
npm install -g pm2

# Install MySQL client
echo "Installing MySQL client..."
dnf install -y mysql

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/file-tracker-v2
cd /opt/file-tracker-v2

# Create application user
echo "Creating application user..."
useradd -r -s /bin/false filetracker || true

# Clone application (if using git deployment)
# For now, we'll create placeholder for manual deployment
# You can uncomment and modify this section for automated git deployment:
# git clone https://github.com/yourusername/File-Tracker-v2.git .

# Create environment file
echo "Creating environment configuration..."
cat > /opt/file-tracker-v2/.env << 'ENVFILE'
PORT=5000

# Database 1 (filetracker)
DB1_HOST=${db_host}
DB1_USER=${db_user}
DB1_PASSWORD=${db_password}
DB1_NAME=${db_name}

# Database 2 (infracit_sharedb) - using same RDS instance
DB2_HOST=${db_host}
DB2_USER=${db_user}
DB2_PASSWORD=${db_password}
DB2_NAME=infracit_sharedb
ENVFILE

# Set proper permissions
echo "Setting permissions..."
chown -R filetracker:filetracker /opt/file-tracker-v2

# Configure timezone
echo "Configuring timezone..."
timedatectl set-timezone UTC

# Install CloudWatch agent
echo "Installing CloudWatch agent..."
wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
rm -f ./amazon-cloudwatch-agent.rpm

# Create CloudWatch agent config
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'CWCONFIG'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/opt/file-tracker-v2/logs/app.log",
            "log_group_name": "/aws/ec2/file-tracker-v2",
            "log_stream_name": "{instance_id}/application.log"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "FileTrackerV2",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MemoryUtilization",
            "unit": "Percent"
          }
        ]
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DiskUtilization",
            "unit": "Percent"
          }
        ],
        "resources": [
          "/"
        ]
      }
    }
  }
}
CWCONFIG

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Create systemd service for application (placeholder)
cat > /etc/systemd/system/file-tracker.service << 'SERVICE'
[Unit]
Description=File Tracker v2 Application
After=network.target

[Service]
Type=simple
User=filetracker
WorkingDirectory=/opt/file-tracker-v2
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=file-tracker

[Install]
WantedBy=multi-user.target
SERVICE

# Create welcome message
cat > /etc/motd << 'MOTD'
============================================
File Tracker v2 - Application Server
============================================
Application directory: /opt/file-tracker-v2
Service name: file-tracker
Logs: journalctl -u file-tracker -f
PM2 status: pm2 status
============================================
MOTD

echo "=========================================="
echo "App Server Setup Complete!"
echo "=========================================="
echo "Next steps:"
echo "1. Deploy application code to /opt/file-tracker-v2"
echo "2. Run: cd /opt/file-tracker-v2 && npm install"
echo "3. Initialize databases with schemas"
echo "4. Start application: systemctl start file-tracker"
echo "=========================================="
