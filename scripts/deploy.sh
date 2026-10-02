#!/usr/bin/env bash
# 화면 코드 변경분을 배포한다. 인프라는 scripts/provision.sh 로 먼저 만들어 두어야 한다.
#   빌드 → S3 동기화 → CloudFront 캐시 무효화
set -euo pipefail

cd "$(dirname "$0")/.."
TF_DIR=infra/terraform
export AWS_REGION="${AWS_REGION:-ap-northeast-2}"

BUCKET=$(terraform -chdir="$TF_DIR" output -raw site_bucket)
DISTRIBUTION_ID=$(terraform -chdir="$TF_DIR" output -raw distribution_id)
SITE_URL=$(terraform -chdir="$TF_DIR" output -raw site_url)

if [[ "${SKIP_BUILD:-false}" != "true" ]]; then
  if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
  npm run build
fi

echo "==> 업로드: s3://${BUCKET}"
# 파일명에 해시가 붙는 assets/ 는 오래 캐시하고, 나머지(index.html 등)는 매번 확인하게 한다.
aws s3 sync dist/assets "s3://${BUCKET}/assets" --only-show-errors \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync dist "s3://${BUCKET}" --only-show-errors --delete --exclude "assets/*" \
  --cache-control "no-cache"
aws s3 sync dist/assets "s3://${BUCKET}/assets" --only-show-errors --delete

echo "==> CloudFront 캐시 무효화"
# 경로 1건은 무료 한도(월 1,000건)에서 1건으로 계산된다.
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" \
  --query Invalidation.Id --output text > /dev/null

echo "==> 완료: ${SITE_URL}"
