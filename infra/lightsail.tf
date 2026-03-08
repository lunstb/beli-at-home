resource "aws_lightsail_container_service" "backend" {
  name  = "beli-backend"
  power = var.lightsail_power
  scale = var.lightsail_scale

  tags = {
    Project = "beli-at-home"
  }
}
