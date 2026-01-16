# File Tracker v2 - AWS Console Setup Guide

This guide walks you through setting up the complete AWS infrastructure manually using the AWS Console.

## Architecture Overview

```
Internet
    ↓
Application Load Balancer (Public)
    ↓
┌─────────────────────────────────────────┐
│              VPC 10.0.0.0/16            │
│                                         │
│  [Public Subnet]        [Public Subnet] │
│   Jumphost              (ALB)           │
│   10.0.1.0/24          10.0.2.0/24      │
│                                         │
│  [Private Subnet]      [Private Subnet] │
│   App Server 1          App Server 2    │
│   10.0.11.0/24         10.0.12.0/24     │
│                                         │
│  [DB Subnet]           [DB Subnet]      │
│            RDS MySQL                    │
│   10.0.21.0/24         10.0.22.0/24     │
└─────────────────────────────────────────┘
```

---

## Prerequisites

1. AWS Account with admin access
2. Your public IP address (get it: https://www.whatismyip.com/)
3. SSH key pair (we'll create this in AWS)

---

## Step 1: Create VPC and Subnets

### 1.1 Create VPC

1. Go to **AWS Console** → **VPC** → **Your VPCs**
2. Click **Create VPC**
3. Configure:
   - **Resources to create**: VPC only
   - **Name**: `file-tracker-vpc`
   - **IPv4 CIDR**: `10.0.0.0/16`
   - **IPv6 CIDR**: No IPv6 CIDR block
   - **Tenancy**: Default
4. Click **Create VPC**
5. **Note the VPC ID** (e.g., vpc-xxxxx)

### 1.2 Create Internet Gateway

1. Go to **VPC** → **Internet Gateways**
2. Click **Create internet gateway**
3. **Name**: `file-tracker-igw`
4. Click **Create internet gateway**
5. Select the newly created IGW
6. Click **Actions** → **Attach to VPC**
7. Select `file-tracker-vpc`
8. Click **Attach internet gateway**

### 1.3 Create Subnets

Create 6 subnets total (2 public, 2 private, 2 database):

#### Public Subnet 1
1. Go to **VPC** → **Subnets** → **Create subnet**
2. **VPC**: Select `file-tracker-vpc`
3. **Subnet name**: `file-tracker-public-1`
4. **Availability Zone**: Choose first AZ (e.g., us-east-1a)
5. **IPv4 CIDR**: `10.0.1.0/24`
6. Click **Create subnet**

#### Public Subnet 2
1. Click **Create subnet** again
2. **VPC**: Select `file-tracker-vpc`
3. **Subnet name**: `file-tracker-public-2`
4. **Availability Zone**: Choose second AZ (e.g., us-east-1b)
5. **IPv4 CIDR**: `10.0.2.0/24`
6. Click **Create subnet**

#### Private Subnet 1
1. Click **Create subnet**
2. **VPC**: Select `file-tracker-vpc`
3. **Subnet name**: `file-tracker-private-1`
4. **Availability Zone**: First AZ (same as public-1)
5. **IPv4 CIDR**: `10.0.11.0/24`
6. Click **Create subnet**

#### Private Subnet 2
1. Click **Create subnet**
2. **VPC**: Select `file-tracker-vpc`
3. **Subnet name**: `file-tracker-private-2`
4. **Availability Zone**: Second AZ (same as public-2)
5. **IPv4 CIDR**: `10.0.12.0/24`
6. Click **Create subnet**

#### Database Subnet 1
1. Click **Create subnet**
2. **VPC**: Select `file-tracker-vpc`
3. **Subnet name**: `file-tracker-db-1`
4. **Availability Zone**: First AZ
5. **IPv4 CIDR**: `10.0.21.0/24`
6. Click **Create subnet**

#### Database Subnet 2
1. Click **Create subnet**
2. **VPC**: Select `file-tracker-vpc`
3. **Subnet name**: `file-tracker-db-2`
4. **Availability Zone**: Second AZ
5. **IPv4 CIDR**: `10.0.22.0/24`
6. Click **Create subnet**

### 1.4 Enable Auto-assign Public IP for Public Subnets

For **both** public subnets:
1. Select the subnet → **Actions** → **Edit subnet settings**
2. Check **Enable auto-assign public IPv4 address**
3. Click **Save**

### 1.5 Create NAT Gateway

1. Go to **VPC** → **NAT Gateways** → **Create NAT gateway**
2. **Name**: `file-tracker-nat`
3. **Subnet**: Select `file-tracker-public-1`
4. **Connectivity type**: Public
5. **Elastic IP allocation ID**: Click **Allocate Elastic IP**
6. Click **Create NAT gateway**
7. Wait for status to become "Available" (~2-3 minutes)

### 1.6 Create Route Tables

#### Public Route Table
1. Go to **VPC** → **Route Tables** → **Create route table**
2. **Name**: `file-tracker-public-rt`
3. **VPC**: Select `file-tracker-vpc`
4. Click **Create route table**
5. Select the route table → **Routes** tab → **Edit routes**
6. Click **Add route**:
   - **Destination**: `0.0.0.0/0`
   - **Target**: Internet Gateway → Select `file-tracker-igw`
7. Click **Save changes**
8. Go to **Subnet associations** tab → **Edit subnet associations**
9. Select **both public subnets** (`file-tracker-public-1` and `file-tracker-public-2`)
10. Click **Save associations**

#### Private Route Table
1. Click **Create route table**
2. **Name**: `file-tracker-private-rt`
3. **VPC**: Select `file-tracker-vpc`
4. Click **Create route table**
5. Select the route table → **Routes** tab → **Edit routes**
6. Click **Add route**:
   - **Destination**: `0.0.0.0/0`
   - **Target**: NAT Gateway → Select `file-tracker-nat`
7. Click **Save changes**
8. Go to **Subnet associations** tab → **Edit subnet associations**
9. Select all **4 private/db subnets** (`private-1`, `private-2`, `db-1`, `db-2`)
10. Click **Save associations**

✅ **VPC and Networking Complete!**

---

## Step 2: Create Security Groups

### 2.1 Load Balancer Security Group

1. Go to **EC2** → **Security Groups** → **Create security group**
2. **Security group name**: `file-tracker-alb-sg`
3. **Description**: `Security group for Application Load Balancer`
4. **VPC**: Select `file-tracker-vpc`
5. **Inbound rules** - Add 2 rules:
   - Rule 1:
     - **Type**: HTTP
     - **Protocol**: TCP
     - **Port**: 80
     - **Source**: 0.0.0.0/0
     - **Description**: HTTP from internet
   - Rule 2:
     - **Type**: HTTPS
     - **Protocol**: TCP
     - **Port**: 443
     - **Source**: 0.0.0.0/0
     - **Description**: HTTPS from internet
6. **Outbound rules**: Leave default (all traffic)
7. Click **Create security group**
8. **Note the Security Group ID** (sg-xxxxx)

### 2.2 Jumphost Security Group

1. Click **Create security group**
2. **Security group name**: `file-tracker-jumphost-sg`
3. **Description**: `Security group for Jumphost/Bastion`
4. **VPC**: Select `file-tracker-vpc`
5. **Inbound rules** - Add 1 rule:
   - **Type**: SSH
   - **Protocol**: TCP
   - **Port**: 22
   - **Source**: My IP (or enter your IP address)
     - **IMPORTANT**: Use your actual IP, not 0.0.0.0/0 for security
   - **Description**: SSH from my IP
6. **Outbound rules**: Leave default
7. Click **Create security group**
8. **Note the Security Group ID**

### 2.3 App Servers Security Group

1. Click **Create security group**
2. **Security group name**: `file-tracker-app-sg`
3. **Description**: `Security group for Application servers`
4. **VPC**: Select `file-tracker-vpc`
5. **Inbound rules** - Add 2 rules:
   - Rule 1:
     - **Type**: SSH
     - **Protocol**: TCP
     - **Port**: 22
     - **Source**: Custom → Select `file-tracker-jumphost-sg`
     - **Description**: SSH from jumphost
   - Rule 2:
     - **Type**: Custom TCP
     - **Protocol**: TCP
     - **Port**: 5000
     - **Source**: Custom → Select `file-tracker-alb-sg`
     - **Description**: App port from ALB
6. **Outbound rules**: Leave default
7. Click **Create security group**
8. **Note the Security Group ID**

### 2.4 RDS Security Group

1. Click **Create security group**
2. **Security group name**: `file-tracker-rds-sg`
3. **Description**: `Security group for RDS MySQL`
4. **VPC**: Select `file-tracker-vpc`
5. **Inbound rules** - Add 2 rules:
   - Rule 1:
     - **Type**: MySQL/Aurora
     - **Protocol**: TCP
     - **Port**: 3306
     - **Source**: Custom → Select `file-tracker-app-sg`
     - **Description**: MySQL from app servers
   - Rule 2:
     - **Type**: MySQL/Aurora
     - **Protocol**: TCP
     - **Port**: 3306
     - **Source**: Custom → Select `file-tracker-jumphost-sg`
     - **Description**: MySQL from jumphost
6. **Outbound rules**: Leave default
7. Click **Create security group**

✅ **Security Groups Complete!**

---

## Step 3: Create RDS MySQL Database

### 3.1 Create DB Subnet Group

1. Go to **RDS** → **Subnet groups** → **Create DB subnet group**
2. **Name**: `file-tracker-db-subnet-group`
3. **Description**: `Subnet group for File Tracker database`
4. **VPC**: Select `file-tracker-vpc`
5. **Add subnets**:
   - Select both AZs you used
   - Select **both database subnets** (`10.0.21.0/24` and `10.0.22.0/24`)
6. Click **Create**

### 3.2 Create RDS Instance

1. Go to **RDS** → **Databases** → **Create database**
2. **Choose a database creation method**: Standard create
3. **Engine options**:
   - **Engine type**: MySQL
   - **Version**: MySQL 8.0.35 (or latest 8.0.x)
4. **Templates**: Free tier (or Dev/Test for better performance)
5. **Settings**:
   - **DB instance identifier**: `file-tracker-mysql`
   - **Master username**: `admin`
   - **Master password**: Enter a strong password
   - **Confirm password**: Re-enter password
   - **⚠️ IMPORTANT: Save this password securely!**
6. **Instance configuration**:
   - **DB instance class**: db.t3.micro (free tier) or db.t3.small
7. **Storage**:
   - **Storage type**: General Purpose SSD (gp3)
   - **Allocated storage**: 20 GiB
   - **Storage autoscaling**: Enable (max 100 GiB)
8. **Connectivity**:
   - **Virtual private cloud (VPC)**: `file-tracker-vpc`
   - **DB subnet group**: `file-tracker-db-subnet-group`
   - **Public access**: No
   - **VPC security group**: Choose existing → Select `file-tracker-rds-sg`
   - **Availability Zone**: No preference
9. **Database authentication**: Password authentication
10. **Additional configuration** (expand):
    - **Initial database name**: `filetracker`
    - **DB parameter group**: Default
    - **Backup retention period**: 7 days
    - **Enable encryption**: Yes
11. Click **Create database**
12. Wait for database status to be "Available" (~10-15 minutes)
13. **Note the Endpoint** (will look like: file-tracker-mysql.xxxxx.us-east-1.rds.amazonaws.com)

✅ **Database Complete!**

---

## Step 4: Create EC2 Key Pair

1. Go to **EC2** → **Key Pairs** → **Create key pair**
2. **Name**: `file-tracker-key`
3. **Key pair type**: RSA
4. **Private key file format**: .pem (for Mac/Linux) or .ppk (for Windows/PuTTY)
5. Click **Create key pair**
6. **Save the downloaded file securely** (you'll need it to SSH)
7. Set permissions (Mac/Linux):
   ```bash
   chmod 400 ~/Downloads/file-tracker-key.pem
   ```

✅ **Key Pair Created!**

---

## Step 5: Create EC2 Instances

### 5.1 Create Jumphost

1. Go to **EC2** → **Instances** → **Launch instances**
2. **Name**: `file-tracker-jumphost`
3. **Application and OS Images**:
   - **Quick Start**: Amazon Linux
   - **Amazon Machine Image**: Amazon Linux 2023 AMI
4. **Instance type**: t3.micro (free tier eligible)
5. **Key pair**: Select `file-tracker-key`
6. **Network settings** - Click **Edit**:
   - **VPC**: `file-tracker-vpc`
   - **Subnet**: `file-tracker-public-1`
   - **Auto-assign public IP**: Enable
   - **Firewall (security groups)**: Select existing
   - **Security groups**: Select `file-tracker-jumphost-sg`
7. **Configure storage**: 8 GiB gp3
8. **Advanced details** (expand):
   - **User data** - Paste this:
     ```bash
     #!/bin/bash
     dnf update -y
     dnf install -y git vim wget curl htop mysql

     cat > /etc/motd << 'EOF'
     ============================================
     File Tracker v2 - Jumphost/Bastion Server
     ============================================
     Use this server to access private resources
     EOF
     ```
9. Click **Launch instance**
10. **Note the Public IP address** once instance is running

### 5.2 Create App Server 1

1. Click **Launch instances**
2. **Name**: `file-tracker-app-1`
3. **Application and OS Images**: Amazon Linux 2023 AMI
4. **Instance type**: t3.small (2 vCPU, 2GB RAM)
5. **Key pair**: Select `file-tracker-key`
6. **Network settings** - Click **Edit**:
   - **VPC**: `file-tracker-vpc`
   - **Subnet**: `file-tracker-private-1`
   - **Auto-assign public IP**: Disable
   - **Firewall**: Select existing
   - **Security groups**: Select `file-tracker-app-sg`
7. **Configure storage**: 30 GiB gp3
8. **Advanced details** (expand):
   - **User data** - Paste this (replace DB_HOST, DB_PASSWORD):
     ```bash
     #!/bin/bash
     set -e

     # Update system
     dnf update -y

     # Install Node.js 20.x
     dnf install -y nodejs npm git mysql

     # Install PM2
     npm install -g pm2

     # Create app directory
     mkdir -p /opt/file-tracker-v2

     # Create app user
     useradd -r -s /bin/false filetracker || true

     # Create environment file (UPDATE THESE VALUES!)
     cat > /opt/file-tracker-v2/.env << 'EOF'
     PORT=5000

     # Database 1
     DB1_HOST=YOUR_RDS_ENDPOINT_HERE
     DB1_USER=admin
     DB1_PASSWORD=YOUR_DB_PASSWORD_HERE
     DB1_NAME=filetracker

     # Database 2
     DB2_HOST=YOUR_RDS_ENDPOINT_HERE
     DB2_USER=admin
     DB2_PASSWORD=YOUR_DB_PASSWORD_HERE
     DB2_NAME=infracit_sharedb
     EOF

     chown -R filetracker:filetracker /opt/file-tracker-v2

     # Create systemd service
     cat > /etc/systemd/system/file-tracker.service << 'SERVICE'
     [Unit]
     Description=File Tracker v2
     After=network.target

     [Service]
     Type=simple
     User=filetracker
     WorkingDirectory=/opt/file-tracker-v2
     Environment=NODE_ENV=production
     ExecStart=/usr/bin/node server.js
     Restart=always

     [Install]
     WantedBy=multi-user.target
     SERVICE

     systemctl daemon-reload
     ```
9. Click **Launch instance**
10. **Note the Private IP address**

### 5.3 Create App Server 2

Repeat the same steps as App Server 1, but:
- **Name**: `file-tracker-app-2`
- **Subnet**: `file-tracker-private-2` (different AZ!)
- Use the same User data script

✅ **All EC2 Instances Created!**

---

## Step 6: Create Application Load Balancer

### 6.1 Create Target Group

1. Go to **EC2** → **Target Groups** → **Create target group**
2. **Choose a target type**: Instances
3. **Target group name**: `file-tracker-tg`
4. **Protocol**: HTTP
5. **Port**: 5000
6. **VPC**: `file-tracker-vpc`
7. **Protocol version**: HTTP1
8. **Health checks**:
   - **Health check protocol**: HTTP
   - **Health check path**: `/`
   - **Advanced health check settings**:
     - **Healthy threshold**: 2
     - **Unhealthy threshold**: 2
     - **Timeout**: 5 seconds
     - **Interval**: 30 seconds
     - **Success codes**: 200,302
9. Click **Next**
10. **Register targets**:
    - Select **both app servers** (`file-tracker-app-1` and `file-tracker-app-2`)
    - **Port**: 5000
    - Click **Include as pending below**
11. Click **Create target group**

### 6.2 Create Application Load Balancer

1. Go to **EC2** → **Load Balancers** → **Create load balancer**
2. Select **Application Load Balancer** → **Create**
3. **Basic configuration**:
   - **Load balancer name**: `file-tracker-alb`
   - **Scheme**: Internet-facing
   - **IP address type**: IPv4
4. **Network mapping**:
   - **VPC**: `file-tracker-vpc`
   - **Mappings**: Select **both AZs**
   - Select **both public subnets** (`file-tracker-public-1` and `file-tracker-public-2`)
5. **Security groups**:
   - Remove default
   - Select `file-tracker-alb-sg`
6. **Listeners and routing**:
   - **Protocol**: HTTP
   - **Port**: 80
   - **Default action**: Forward to `file-tracker-tg`
7. **Tags** (optional):
   - Key: Name, Value: file-tracker-alb
8. Click **Create load balancer**
9. Wait for state to become "Active" (~2-3 minutes)
10. **Note the DNS name** (e.g., file-tracker-alb-xxxxx.us-east-1.elb.amazonaws.com)

✅ **Load Balancer Created!**

---

## Step 7: Update App Server User Data

The app servers need the correct RDS endpoint. You need to update this:

1. Go to **RDS** → **Databases** → Click on `file-tracker-mysql`
2. **Copy the Endpoint** (under Connectivity & security)
3. For **each app server**:
   - Stop the instance
   - Actions → Instance settings → Edit user data
   - Replace `YOUR_RDS_ENDPOINT_HERE` with the actual RDS endpoint
   - Replace `YOUR_DB_PASSWORD_HERE` with your database password
   - Save
   - Start the instance

Alternatively, SSH to each server and manually edit `/opt/file-tracker-v2/.env`

---

## Step 8: Deploy Application

### 8.1 Connect to Jumphost

```bash
# Get jumphost IP from EC2 console
ssh -i ~/Downloads/file-tracker-key.pem ec2-user@YOUR_JUMPHOST_IP
```

### 8.2 Deploy to App Servers

From your local machine, create a deployment package:

```bash
# On your local machine
cd /home/user/File-Tracker-v2

# Create package (excluding node_modules)
tar -czf app.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='terraform' \
  --exclude='scripts' \
  server.js db.js package*.json controllers/ routes/ public/

# Copy to jumphost
scp -i ~/Downloads/file-tracker-key.pem app.tar.gz ec2-user@YOUR_JUMPHOST_IP:~

# SSH to jumphost
ssh -i ~/Downloads/file-tracker-key.pem ec2-user@YOUR_JUMPHOST_IP

# From jumphost, copy to app servers
scp app.tar.gz ec2-user@APP_SERVER_1_PRIVATE_IP:~
scp app.tar.gz ec2-user@APP_SERVER_2_PRIVATE_IP:~

# SSH to each app server and deploy
ssh ec2-user@APP_SERVER_1_PRIVATE_IP

# On app server:
sudo tar -xzf ~/app.tar.gz -C /opt/file-tracker-v2/
cd /opt/file-tracker-v2
sudo npm install --production
sudo chown -R filetracker:filetracker /opt/file-tracker-v2
sudo systemctl start file-tracker
sudo systemctl enable file-tracker
sudo systemctl status file-tracker

# Repeat for app server 2
```

---

## Step 9: Initialize Databases

### 9.1 Create Databases

From jumphost, connect to RDS:

```bash
mysql -h YOUR_RDS_ENDPOINT -u admin -p

# Enter your database password

# In MySQL prompt:
CREATE DATABASE IF NOT EXISTS filetracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS infracit_sharedb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;

# Import your database schema/data here
# Or run your SQL files
# source /path/to/your/schema.sql

EXIT;
```

---

## Step 10: Test the Application

1. **Get Load Balancer DNS**:
   - Go to **EC2** → **Load Balancers**
   - Copy the **DNS name**

2. **Access Application**:
   - Open browser: `http://YOUR_ALB_DNS_NAME`
   - You should see your File Tracker login page

3. **Check Target Health**:
   - Go to **EC2** → **Target Groups** → `file-tracker-tg`
   - **Targets** tab should show both instances as "healthy"

---

## Summary - Quick Reference

### Resources Created:
- ✅ VPC with 6 subnets (2 public, 2 private, 2 database)
- ✅ Internet Gateway and NAT Gateway
- ✅ 4 Security Groups
- ✅ RDS MySQL database
- ✅ 3 EC2 instances (1 jumphost + 2 app servers)
- ✅ Application Load Balancer with Target Group

### Key Information to Save:
- RDS Endpoint: _________________
- Database Password: _________________
- Jumphost Public IP: _________________
- App Server 1 Private IP: _________________
- App Server 2 Private IP: _________________
- Load Balancer DNS: _________________

### Connection Commands:
```bash
# SSH to jumphost
ssh -i file-tracker-key.pem ec2-user@JUMPHOST_IP

# SSH to app server from jumphost
ssh ec2-user@APP_SERVER_PRIVATE_IP

# Check app logs
sudo journalctl -u file-tracker -f

# Restart app
sudo systemctl restart file-tracker
```

---

## Troubleshooting

**Target Group shows unhealthy:**
- Check app server logs: `sudo journalctl -u file-tracker -f`
- Verify app is running: `sudo systemctl status file-tracker`
- Check database connection in `/opt/file-tracker-v2/.env`

**Cannot access via Load Balancer:**
- Verify ALB security group allows port 80
- Check target group health status
- Ensure both app servers are running

**Cannot SSH to jumphost:**
- Verify your IP in jumphost security group
- Check key pair permissions: `chmod 400 key.pem`

---

That's it! Your File Tracker v2 is now deployed on AWS with load balancing! 🎉
