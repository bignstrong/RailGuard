#!/bin/bash
# Обновление прода: git pull, пересборка образов, перезапуск. Запускается вручную или из cron (03:00 MSK).
set -euo pipefail
cd /opt/railguard

echo "[$(date '+%F %T')] pull"
before=$(git rev-parse HEAD)
git pull --ff-only

echo "[$(date '+%F %T')] build"
docker compose -f docker-compose.prod.yml build

echo "[$(date '+%F %T')] up"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# nginx.conf смонтирован файлом: после git pull контейнер видит старую версию, пока его не пересоздать.
if ! git diff --quiet "$before" HEAD -- nginx/nginx.conf; then
  echo "[$(date '+%F %T')] nginx.conf changed, recreate nginx"
  docker compose -f docker-compose.prod.yml run --rm --no-deps -T nginx nginx -t
  docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
fi

docker image prune -f >/dev/null
docker compose -f docker-compose.prod.yml ps --format '{{.Name}} {{.Status}}'
echo "[$(date '+%F %T')] done"
