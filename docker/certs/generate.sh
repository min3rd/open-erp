#!/bin/sh
# Dev-only mTLS material for the plugin data gateway.
# Idempotent: reruns do nothing once the certificates exist.
set -eu

cd /certs
if [ -f ca.crt ] && [ -f server.crt ] && [ -f tenant-client.crt ] && [ -f system-client.crt ] && [ -f truststore.jks ]; then
  exit 0
fi

rm -f ./*.crt ./*.key ./*.csr ./*.ext ./*.jks ./*.srl

openssl genrsa -out ca.key 2048 >/dev/null 2>&1
openssl req -x509 -new -key ca.key -days 3650 -subj "/CN=openerp-plugin-ca" -out ca.crt >/dev/null 2>&1

openssl genrsa -out server.key 2048 >/dev/null 2>&1
openssl req -new -key server.key -subj "/CN=backend-dev" -out server.csr >/dev/null 2>&1
printf "subjectAltName=DNS:backend-dev,DNS:localhost,DNS:backend\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n" > server.ext
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 \
  -extfile server.ext -out server.crt >/dev/null 2>&1

printf "keyUsage=digitalSignature\nextendedKeyUsage=clientAuth\n" > client.ext
for role in tenant system; do
  openssl genrsa -out "$role-client.key" 2048 >/dev/null 2>&1
  openssl req -new -key "$role-client.key" -subj "/CN=$role" -out "$role-client.csr" >/dev/null 2>&1
  openssl x509 -req -in "$role-client.csr" -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 \
    -extfile client.ext -out "$role-client.crt" >/dev/null 2>&1
done

keytool -importcert -noprompt -alias openerp-plugin-ca -file ca.crt \
  -keystore truststore.jks -storepass changeit >/dev/null 2>&1

chmod 644 ./*.crt ./*.key ./*.jks
echo "plugin mTLS material ready in /certs"
