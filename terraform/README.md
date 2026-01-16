# Terraform Infrastructure for File Tracker v2

This directory contains Terraform configuration for deploying File Tracker v2 to AWS.

## Quick Start

```bash
# 1. Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars

# 2. Initialize Terraform
terraform init

# 3. Review the plan
terraform plan

# 4. Deploy infrastructure
terraform apply

# 5. View outputs
terraform output
```

## Files Description

- `main.tf` - VPC, subnets, routing, and networking
- `security_groups.tf` - Security groups for all components
- `load_balancer.tf` - Application Load Balancer configuration
- `ec2_instances.tf` - EC2 instances (jumphost and app servers)
- `rds.tf` - RDS MySQL database
- `variables.tf` - Variable definitions
- `outputs.tf` - Output definitions
- `terraform.tfvars.example` - Example variables file
- `user_data/app_server.sh` - EC2 user data script for app servers

## Architecture

See `../DEPLOYMENT.md` for complete architecture documentation.

## Important Notes

1. **Security**: Change `allowed_ssh_cidrs` to your IP address
2. **Database Password**: Set a strong password in `terraform.tfvars`
3. **SSH Key**: Add your public SSH key to `ssh_public_key` variable
4. **Costs**: Review cost estimation in `../DEPLOYMENT.md`

## Useful Commands

```bash
# Format code
terraform fmt

# Validate configuration
terraform validate

# Show current state
terraform show

# List resources
terraform state list

# Destroy infrastructure
terraform destroy
```

## Outputs

After applying, you can access outputs:

```bash
# Application URL
terraform output application_url

# SSH to jumphost
terraform output ssh_to_jumphost

# SSH to app servers
terraform output ssh_to_app_server_1
terraform output ssh_to_app_server_2

# Database connection info
terraform output database_connection_info
```

For detailed deployment instructions, see `../DEPLOYMENT.md`.
