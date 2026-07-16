#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:5005/api}"
SECRETS_FILE="${QA_SECRETS_FILE:-.qa-secrets/session.env}"

if [[ -z "${QA_REFRESH_TOKEN:-}" ]]; then
  if [[ -f "$SECRETS_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$SECRETS_FILE"
  fi
fi

if [[ -z "${QA_REFRESH_TOKEN:-}" ]]; then
  echo "QA_REFRESH_TOKEN not set and no token found in $SECRETS_FILE"
  exit 1
fi

http_code=$(curl -sS -o /tmp/qa_revoke_response.json -w '%{http_code}' \
  -X POST "$API_BASE/Authentications/RevokeToken" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$QA_REFRESH_TOKEN\"}")

msg=$(jq -r '.message // .Message // "(no message)"' /tmp/qa_revoke_response.json 2>/dev/null)
echo "RevokeToken HTTP $http_code | $msg"
