#!/usr/bin/env sh
set -eu

RABBITMQ_USER="${RABBITMQ_USER:?RABBITMQ_USER is required}"
RABBITMQ_PASS="${RABBITMQ_PASS:?RABBITMQ_PASS is required}"
RABBITMQ_VHOST="${RABBITMQ_VHOST:-openErp}"

api() {
  method="$1"
  path="$2"
  body="${3:-}"

  if [ -n "$body" ]; then
    curl -fsS -u "$RABBITMQ_USER:$RABBITMQ_PASS" -H "content-type: application/json" -X "$method" "http://rabbitmq:15672/api$path" -d "$body" >/dev/null
  else
    curl -fsS -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X "$method" "http://rabbitmq:15672/api$path" >/dev/null
  fi
}

echo "[rabbitmq-init] Ensuring vhost ${RABBITMQ_VHOST} exists"
api PUT "/vhosts/${RABBITMQ_VHOST}"

echo "[rabbitmq-init] Ensuring direct/topic/fanout/dead-letter exchanges"
api PUT "/exchanges/${RABBITMQ_VHOST}/openErp.direct" '{"type":"direct","durable":true}'
api PUT "/exchanges/${RABBITMQ_VHOST}/openErp.topic" '{"type":"topic","durable":true}'
api PUT "/exchanges/${RABBITMQ_VHOST}/openErp.fanout" '{"type":"fanout","durable":true}'
api PUT "/exchanges/${RABBITMQ_VHOST}/openErp.dead_letter" '{"type":"fanout","durable":true}'

echo "[rabbitmq-init] Done"
