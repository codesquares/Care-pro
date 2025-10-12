#!/bin/bash

# CarePro Simplified VPC Infrastructure Setup
# Creates VPC with public subnets only (no NAT Gateway needed)

set -e

AWS_REGION="us-east-1"
PROJECT_NAME="carepro"

echo "🏗️ Creating simplified VPC infrastructure for CarePro..."

# Create VPC
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc},{Key=Project,Value=CarePro}]" \
    --query 'Vpc.VpcId' \
    --output text)

echo "VPC created: $VPC_ID"

# Enable DNS hostnames and resolution
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

# Create Internet Gateway
echo "Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw},{Key=Project,Value=CarePro}]" \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

echo "Internet Gateway created and attached: $IGW_ID"

# Create Public Subnets
echo "Creating public subnets..."
PUBLIC_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone ${AWS_REGION}a \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-1},{Key=Project,Value=CarePro},{Key=Type,Value=Public}]" \
    --query 'Subnet.SubnetId' \
    --output text)

PUBLIC_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone ${AWS_REGION}b \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-2},{Key=Project,Value=CarePro},{Key=Type,Value=Public}]" \
    --query 'Subnet.SubnetId' \
    --output text)

# Enable auto-assign public IP for public subnets
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_1_ID --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_2_ID --map-public-ip-on-launch

echo "Public subnets created: $PUBLIC_SUBNET_1_ID, $PUBLIC_SUBNET_2_ID"

# Create Route Table for public subnets
echo "Creating route table..."
PUBLIC_RT_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt},{Key=Project,Value=CarePro},{Key=Type,Value=Public}]" \
    --query 'RouteTable.RouteTableId' \
    --output text)

# Add route to internet gateway
aws ec2 create-route --route-table-id $PUBLIC_RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# Associate subnets with route table
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1_ID --route-table-id $PUBLIC_RT_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_2_ID --route-table-id $PUBLIC_RT_ID

echo "Route table created and associated: $PUBLIC_RT_ID"

# Create Security Groups
echo "Creating security groups..."

# ALB Security Group (allows HTTP/HTTPS from internet)
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-alb-sg \
    --description "Security group for CarePro Application Load Balancer" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-alb-sg},{Key=Project,Value=CarePro}]" \
    --query 'GroupId' \
    --output text)

# Add rules to ALB Security Group
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# ECS Security Group (allows traffic from ALB)
ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-ecs-sg \
    --description "Security group for CarePro ECS tasks" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-ecs-sg},{Key=Project,Value=CarePro}]" \
    --query 'GroupId' \
    --output text)

# Add rules to ECS Security Group
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 3000 \
    --source-group $ALB_SG_ID

aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 8080 \
    --source-group $ALB_SG_ID

echo "Security groups created: ALB=$ALB_SG_ID, ECS=$ECS_SG_ID"

# Save infrastructure details to file
cat > infrastructure-details.json << EOF
{
  "vpc_id": "$VPC_ID",
  "internet_gateway_id": "$IGW_ID",
  "public_subnet_1_id": "$PUBLIC_SUBNET_1_ID",
  "public_subnet_2_id": "$PUBLIC_SUBNET_2_ID",
  "public_route_table_id": "$PUBLIC_RT_ID",
  "alb_security_group_id": "$ALB_SG_ID",
  "ecs_security_group_id": "$ECS_SG_ID",
  "region": "$AWS_REGION",
  "project_name": "$PROJECT_NAME"
}
EOF

echo "✅ VPC infrastructure created successfully!"
echo "📋 Infrastructure details saved to infrastructure-details.json"
echo ""
echo "🏗️ Created Resources:"
echo "VPC: $VPC_ID"
echo "Public Subnets: $PUBLIC_SUBNET_1_ID, $PUBLIC_SUBNET_2_ID"
echo "Security Groups: ALB=$ALB_SG_ID, ECS=$ECS_SG_ID"
echo ""
echo "⚠️  Note: Using public subnets for ECS tasks (simplified setup)"
echo "For production, consider using private subnets with NAT Gateway"