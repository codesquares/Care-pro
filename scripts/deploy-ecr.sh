#!/bin/bash

# CarePro AWS Deployment Script
# This script sets up ECR repositories and deploys both frontend and backend

set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_PREFIX="carepro"
API_REPO_NAME="${REPO_PREFIX}-api"
FRONTEND_REPO_NAME="${REPO_PREFIX}-frontend"

echo "🚀 Starting CarePro AWS Deployment..."
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"

# Function to create ECR repository if it doesn't exist
create_ecr_repo() {
    local repo_name=$1
    echo "📦 Checking ECR repository: $repo_name"
    
    if ! aws ecr describe-repositories --repository-names $repo_name --region $AWS_REGION >/dev/null 2>&1; then
        echo "Creating ECR repository: $repo_name"
        aws ecr create-repository \
            --repository-name $repo_name \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        
        # Set lifecycle policy to keep only recent images
        aws ecr put-lifecycle-policy \
            --repository-name $repo_name \
            --region $AWS_REGION \
            --lifecycle-policy-text '{
                "rules": [
                    {
                        "rulePriority": 1,
                        "description": "Keep last 10 images",
                        "selection": {
                            "tagStatus": "any",
                            "countType": "imageCountMoreThan",
                            "countNumber": 10
                        },
                        "action": {
                            "type": "expire"
                        }
                    }
                ]
            }'
    else
        echo "ECR repository $repo_name already exists"
    fi
}

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repositories
create_ecr_repo $API_REPO_NAME
create_ecr_repo $FRONTEND_REPO_NAME

# Build and push API image
echo "🔨 Building and pushing API image..."
cd node-API
docker build -t $API_REPO_NAME:latest .
docker tag $API_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$API_REPO_NAME:latest
docker tag $API_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$API_REPO_NAME:$(date +%Y%m%d-%H%M%S)
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$API_REPO_NAME:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$API_REPO_NAME:$(date +%Y%m%d-%H%M%S)
cd ..

# Build and push Frontend image
echo "🔨 Building and pushing Frontend image..."
cd frontend/vite-project
docker build -t $FRONTEND_REPO_NAME:latest .
docker tag $FRONTEND_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO_NAME:latest
docker tag $FRONTEND_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO_NAME:$(date +%Y%m%d-%H%M%S)
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO_NAME:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO_NAME:$(date +%Y%m%d-%H%M%S)
cd ../..

echo "✅ ECR repositories created and images pushed successfully!"
echo "API Repository: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$API_REPO_NAME"
echo "Frontend Repository: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_REPO_NAME"