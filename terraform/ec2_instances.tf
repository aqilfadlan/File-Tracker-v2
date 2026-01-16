# EC2 Instances Configuration

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# SSH Key Pair
resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-key"
  public_key = var.ssh_public_key

  tags = {
    Name = "${var.project_name}-key"
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ec2-role"
  }
}

# Attach CloudWatch and SSM policies
resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "${var.project_name}-ec2-profile"
  }
}

# Jumphost/Bastion Server (Public Subnet)
resource "aws_instance" "jumphost" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.jumphost_instance_type
  key_name               = aws_key_pair.deployer.key_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.jumphost.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              set -e

              # Update system
              dnf update -y

              # Install essential tools
              dnf install -y git vim wget curl htop mysql

              # Configure timezone
              timedatectl set-timezone ${var.timezone}

              # Create welcome message
              cat > /etc/motd << 'MOTD'
              ============================================
              File Tracker v2 - Jumphost/Bastion Server
              ============================================
              Use this server to access private resources
              MOTD
              EOF

  tags = {
    Name = "${var.project_name}-jumphost"
    Role = "Bastion"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-jumphost-root"
    }
  }
}

# Application Servers (Private Subnets)
resource "aws_instance" "app_server" {
  count                  = 2
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.app_instance_type
  key_name               = aws_key_pair.deployer.key_name
  subnet_id              = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.app_servers.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/user_data/app_server.sh", {
    db_host     = aws_db_instance.mysql.address
    db_user     = var.db_master_username
    db_password = var.db_master_password
    db_name     = var.db_name
  })

  tags = {
    Name = "${var.project_name}-app-server-${count.index + 1}"
    Role = "Application"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-app-server-${count.index + 1}-root"
    }
  }

  depends_on = [
    aws_db_instance.mysql,
    aws_nat_gateway.main
  ]
}

# Elastic IP for Jumphost
resource "aws_eip" "jumphost" {
  instance = aws_instance.jumphost.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-jumphost-eip"
  }

  depends_on = [aws_internet_gateway.main]
}
