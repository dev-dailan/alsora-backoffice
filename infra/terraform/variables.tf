variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}

variable "app_name" {
  type    = string
  default = "alsora-backoffice"
}

# ---------- API (knock-api) ----------

variable "knock_api_domain" {
  description = "knock-api 의 API Gateway 도메인 (https:// 와 경로 제외). knock-api/infra/terraform 에서 terraform output api_url 로 확인"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+\\.execute-api\\.[a-z0-9-]+\\.amazonaws\\.com$", var.knock_api_domain))
    error_message = "예: abcd1234.execute-api.ap-northeast-2.amazonaws.com"
  }
}

# ---------- 접근 제한 ----------

variable "basic_auth_users" {
  description = "Basic 인증 계정 { 아이디 = 비밀번호 }. 비우면 누구나 접속할 수 있다."
  type        = map(string)
  default     = {}
  sensitive   = true
}
