#!/bin/bash

# CarePro Parameter Store Setup from .env files
# Imports existing environment variables from both .env files to AWS Parameter Store

set -e

AWS_REGION="us-east-1"
PARAM_PREFIX="/carepro"
BACKEND_ENV_FILE="node-API/.env"
FRONTEND_ENV_FILE="frontend/vite-project/.env"

echo "🔐 Setting up AWS Parameter Store from .env files..."

# Check if .env files exist
if [ ! -f "$BACKEND_ENV_FILE" ]; then
    echo "❌ Backend .env file not found at $BACKEND_ENV_FILE"
    exit 1
fi

if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    echo "❌ Frontend .env file not found at $FRONTEND_ENV_FILE"
    exit 1
fi

# Function to create parameter
create_parameter() {
    local param_name=$1
    local param_value=$2
    local param_type=${3:-"SecureString"}
    
    if [ ! -z "$param_value" ]; then
        echo "Creating parameter: $param_name"
        aws ssm put-parameter \
            --region $AWS_REGION \
            --name "$PARAM_PREFIX/$param_name" \
            --value "$param_value" \
            --type "$param_type" \
            --overwrite
    fi
}

# Source the .env files to load variables
echo "📝 Loading backend environment variables from $BACKEND_ENV_FILE..."
set -a  # automatically export all variables
source "$BACKEND_ENV_FILE"

# Store backend variables
BACKEND_OPENAI_API_KEY="$OPENAI_API_KEY"
BACKEND_DOJAH_APP_ID="$DOJAH_APP_ID"
BACKEND_DOJAH_API_KEY="$DOJAH_API_KEY"
BACKEND_SMILE_SIGNATURE="$SMILE_SIGNATURE"
BACKEND_SMILE_PARTNER_ID="$SMILE_PARTNER_ID"
BACKEND_STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
BACKEND_API_URL="$API_URL"
BACKEND_LOCAL_API_URL="$LOCAL_API_URL"
BACKEND_INTERNAL_API_KEY="$INTERNAL_API_KEY"
BACKEND_DOJAH_WEBHOOK_SECRET="$DOJAH_WEBHOOK_SECRET"
BACKEND_BYPASS_AUTH="$BYPASS_AUTH"
BACKEND_WEBHOOK_RATE_LIMIT_WINDOW_MS="$WEBHOOK_RATE_LIMIT_WINDOW_MS"
BACKEND_WEBHOOK_RATE_LIMIT_MAX_REQUESTS="$WEBHOOK_RATE_LIMIT_MAX_REQUESTS"
BACKEND_WEBHOOK_MAX_PAYLOAD_SIZE="$WEBHOOK_MAX_PAYLOAD_SIZE"
BACKEND_WEBHOOK_SIGNATURE_VERIFICATION="$WEBHOOK_SIGNATURE_VERIFICATION"
BACKEND_PORT="$PORT"

# Clear variables and load frontend
unset $(grep -v '^#' "$BACKEND_ENV_FILE" | sed -E 's/(.*)=.*/\1/' | xargs)

echo "📝 Loading frontend environment variables from $FRONTEND_ENV_FILE..."
source "$FRONTEND_ENV_FILE"
set +a  # turn off automatic export

# Create parameters from backend .env variables
echo "📦 Creating node-api parameters in AWS Parameter Store..."

# Core API parameters
create_parameter "node-api/openai/api-key" "$BACKEND_OPENAI_API_KEY"
create_parameter "node-api/dojah/app-id" "$BACKEND_DOJAH_APP_ID"
create_parameter "node-api/dojah/api-key" "$BACKEND_DOJAH_API_KEY"

# Smile ID parameters
create_parameter "node-api/smile/signature" "$BACKEND_SMILE_SIGNATURE" "String"
create_parameter "node-api/smile/partner-id" "$BACKEND_SMILE_PARTNER_ID" "String"

# Stripe parameters
create_parameter "node-api/stripe/secret-key" "$BACKEND_STRIPE_SECRET_KEY"

# API URLs (Node-API doesn't need to connect to C#/.NET backend, it's independent middleware)
create_parameter "node-api/api/local-url" "$BACKEND_LOCAL_API_URL" "String"

# Security parameters
create_parameter "node-api/security/internal-api-key" "$BACKEND_INTERNAL_API_KEY"
create_parameter "node-api/security/dojah-webhook-secret" "$BACKEND_DOJAH_WEBHOOK_SECRET"
create_parameter "node-api/security/bypass-auth" "$BACKEND_BYPASS_AUTH" "String"

# Webhook configuration
create_parameter "node-api/webhook/rate-limit-window-ms" "$BACKEND_WEBHOOK_RATE_LIMIT_WINDOW_MS" "String"
create_parameter "node-api/webhook/rate-limit-max-requests" "$BACKEND_WEBHOOK_RATE_LIMIT_MAX_REQUESTS" "String"
create_parameter "node-api/webhook/max-payload-size" "$BACKEND_WEBHOOK_MAX_PAYLOAD_SIZE" "String"
create_parameter "node-api/webhook/signature-verification" "$BACKEND_WEBHOOK_SIGNATURE_VERIFICATION" "String"

# Application environment parameters
create_parameter "node-api/app/node-env" "production" "String"
create_parameter "node-api/app/port" "$BACKEND_PORT" "String"
create_parameter "node-api/app/cors-origin" "*" "String"

# Create parameters from frontend .env variables
echo "📦 Creating frontend parameters in AWS Parameter Store..."

# Contentful CMS parameters
create_parameter "frontend/contentful/space-id" "$VITE_CONTENTFUL_SPACE_ID" "String"
create_parameter "frontend/contentful/access-token-published" "$VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED"
create_parameter "frontend/contentful/access-token-draft" "$VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT"
create_parameter "frontend/contentful/environment" "$VITE_CONTENTFUL_ENVIRONMENT" "String"

# API URLs for frontend (keep current Azure backend URLs until C#/.NET migration)
create_parameter "frontend/api/url" "$VITE_API_URL" "String"
create_parameter "frontend/api/local-url" "$VITE_LOCAL_API_URL" "String"

# Dojah widget parameters for frontend
create_parameter "frontend/dojah/widget-id" "$VITE_DOJAH_WIDGET_ID" "String"
create_parameter "frontend/dojah/app-id" "$VITE_DOJAH_APP_ID" "String"
create_parameter "frontend/dojah/public-key" "$VITE_DOJAH_PUBLIC_KEY" "String"

# Additional frontend parameters from config.js (keep current Azure URLs)
create_parameter "frontend/api/azure-url" "https://carepro-api20241118153443.azurewebsites.net/api" "String"
create_parameter "frontend/api/fallback-url" "https://carepro-api20241118153443.azurewebsites.net" "String"
create_parameter "frontend/api/localhost-url" "http://localhost:3000/api" "String"
create_parameter "frontend/dojah/api-url" "https://api.dojah.io" "String"
create_parameter "frontend/dojah/identity-url" "https://identity.dojah.io" "String"
create_parameter "frontend/app/debug" "false" "String"
create_parameter "frontend/app/mode" "production" "String"

echo "✅ Parameter Store setup complete!"
echo "Parameters created under prefix: $PARAM_PREFIX"

# Try to list created parameters (might fail due to permissions)
echo "📋 Attempting to list created parameters..."
aws ssm get-parameters-by-path \
    --region $AWS_REGION \
    --path "$PARAM_PREFIX" \
    --recursive \
    --query "Parameters[].Name" \
    --output table 2>/dev/null || echo "Note: Unable to list parameters due to permissions, but they were created successfully."