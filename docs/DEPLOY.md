# AWS 배포 가이드 (프리 티어)

## 1. 구성

```
브라우저
   │ HTTPS  https://xxxx.cloudfront.net
   ▼
CloudFront  ── CloudFront Function (Basic 인증 + SPA 라우팅)
 ├─ /knock/*  → knock-api  API Gateway → Lambda   (캐시 안 함)
 └─ 그 외      → S3 (dist, 비공개 버킷 · OAC 로만 접근)
```

- 화면과 API 가 **같은 도메인**이라 `questionApi.ts` 의 `baseURL: '/knock/admin'` 을 그대로 씁니다.
  로컬 `vite` 의 proxy(`/knock/` → `localhost:8082`)와 같은 구조이므로 CORS 설정이 필요 없습니다.
- `/questions/1` 처럼 확장자가 없는 경로는 `index.html` 로 돌려 React Router 가 처리합니다.

| 리소스 | 무료 한도 | 백오피스 예상 사용량 |
|---|---|---|
| CloudFront | **상시 무료**: 월 1TB 전송 + 1,000만 요청 | 수 MB |
| CloudFront Functions | **상시 무료**: 월 200만 호출 | 수천 건 |
| CloudFront 캐시 무효화 | 월 1,000 경로 무료 | 배포 1회당 1 |
| S3 | 12개월 5GB (이후 GB 당 약 $0.025) | 약 0.4MB → 사실상 $0 |

> 2025-07-15 이후 가입한 계정은 크레딧 기반 Free plan 이 적용됩니다. 위 사용량이면 크레딧 차감도 거의 없습니다.
> 예산 알림은 knock-api 의 AWS Budgets(월 $5)가 계정 전체에 적용됩니다.

## 2. 사전 준비

- knock-api 가 먼저 배포되어 있어야 합니다 (`../knock-api/docs/DEPLOY.md`).
  `provision.sh` 가 `../knock-api/infra/terraform` 의 `terraform output api_url` 에서 API 도메인을 읽습니다.
- AWS CLI 로그인, Terraform, Node.js 는 knock-api 와 동일합니다.

```bash
aws sts get-caller-identity
```

## 3. 최초 배포

```bash
./scripts/provision.sh
```

1. 처음 실행하면 `infra/terraform/terraform.tfvars` 를 만들고 멈춥니다.
   `basic_auth_users` 의 비밀번호를 바꾼 뒤 다시 실행하세요.
2. `terraform apply` (`yes` 입력) — CloudFront 생성에 3~5분 걸립니다.
3. 이어서 `deploy.sh` 가 빌드 후 업로드하고 URL 을 출력합니다.

접속하면 브라우저가 아이디/비밀번호를 묻습니다.

## 4. 코드 수정 후 재배포

```bash
./scripts/deploy.sh
```

빌드 → S3 동기화 → CloudFront 캐시 무효화. 반영까지 1~2분 걸립니다.

## 5. 접근 제한 (Basic 인증)

knock-api 의 `/knock/admin/**` 에는 현재 인증이 없습니다. 그래서 CloudFront 앞단에서 Basic 인증을 겁니다.

- 계정 추가/변경: `terraform.tfvars` 의 `basic_auth_users` 수정 후 `./scripts/provision.sh`
- 인증을 끄려면 `basic_auth_users = {}` (권장하지 않음)

> ⚠️ 이것은 **백오피스 도메인만** 보호합니다. API Gateway 주소(`https://xxxx.execute-api...`)로
> 직접 호출하면 여전히 admin API 에 접근할 수 있습니다. 실제 운영 전에는 knock-api 에
> 인증(Spring Security 등)을 추가하거나 admin 경로를 CloudFront 에서만 호출되도록 막으세요.

## 6. 문제 해결

| 증상 | 원인 / 확인 방법 |
|---|---|
| 화면은 뜨는데 API 가 `{"message":"Not Found"}` | `knock_api_domain` 이 올바른지 확인 (`terraform.tfvars`) |
| API 가 `{"message":"Forbidden"}` | Host 헤더가 전달된 경우. `/knock/*` 동작의 origin request policy 가 `AllViewerExceptHostHeader` 인지 확인 |
| 배포했는데 이전 화면이 보임 | 무효화 완료까지 1~2분 대기 후 강력 새로고침 |
| 새로고침 시 404/403 | CloudFront Function 연결 확인 (`terraform apply` 재실행) |

## 7. 전체 삭제

```bash
terraform -chdir=infra/terraform destroy
```

S3 버킷은 `force_destroy` 가 켜져 있어 파일째 삭제됩니다.
