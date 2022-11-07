#!/usr/bin/env bash

set -e

DOMAIN="music.ludik.xyz"
EMAIL="ludovico.fabbri@gmail.com"

sudo docker run -it --rm --name certbot \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
    -v "/var/www/letsencrypt:/var/www/letsencrypt" \
    certbot certonly --webroot -w /var/www/letsencrypt --agree-tos -m $EMAIL -d $DOMAIN --dry-run