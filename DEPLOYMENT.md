# File Tracker v2 - AWS Deployment Guide

This guide provides step-by-step instructions for deploying File Tracker v2 on AWS with a highly available architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          AWS VPC                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Public Subnets                      │  │
│  │  ┌──────────────┐         ┌──────────────────────┐   │  │
│  │  │   Jumphost   │         │  Load Balancer (ALB) │   │  │
│  │  │  (Bastion)   │         │   Port 80/443        │   │  │
│  │  └──────────────┘         └──────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Private Subnets                      │  │
│  │  ┌──────────────┐         ┌──────────────┐           │  │
│  │  │ App Server 1 │         │ App Server 2 │           │  │
│  │  │  Port 5000   │         │  Port 5000   │           │  │
│  │  └──────────────┘         └──────────────┘           │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Database Subnets                      │  │
│  │               ┌──────────────────┐                    │  │
│  │               │   RDS MySQL      │                    │  │
│  │               │   Multi-AZ       │                    │  │
│  │               └──────────────────┘                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **VPC**: Single VPC with public, private, and database subnets across 2 availability zones
2. **Application Load Balancer**: Distributes traffic between 2 app servers
3. **App Servers (2)**: EC2 instances running Node.js application in private subnets
4. **Jumphost**: Bastion server in public subnet for SSH access to private instances
5. **RDS MySQL**: Managed database service for application data
6. **NAT Gateway**: Allows private instances to access the internet

## Prerequisites

### 1. Install Required Tools

```bash
# Install Terraform (v1.0+)
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installation
terraform --version

# Install AWS CLI
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# You'll be prompted for:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)

# Verify configuration
aws sts get-caller-identity
```

### 3. Generate SSH Key Pair

```bash
# Generate SSH key pair for EC2 instances
ssh-keygen -t rsa -b 4096 -f ~/.ssh/file-tracker-v2-key -C "file-tracker-v2"

# Set proper permissions
chmod 600 ~/.ssh/file-tracker-v2-key
chmod 644 ~/.ssh/file-tracker-v2-key.pub

# Display public key (you'll need this for terraform.tfvars)
cat ~/.ssh/file-tracker-v2-key.pub
```

## Deployment Steps

### Step 1: Configure Terraform Variables

```bash
# Navigate to terraform directory
cd terraform

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
vim terraform.tfvars
```

**Important variables to configure:**

```hcl
# terraform.tfvars

aws_region  = "us-east-1"  # Your preferred region
environment = "production"  # or "development"

# SSH Configuration
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2E..."  # Your public key from step 3

# Security - IMPORTANT!
allowed_ssh_cidrs = ["YOUR_IP/32"]  # Replace with your IP address

# Database - IMPORTANT!
db_master_password = "YourSecurePassword123!"  # Change this!

# Instance types (adjust based on your needs)
jumphost_instance_type = "t3.micro"
app_instance_type      = "t3.small"
db_instance_class      = "db.t3.micro"
```

**Get your IP address:**
```bash
curl ifconfig.me
# Use the output in format: YOUR_IP/32 in allowed_ssh_cidrs
```

### Step 2: Initialize Terraform

```bash
# Initialize Terraform (downloads providers)
terraform init

# Validate configuration
terraform validate

# Review the plan
terraform plan
```

### Step 3: Deploy Infrastructure

```bash
# Apply Terraform configuration
terraform apply

# Review the changes and type 'yes' to confirm

# This will create:
# - VPC and networking (subnets, route tables, NAT gateway)
# - Security groups
# - Application Load Balancer
# - 3 EC2 instances (2 app servers + 1 jumphost)
# - RDS MySQL instance
# - CloudWatch monitoring

# Deployment takes approximately 10-15 minutes
```

### Step 4: Save Terraform Outputs

```bash
# Display all outputs
terraform output

# Save important information
terraform output -raw jumphost_public_ip > ../jumphost_ip.txt
terraform output -raw alb_dns_name > ../alb_dns.txt
terraform output -raw rds_address > ../db_host.txt

# View application URL
echo "Application URL: http://$(terraform output -raw alb_dns_name)"
```

### Step 5: Initialize Databases

The application requires two MySQL databases. First, update the database initialization script with your actual database schema, then run:

```bash
# Navigate to scripts directory
cd ../scripts

# Make scripts executable
chmod +x *.sh

# Run database initialization
./init-databases.sh

# You'll be prompted for the database master password
# Enter the password you set in terraform.tfvars
```

**Important:** The initialization script creates example tables. You should:
1. Review `scripts/init-databases.sh`
2. Update the SQL schema to match your actual database structure
3. Import your existing database dumps if migrating

### Step 6: Deploy Application

```bash
# Deploy application to both app servers
./deploy-app.sh

# This script will:
# 1. Package the application
# 2. Copy files to both app servers via jumphost
# 3. Install dependencies
# 4. Start the application service
```

### Step 7: Verify Deployment

```bash
# Check application URL
cd ../terraform
ALB_DNS=$(terraform output -raw alb_dns_name)
curl -I http://$ALB_DNS

# SSH to jumphost
JUMPHOST_IP=$(terraform output -raw jumphost_public_ip)
ssh -i ~/.ssh/file-tracker-v2-key ec2-user@$JUMPHOST_IP

# From jumphost, check app servers
APP_SERVER_1=$(cd ../terraform && terraform output -raw app_server_1_private_ip)
ssh ec2-user@$APP_SERVER_1

# Check application status
sudo systemctl status file-tracker

# View application logs
sudo journalctl -u file-tracker -f

# Exit (Ctrl+C, then exit twice to get back to your machine)
```

## Post-Deployment Configuration

### 1. Configure Domain Name (Optional)

If you have a domain name:

```bash
# Get ALB DNS name
cd terraform
terraform output alb_dns_name

# Create a CNAME record in your DNS:
# Record Type: CNAME
# Name: app (or www)
# Value: [ALB DNS name from output]
# TTL: 300
```

### 2. Setup SSL/HTTPS (Optional)

To enable HTTPS:

```bash
# 1. Request SSL certificate in AWS Certificate Manager (ACM)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# 2. Complete DNS validation in ACM console

# 3. Get certificate ARN
aws acm list-certificates --region us-east-1

# 4. Add to terraform.tfvars
echo 'ssl_certificate_arn = "arn:aws:acm:..."' >> terraform.tfvars

# 5. Uncomment HTTPS listener in terraform/load_balancer.tf
# 6. Apply changes
terraform apply
```

### 3. Configure Monitoring

```bash
# View CloudWatch metrics
# Go to AWS Console > CloudWatch > Dashboards

# View application logs
# Go to AWS Console > CloudWatch > Log groups > /aws/ec2/file-tracker-v2
```

### 4. Setup Backups

RDS automated backups are enabled by default:
- Backup retention: 7 days
- Backup window: 03:00-04:00 UTC
- Maintenance window: Monday 04:00-05:00 UTC

To create manual snapshot:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier file-tracker-v2-mysql \
  --db-snapshot-identifier file-tracker-manual-$(date +%Y%m%d)
```

## Maintenance Operations

### Update Application Code

```bash
# After making code changes, redeploy:
cd scripts
./deploy-app.sh
```

### Scale Application Servers

To add more application servers, edit `terraform/ec2_instances.tf`:

```hcl
# Change count from 2 to desired number
resource "aws_instance" "app_server" {
  count = 3  # or more
  # ...
}
```

Then apply:
```bash
cd terraform
terraform apply
```

### Database Maintenance

```bash
# Connect to database from jumphost
JUMPHOST_IP=$(cd terraform && terraform output -raw jumphost_public_ip)
DB_HOST=$(cd terraform && terraform output -raw rds_address)

ssh -i ~/.ssh/file-tracker-v2-key ec2-user@$JUMPHOST_IP
mysql -h $DB_HOST -u admin -p

# Show databases
SHOW DATABASES;

# Backup database
mysqldump -h $DB_HOST -u admin -p filetracker > backup.sql
mysqldump -h $DB_HOST -u admin -p infracit_sharedb > backup2.sql
```

### View Logs

```bash
# Application logs on app server
ssh -i ~/.ssh/file-tracker-v2-key \
  -J ec2-user@$(cd terraform && terraform output -raw jumphost_public_ip) \
  ec2-user@$(cd terraform && terraform output -raw app_server_1_private_ip)

sudo journalctl -u file-tracker -f

# CloudWatch logs
aws logs tail /aws/ec2/file-tracker-v2 --follow
```

## Troubleshooting

### Application Not Accessible

1. **Check Load Balancer Health**:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn $(cd terraform && terraform output -raw target_group_arn)
   ```

2. **Check Application Service**:
   ```bash
   # SSH to app server and check
   sudo systemctl status file-tracker
   sudo journalctl -u file-tracker -n 50
   ```

3. **Check Security Groups**:
   - ALB security group allows inbound 80/443
   - App server security group allows inbound 5000 from ALB
   - RDS security group allows inbound 3306 from app servers

### Cannot SSH to Jumphost

1. **Check Security Group**:
   ```bash
   # Verify your IP is allowed
   curl ifconfig.me
   # Compare with allowed_ssh_cidrs in terraform.tfvars
   ```

2. **Check SSH Key**:
   ```bash
   # Verify key permissions
   ls -la ~/.ssh/file-tracker-v2-key
   # Should be -rw------- (600)
   ```

### Database Connection Issues

1. **Check RDS Status**:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier file-tracker-v2-mysql
   ```

2. **Test Connection from App Server**:
   ```bash
   mysql -h $DB_HOST -u admin -p -e "SHOW DATABASES;"
   ```

3. **Verify Environment Variables**:
   ```bash
   cat /opt/file-tracker-v2/.env
   ```

## Cost Estimation

**Monthly AWS costs (approximate, us-east-1):**

- VPC, NAT Gateway: ~$32/month
- EC2 Instances:
  - Jumphost (t3.micro): ~$7.50/month
  - 2 App Servers (t3.small): ~$30/month
- Application Load Balancer: ~$16/month
- RDS (db.t3.micro): ~$15/month
- Data Transfer: ~$10/month (varies)
- **Total: ~$110/month**

**Free Tier eligible (first 12 months):**
- 750 hours/month of t3.micro EC2
- 750 hours/month of RDS db.t3.micro
- 750 hours/month of ALB

## Security Best Practices

1. ✅ Change default database password
2. ✅ Restrict SSH access to your IP only
3. ✅ Enable MFA on AWS account
4. ✅ Use SSL/HTTPS in production
5. ✅ Regularly update instance packages
6. ✅ Enable CloudTrail for audit logging
7. ✅ Use AWS Secrets Manager for sensitive data
8. ✅ Implement regular backup testing

## Cleanup / Destroy

To remove all AWS resources:

```bash
cd terraform

# This will delete ALL resources
terraform destroy

# Type 'yes' to confirm

# Note: This will delete:
# - All EC2 instances
# - RDS database (snapshot will be created if in production)
# - Load Balancer
# - VPC and all networking components
```

## Support & Documentation

- **Application Issues**: Check application logs in CloudWatch
- **Infrastructure Issues**: Review Terraform state and AWS Console
- **AWS Documentation**: https://docs.aws.amazon.com/
- **Terraform Documentation**: https://www.terraform.io/docs

## Next Steps

1. ✅ Configure your domain and SSL certificate
2. ✅ Set up monitoring alerts in CloudWatch
3. ✅ Configure automated backups
4. ✅ Implement CI/CD pipeline
5. ✅ Set up staging environment
6. ✅ Configure log aggregation
7. ✅ Implement health check endpoints
8. ✅ Set up auto-scaling (optional)

---

**Created:** 2026-01-16
**Last Updated:** 2026-01-16
**Version:** 1.0.0
