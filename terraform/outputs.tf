# Terraform Outputs

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.app.arn
}

# EC2 Outputs
output "jumphost_public_ip" {
  description = "Public IP address of jumphost"
  value       = aws_eip.jumphost.public_ip
}

output "jumphost_private_ip" {
  description = "Private IP address of jumphost"
  value       = aws_instance.jumphost.private_ip
}

output "app_server_1_private_ip" {
  description = "Private IP address of app server 1"
  value       = aws_instance.app_server[0].private_ip
}

output "app_server_2_private_ip" {
  description = "Private IP address of app server 2"
  value       = aws_instance.app_server[1].private_ip
}

output "app_server_ids" {
  description = "Instance IDs of application servers"
  value       = aws_instance.app_server[*].id
}

# RDS Outputs
output "rds_endpoint" {
  description = "Connection endpoint for RDS MySQL"
  value       = aws_db_instance.mysql.endpoint
}

output "rds_address" {
  description = "Address of RDS MySQL instance"
  value       = aws_db_instance.mysql.address
}

output "rds_port" {
  description = "Port of RDS MySQL instance"
  value       = aws_db_instance.mysql.port
}

output "rds_database_name" {
  description = "Name of the initial database"
  value       = aws_db_instance.mysql.db_name
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of ALB security group"
  value       = aws_security_group.alb.id
}

output "jumphost_security_group_id" {
  description = "ID of jumphost security group"
  value       = aws_security_group.jumphost.id
}

output "app_servers_security_group_id" {
  description = "ID of app servers security group"
  value       = aws_security_group.app_servers.id
}

output "rds_security_group_id" {
  description = "ID of RDS security group"
  value       = aws_security_group.rds.id
}

# Application Access
output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ssh_to_jumphost" {
  description = "SSH command to connect to jumphost"
  value       = "ssh -i ~/.ssh/${var.project_name}-key ec2-user@${aws_eip.jumphost.public_ip}"
}

output "ssh_to_app_server_1" {
  description = "SSH command to connect to app server 1 via jumphost"
  value       = "ssh -i ~/.ssh/${var.project_name}-key -J ec2-user@${aws_eip.jumphost.public_ip} ec2-user@${aws_instance.app_server[0].private_ip}"
}

output "ssh_to_app_server_2" {
  description = "SSH command to connect to app server 2 via jumphost"
  value       = "ssh -i ~/.ssh/${var.project_name}-key -J ec2-user@${aws_eip.jumphost.public_ip} ec2-user@${aws_instance.app_server[1].private_ip}"
}

# Database Connection String
output "database_connection_info" {
  description = "Database connection information"
  value = {
    host     = aws_db_instance.mysql.address
    port     = aws_db_instance.mysql.port
    database = aws_db_instance.mysql.db_name
    username = var.db_master_username
  }
  sensitive = true
}
