#!/usr/bin/env bash
# 인프라(S3 + CloudFront)를 만들거나 변경분을 반영한 뒤 화면을 배포한다.
# knock-api 가 먼저 배포되어 있어야 한다 (API Gateway 도메인을 가져온다).
set -euo pipefail

cd "$(dirname "$0")/.."
TF_DIR=infra/terraform
KNOCK_API_TF_DIR="${KNOCK_API_TF_DIR:-../knock-api/infra/terraform}"

if [[ ! -f "$TF_DIR/terraform.tfvars" ]]; then
  cp "$TF_DIR/terraform.tfvars.example" "$TF_DIR/terraform.tfvars"
  echo "==> $TF_DIR/terraform.tfvars 를 만들었습니다."
fi

echo "==> knock-api 도메인 확인"
API_URL=$(terraform -chdir="$KNOCK_API_TF_DIR" output -raw api_url)
API_DOMAIN=$(echo "$API_URL" | sed -E 's#^https://([^/]+).*#\1#')
echo "    $API_DOMAIN"

if grep -q '^knock_api_domain' "$TF_DIR/terraform.tfvars"; then
  sed -i '' -E "s#^knock_api_domain.*#knock_api_domain = \"${API_DOMAIN}\"#" "$TF_DIR/terraform.tfvars"
else
  echo "knock_api_domain = \"${API_DOMAIN}\"" >> "$TF_DIR/terraform.tfvars"
fi

if grep -q 'change-me' "$TF_DIR/terraform.tfvars"; then
  echo "!! $TF_DIR/terraform.tfvars 의 basic_auth_users 비밀번호를 바꾼 뒤 다시 실행하세요." >&2
  exit 1
fi

terraform -chdir="$TF_DIR" init -upgrade
terraform -chdir="$TF_DIR" apply

./scripts/deploy.sh
