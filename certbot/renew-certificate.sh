#!/usr/bin/env bash

# Renews certificates that are close to expiry, then restarts nginx so it
# loads them. Runs non-interactively (no TTY), so it is safe under cron.
# Extra arguments are forwarded to certbot, e.g. --dry-run.

set -e

sudo docker run --rm --name certbot \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
    -v "/var/www/letsencrypt:/var/www/letsencrypt" \
    certbot/certbot renew "$@"

sudo docker compose restart nginx
