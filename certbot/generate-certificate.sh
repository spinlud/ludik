#!/usr/bin/env bash

set -e

DOMAIN="music.ludik.xyz"
EMAIL="ludovico.fabbri@gmail.com"

# Run this when nginx and node services are down
sudo docker run -it --rm --name certbot \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
    -p 80:80 \
    -p 443:443 \
    certbot/certbot certonly --standalone --non-interactive --agree-tos -m $EMAIL -d $DOMAIN