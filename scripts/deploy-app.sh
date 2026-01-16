#!/bin/bash
# Deployment script for File Tracker v2 Application
# This script deploys the application to EC2 instances via jumphost

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="file-tracker-v2"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/${PROJECT_NAME}-key}"
JUMPHOST_IP="${JUMPHOST_IP}"
APP_SERVER_1_IP="${APP_SERVER_1_IP}"
APP_SERVER_2_IP="${APP_SERVER_2_IP}"

echo -e "${GREEN}=========================================="
echo "File Tracker v2 - Deployment Script"
echo -e "==========================================${NC}"

# Check if terraform outputs are available
if [ -z "$JUMPHOST_IP" ] || [ -z "$APP_SERVER_1_IP" ] || [ -z "$APP_SERVER_2_IP" ]; then
    echo -e "${YELLOW}Fetching server IPs from Terraform...${NC}"
    cd terraform
    JUMPHOST_IP=$(terraform output -raw jumphost_public_ip)
    APP_SERVER_1_IP=$(terraform output -raw app_server_1_private_ip)
    APP_SERVER_2_IP=$(terraform output -raw app_server_2_private_ip)
    cd ..
fi

echo "Jumphost IP: $JUMPHOST_IP"
echo "App Server 1 IP: $APP_SERVER_1_IP"
echo "App Server 2 IP: $APP_SERVER_2_IP"

# Function to deploy to a server
deploy_to_server() {
    local SERVER_IP=$1
    local SERVER_NAME=$2

    echo -e "\n${GREEN}Deploying to $SERVER_NAME ($SERVER_IP)...${NC}"

    # Create tarball of application
    echo "Creating application package..."
    tar -czf /tmp/app.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='terraform' \
        --exclude='scripts' \
        --exclude='.env' \
        server.js db.js package*.json controllers/ routes/ public/

    # Copy application to server via jumphost
    echo "Copying application files..."
    scp -i "$SSH_KEY" \
        -o StrictHostKeyChecking=no \
        -o ProxyJump="ec2-user@$JUMPHOST_IP" \
        /tmp/app.tar.gz "ec2-user@$SERVER_IP:/tmp/"

    # Deploy and start application
    echo "Installing and starting application..."
    ssh -i "$SSH_KEY" \
        -o StrictHostKeyChecking=no \
        -o ProxyJump="ec2-user@$JUMPHOST_IP" \
        "ec2-user@$SERVER_IP" << 'ENDSSH'
        set -e

        # Stop existing application
        sudo systemctl stop file-tracker || true

        # Extract application
        cd /opt/file-tracker-v2
        sudo tar -xzf /tmp/app.tar.gz
        rm /tmp/app.tar.gz

        # Install dependencies
        sudo npm install --production

        # Fix permissions
        sudo chown -R filetracker:filetracker /opt/file-tracker-v2

        # Create logs directory
        sudo mkdir -p /opt/file-tracker-v2/logs
        sudo chown -R filetracker:filetracker /opt/file-tracker-v2/logs

        # Start application
        sudo systemctl daemon-reload
        sudo systemctl start file-tracker
        sudo systemctl enable file-tracker

        # Check status
        sleep 3
        sudo systemctl status file-tracker --no-pager
ENDSSH

    echo -e "${GREEN}Deployment to $SERVER_NAME completed!${NC}"
}

# Deploy to both app servers
deploy_to_server "$APP_SERVER_1_IP" "App Server 1"
deploy_to_server "$APP_SERVER_2_IP" "App Server 2"

# Clean up
rm -f /tmp/app.tar.gz

echo -e "\n${GREEN}=========================================="
echo "Deployment Complete!"
echo -e "==========================================${NC}"
echo ""
echo "Application should be accessible via the Load Balancer:"
cd terraform
echo "URL: http://$(terraform output -raw alb_dns_name)"
cd ..
echo ""
echo "To check application logs:"
echo "  ssh -i $SSH_KEY -J ec2-user@$JUMPHOST_IP ec2-user@$APP_SERVER_1_IP"
echo "  sudo journalctl -u file-tracker -f"
