#!/bin/bash
# Database Initialization Script for File Tracker v2
# This script creates the two required databases on RDS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================="
echo "File Tracker v2 - Database Initialization"
echo -e "==========================================${NC}"

# Get RDS endpoint from Terraform
cd terraform
DB_HOST=$(terraform output -raw rds_address 2>/dev/null || echo "")
DB_USER=$(terraform output -json database_connection_info 2>/dev/null | jq -r '.username' || echo "admin")
JUMPHOST_IP=$(terraform output -raw jumphost_public_ip 2>/dev/null || echo "")
cd ..

# Check if we got the values
if [ -z "$DB_HOST" ]; then
    echo -e "${RED}Error: Could not get database endpoint from Terraform${NC}"
    echo "Please ensure Terraform has been applied successfully"
    exit 1
fi

# Get database password
echo -n "Enter database master password: "
read -s DB_PASSWORD
echo ""

# SSH key
PROJECT_NAME="file-tracker-v2"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/${PROJECT_NAME}-key}"

echo ""
echo "Database Host: $DB_HOST"
echo "Database User: $DB_USER"
echo "Jumphost IP: $JUMPHOST_IP"
echo ""

# Create SQL script
cat > /tmp/init_databases.sql << 'EOSQL'
-- Create databases if they don't exist
CREATE DATABASE IF NOT EXISTS filetracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS infracit_sharedb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Show databases
SHOW DATABASES;

-- Use filetracker database
USE filetracker;

-- Create file_movement table (example - adjust based on your actual schema)
CREATE TABLE IF NOT EXISTS file_movement (
    move_id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    from_dept VARCHAR(100),
    to_dept VARCHAR(100),
    move_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create file_movement_files table (example)
CREATE TABLE IF NOT EXISTS file_movement_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    move_id INT NOT NULL,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (move_id) REFERENCES file_movement(move_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Use infracit_sharedb database
USE infracit_sharedb;

-- Create users table (example - adjust based on your actual schema)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    userlevel_id INT,
    dept_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create userlevels table
CREATE TABLE IF NOT EXISTS userlevels (
    userlevel_id INT AUTO_INCREMENT PRIMARY KEY,
    userlevel_name VARCHAR(50) NOT NULL,
    permissions TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create departments table
CREATE TABLE IF NOT EXISTS tref_department (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    dept_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default user levels
INSERT IGNORE INTO userlevels (userlevel_id, userlevel_name, permissions) VALUES
(1, 'super_admin', 'all'),
(2, 'admin', 'manage_files,manage_users'),
(3, 'HR', 'view_files,approve_movements'),
(4, 'staff', 'view_files');

-- Insert a default admin user (password: admin123 - CHANGE THIS!)
-- MD5 hash of 'admin123' = 0192023a7bbd73250516f069df18b500
INSERT IGNORE INTO users (username, password, email, full_name, userlevel_id) VALUES
('admin', '0192023a7bbd73250516f069df18b500', 'admin@example.com', 'System Administrator', 1);

SHOW TABLES FROM filetracker;
SHOW TABLES FROM infracit_sharedb;
EOSQL

echo -e "${YELLOW}Copying SQL script to jumphost...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    /tmp/init_databases.sql "ec2-user@$JUMPHOST_IP:/tmp/"

echo -e "${YELLOW}Executing SQL script on database...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ec2-user@$JUMPHOST_IP" << ENDSSH
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < /tmp/init_databases.sql
rm /tmp/init_databases.sql
ENDSSH

# Clean up
rm /tmp/init_databases.sql

echo -e "\n${GREEN}=========================================="
echo "Database Initialization Complete!"
echo -e "==========================================${NC}"
echo ""
echo "Created databases:"
echo "  - filetracker"
echo "  - infracit_sharedb"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${RED}IMPORTANT: Change the default password immediately!${NC}"
echo ""
echo "NOTE: The tables created are examples. Please review and modify"
echo "      /tmp/init_databases.sql with your actual database schema"
echo "      before running this script in production."
