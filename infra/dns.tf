# DNS is managed via Cloudflare (not Route53).
#
# Manually create these CNAME records in Cloudflare:
#
# beli.berkelunstad.com         → lunstb.github.io                    (DNS only / gray cloud)
# beli-backend.berkelunstad.com → <lightsail URL from terraform output>  (DNS only or proxied)
