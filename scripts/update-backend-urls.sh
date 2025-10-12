#!/bin/bash

# Update Backend URLs in Parameter Store
# Run this script after deploying the C#/.NET backend to AWS

set -e

AWS_REGION="us-east-1"
PARAM_PREFIX="/carepro"

echo "🔄 Updating backend URL parameters..."

# Prompt for the new backend URL
read -p "Enter the new C#/.NET backend URL (e.g., https://your-backend.amazonaws.com): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend URL is required"
    exit 1
fi

# Remove trailing slash if present
BACKEND_URL=${BACKEND_URL%/}

# Function to update parameter
update_parameter() {
    local param_name=$1
    local param_value=$2
    local param_type=${3:-"String"}
    
    echo "Updating parameter: $param_name = $param_value"
    aws ssm put-parameter \
        --region $AWS_REGION \
        --name "$PARAM_PREFIX/$param_name" \
        --value "$param_value" \
        --type "$param_type" \
        --overwrite
}

# Update node-api backend URL references
update_parameter "node-api/api/url" "${BACKEND_URL}/api"

# Update frontend backend URL references
update_parameter "frontend/api/url" "${BACKEND_URL}/api"
update_parameter "frontend/api/azure-url" "${BACKEND_URL}/api"
update_parameter "frontend/api/fallback-url" "${BACKEND_URL}"

echo "✅ Backend URLs updated successfully!"
echo "Updated URLs to: $BACKEND_URL"
echo ""
echo "📋 Updated parameters:"
echo "- /carepro/node-api/api/url"
echo "- /carepro/frontend/api/url"
echo "- /carepro/frontend/api/azure-url"
echo "- /carepro/frontend/api/fallback-url"