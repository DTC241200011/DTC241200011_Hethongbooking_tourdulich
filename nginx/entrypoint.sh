#!/bin/sh
set -e

SSL_DIR="/etc/nginx/ssl"
CERT_FILE="${SSL_DIR}/cert.pem"
KEY_FILE="${SSL_DIR}/key.pem"

mkdir -p "${SSL_DIR}"

# Auto-generate self-signed SSL certificate if not present
if [ ! -f "${CERT_FILE}" ] || [ ! -f "${KEY_FILE}" ]; then
    echo "[NGINX INIT] Generating self-signed SSL certificate for localhost (De 20)..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${KEY_FILE}" \
        -out "${CERT_FILE}" \
        -subj "/C=VN/ST=Hanoi/L=Hanoi/O=DTC241200011/OU=IT/CN=localhost"
    chmod 600 "${KEY_FILE}"
    chmod 644 "${CERT_FILE}"
    echo "[NGINX INIT] SSL certificate successfully generated."
else
    echo "[NGINX INIT] Existing SSL certificate found."
fi

echo "[NGINX INIT] Starting Nginx reverse proxy..."
exec nginx -g "daemon off;"

