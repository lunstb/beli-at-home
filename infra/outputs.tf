output "lightsail_url" {
  value       = aws_lightsail_container_service.backend.url
  description = "Lightsail container service URL"
}

output "frontend_url" {
  value = "https://${var.frontend_subdomain}.${var.domain}"
}

output "backend_url" {
  value = "https://${var.backend_subdomain}.${var.domain}"
}

output "s3_bucket_photos" {
  value = aws_s3_bucket.photos.bucket
}

output "s3_bucket_backups" {
  value = aws_s3_bucket.backups.bucket
}
