variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "domain" {
  description = "Root domain"
  type        = string
  default     = "berkelunstad.com"
}

variable "frontend_subdomain" {
  description = "Frontend subdomain"
  type        = string
  default     = "beli"
}

variable "backend_subdomain" {
  description = "Backend subdomain"
  type        = string
  default     = "beli-backend"
}

variable "lightsail_power" {
  description = "Lightsail container service power (nano, micro, small, etc.)"
  type        = string
  default     = "nano"
}

variable "lightsail_scale" {
  description = "Number of container instances"
  type        = number
  default     = 1
}
