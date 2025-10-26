#!/bin/bash

# CarePro Parameter Store Setup
# Sets up API keys in AWS Parameter Store for Node-API middleware

set -e

AWS_REGION="us-east-1"
PARAM_PREFIX="/carepro"

echo "🔐 Setting up AWS Parameter Store for CarePro..."

# Function to create parameter
create_parameter() {
    local param_name=$1
    local param_value=$2
    local param_type=${3:-"SecureString"}
    
    echo "Creating parameter: $param_name"
    aws ssm put-parameter \
        --region $AWS_REGION \
        --name "$PARAM_PREFIX/$param_name" \
        --value "$param_value" \
        --type "$param_type" \
        --overwrite
}

# Prompt for API keys and configuration
echo "📝 Please provide the following API keys and configuration for Node-API middleware:"

read -p "Enter Dojah App ID: " DOJAH_APP_ID
read -p "Enter Dojah Secret Key: " DOJAH_SECRET_KEY
read -p "Enter Dojah Base URL (default: https://api.dojah.io): " DOJAH_BASE_URL
DOJAH_BASE_URL=${DOJAH_BASE_URL:-"https://api.dojah.io"}

read -p "Enter OpenAI API Key: " OPENAI_API_KEY

# Smile ID configuration
read -p "Enter Smile Partner ID (default: 7439): " SMILE_PARTNER_ID
SMILE_PARTNER_ID=${SMILE_PARTNER_ID:-"7439"}
read -p "Enter Smile Signature (default: CALC_SIGNATURE): " SMILE_SIGNATURE
SMILE_SIGNATURE=${SMILE_SIGNATURE:-"CALC_SIGNATURE"}

# Stripe configuration  
read -p "Enter Stripe Secret Key: " STRIPE_SECRET_KEY

# API URLs
read -p "Enter API URL (production backend): " API_URL
read -p "Enter Local API URL (default: http://localhost:3000/api): " LOCAL_API_URL
LOCAL_API_URL=${LOCAL_API_URL:-"http://localhost:3000/api"}

# Security settings
read -p "Enter Internal API Key: " INTERNAL_API_KEY
read -p "Enter Dojah Webhook Secret: " DOJAH_WEBHOOK_SECRET

# Create core API parameters
create_parameter "dojah/app-id" "$DOJAH_APP_ID"
create_parameter "dojah/secret-key" "$DOJAH_SECRET_KEY"
create_parameter "dojah/base-url" "$DOJAH_BASE_URL" "String"
create_parameter "openai/api-key" "$OPENAI_API_KEY"

# Create Smile ID parameters
create_parameter "smile/partner-id" "$SMILE_PARTNER_ID" "String"
create_parameter "smile/signature" "$SMILE_SIGNATURE" "String"

# Create Stripe parameters
create_parameter "stripe/secret-key" "$STRIPE_SECRET_KEY"

# Create API URL parameters
create_parameter "api/url" "$API_URL" "String"
create_parameter "api/local-url" "$LOCAL_API_URL" "String"

# Create security parameters
create_parameter "security/internal-api-key" "$INTERNAL_API_KEY"
create_parameter "security/dojah-webhook-secret" "$DOJAH_WEBHOOK_SECRET"
create_parameter "security/bypass-auth" "false" "String"

# Create webhook configuration
create_parameter "webhook/rate-limit-window-ms" "300000" "String"
create_parameter "webhook/rate-limit-max-requests" "100" "String"
create_parameter "webhook/max-payload-size" "10485760" "String"
create_parameter "webhook/signature-verification" "true" "String"

# Create application environment parameters
create_parameter "app/node-env" "production" "String"
create_parameter "app/port" "3000" "String"
create_parameter "app/cors-origin" "*" "String"

echo "✅ Parameter Store setup complete!"
echo "Parameters created under prefix: $PARAM_PREFIX"

# List created parameters
echo "📋 Created parameters:"
aws ssm get-parameters-by-path \
    --region $AWS_REGION \
    --path "$PARAM_PREFIX" \
    --recursive \
    --query "Parameters[].Name" \
    --output table