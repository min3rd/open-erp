#!/usr/bin/env bash
set -eu

MONGO_RS_NAME="${MONGO_RS_NAME:-rs0}"

echo "[mongodb-rs-init] Waiting for MongoDB to be ready..."
until mongo --host mongodb --port 27017 --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1; do
  sleep 2
done

echo "[mongodb-rs-init] Ensuring replica set ${MONGO_RS_NAME} is configured..."
mongo --host mongodb --port 27017 --quiet --eval "var rsName='${MONGO_RS_NAME}';var cfg={_id:rsName,members:[{_id:0,host:'mongodb:27017'}]};try{var st=rs.status();if(st.ok===1){print('ALREADY_INIT');quit(0);}}catch(e){print('NOT_INIT');}var r=rs.initiate(cfg);if(r.ok!==1){print('INIT_FAIL');quit(1);}print('INIT_OK');" 2>/dev/null
echo "[mongodb-rs-init] Done."
