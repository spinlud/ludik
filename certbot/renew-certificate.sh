#!/usr/bin/env bash

set -e

DOMAIN="music.ludik.xyz"
EMAIL="ludovico.fabbri@gmail.com"

sudo docker run -it --rm --name certbot \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
    -v "/var/www/letsencrypt:/var/www/letsencrypt" \
    certbot/certbot certonly --webroot -w /var/www/letsencrypt --agree-tos -m $EMAIL -d $DOMAIN --force-renewal # Add --dry-run to simulate

sudo docker compose restart nginx