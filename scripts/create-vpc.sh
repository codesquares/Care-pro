#!/bin/bash

# CarePro VPC Infrastructure Setup
# Creates VPC, subnets, internet gateway, NAT gateway, and security groups

set -e

AWS_REGION="us-east-1"
PROJECT_NAME="carepro"

echo "🏗️ Creating VPC infrastructure for CarePro..."

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

# Create Public Subnets (for ALB and NAT Gateway)
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

# Create Private Subnets (for ECS tasks)
echo "Creating private subnets..."
PRIVATE_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.10.0/24 \
    --availability-zone ${AWS_REGION}a \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-1},{Key=Project,Value=CarePro},{Key=Type,Value=Private}]" \
    --query 'Subnet.SubnetId' \
    --output text)

PRIVATE_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.11.0/24 \
    --availability-zone ${AWS_REGION}b \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-2},{Key=Project,Value=CarePro},{Key=Type,Value=Private}]" \
    --query 'Subnet.SubnetId' \
    --output text)

echo "Private subnets created: $PRIVATE_SUBNET_1_ID, $PRIVATE_SUBNET_2_ID"

# Allocate Elastic IP for NAT Gateway
echo "Creating Elastic IP for NAT Gateway..."
EIP_ALLOC_ID=$(aws ec2 allocate-address \
    --domain vpc \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-eip},{Key=Project,Value=CarePro}]" \
    --query 'AllocationId' \
    --output text)

# Create NAT Gateway
echo "Creating NAT Gateway..."
NAT_GW_ID=$(aws ec2 create-nat-gateway \
    --subnet-id $PUBLIC_SUBNET_1_ID \
    --allocation-id $EIP_ALLOC_ID \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=nat-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-gw},{Key=Project,Value=CarePro}]" \
    --query 'NatGateway.NatGatewayId' \
    --output text)

echo "NAT Gateway created: $NAT_GW_ID"
echo "Waiting for NAT Gateway to be available..."
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_ID --region $AWS_REGION

# Create Route Tables
echo "Creating route tables..."

# Public Route Table
PUBLIC_RT_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt},{Key=Project,Value=CarePro},{Key=Type,Value=Public}]" \
    --query 'RouteTable.RouteTableId' \
    --output text)

# Private Route Table
PRIVATE_RT_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt},{Key=Project,Value=CarePro},{Key=Type,Value=Private}]" \
    --query 'RouteTable.RouteTableId' \
    --output text)

# Add routes
aws ec2 create-route --route-table-id $PUBLIC_RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 create-route --route-table-id $PRIVATE_RT_ID --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW_ID

# Associate subnets with route tables
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1_ID --route-table-id $PUBLIC_RT_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_2_ID --route-table-id $PUBLIC_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_SUBNET_1_ID --route-table-id $PRIVATE_RT_ID
aws ec2 associate-route-table --subnet-id $PRIVATE_SUBNET_2_ID --route-table-id $PRIVATE_RT_ID

echo "Route tables created and associated"

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

# Allow outbound HTTPS for ECS tasks (for API calls)
aws ec2 authorize-security-group-egress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

echo "Security groups created: ALB=$ALB_SG_ID, ECS=$ECS_SG_ID"

# Save infrastructure details to file
cat > infrastructure-details.json << EOF
{
  "vpc_id": "$VPC_ID",
  "internet_gateway_id": "$IGW_ID",
  "public_subnet_1_id": "$PUBLIC_SUBNET_1_ID",
  "public_subnet_2_id": "$PUBLIC_SUBNET_2_ID",
  "private_subnet_1_id": "$PRIVATE_SUBNET_1_ID",
  "private_subnet_2_id": "$PRIVATE_SUBNET_2_ID",
  "nat_gateway_id": "$NAT_GW_ID",
  "elastic_ip_allocation_id": "$EIP_ALLOC_ID",
  "public_route_table_id": "$PUBLIC_RT_ID",
  "private_route_table_id": "$PRIVATE_RT_ID",
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
echo "Private Subnets: $PRIVATE_SUBNET_1_ID, $PRIVATE_SUBNET_2_ID"
echo "Security Groups: ALB=$ALB_SG_ID, ECS=$ECS_SG_ID"