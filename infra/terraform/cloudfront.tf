data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

# Host 헤더를 넘기면 API Gateway 가 요청을 거부하므로 Host 만 제외하고 전달한다.
data "aws_cloudfront_origin_request_policy" "all_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

locals {
  s3_origin_id  = "site"
  api_origin_id = "knock-api"
  basic_auth_tokens = [
    for user, password in nonsensitive(var.basic_auth_users) : base64encode("${user}:${password}")
  ]
}

# 뷰어 요청 함수: Basic 인증 + SPA 라우팅(/questions/1 → /index.html)
resource "aws_cloudfront_function" "site" {
  name    = "${var.app_name}-site"
  runtime = "cloudfront-js-2.0"
  publish = true
  code = templatefile("${path.module}/functions/viewer-request.js.tftpl", {
    tokens      = local.basic_auth_tokens
    spa_rewrite = true
  })
}

resource "aws_cloudfront_function" "api" {
  count   = length(local.basic_auth_tokens) > 0 ? 1 : 0
  name    = "${var.app_name}-api"
  runtime = "cloudfront-js-2.0"
  publish = true
  code = templatefile("${path.module}/functions/viewer-request.js.tftpl", {
    tokens      = local.basic_auth_tokens
    spa_rewrite = false
  })
}

# 화면과 API 를 같은 도메인으로 제공한다.
#   /knock/*  → knock-api (API Gateway)   ← vite dev server 의 proxy 와 같은 구조라 CORS 설정 불필요
#   그 외      → S3 (dist)
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  comment             = var.app_name
  default_root_object = "index.html"
  price_class         = "PriceClass_200" # 서울 엣지 포함, 남미/오세아니아 제외
  http_version        = "http2and3"

  origin {
    origin_id                = local.s3_origin_id
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  origin {
    origin_id   = local.api_origin_id
    domain_name = var.knock_api_domain

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 30
    }
  }

  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.site.arn
    }
  }

  ordered_cache_behavior {
    path_pattern             = "/knock/*"
    target_origin_id         = local.api_origin_id
    viewer_protocol_policy   = "https-only"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_except_host.id
    compress                 = true

    dynamic "function_association" {
      for_each = aws_cloudfront_function.api
      content {
        event_type   = "viewer-request"
        function_arn = function_association.value.arn
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
