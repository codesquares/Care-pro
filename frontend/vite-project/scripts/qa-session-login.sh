#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:5005/api}"
SECRETS_DIR="${QA_SECRETS_DIR:-.qa-secrets}"
SECRETS_FILE="${QA_SECRETS_FILE:-$SECRETS_DIR/session.env}"

EMAIL="${1:-${QA_EMAIL:-}}"
PASSWORD="${2:-${QA_PASSWORD:-}}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "Usage: $0 <email> <password>"
  echo "Or set QA_EMAIL and QA_PASSWORD env vars."
  exit 1
fi

mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

login_json=$(curl -sS -X POST "$API_BASE/Authentications/UserLogin" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

token=$(echo "$login_json" | jq -r '.token // empty')
refresh_token=$(echo "$login_json" | jq -r '.refreshToken // empty')
user_id=$(echo "$login_json" | jq -r '.id // empty')
role=$(echo "$login_json" | jq -r '.role // empty')

if [[ -z "$token" || -z "$refresh_token" ]]; then
  msg=$(echo "$login_json" | jq -r '.message // .Message // "Login failed"' 2>/dev/null)
  echo "Login failed: $msg"
  exit 1
fi

cat > "$SECRETS_FILE" <<EOF
QA_EMAIL=$EMAIL
QA_USER_ID=$user_id
QA_ROLE=$role
QA_AUTH_TOKEN=$token
QA_REFRESH_TOKEN=$refresh_token
QA_TOKEN_SAVED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
chmod 600 "$SECRETS_FILE"

prefix="${token:0:8}"
suffix="${token: -6}"

echo "Saved session to $SECRETS_FILE"
echo "User: $EMAIL ($role)"
echo "Token: ${prefix}...${suffix}"
echo "Run: source $SECRETS_FILE"
