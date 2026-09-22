#!/bin/bash
# Обновление прода: git pull, пересборка образов, перезапуск. Запускается вручную или из cron (03:00 MSK).
set -euo pipefail
cd /opt/railguard

echo "[$(date '+%F %T')] pull"
git pull --ff-only

echo "[$(date '+%F %T')] build"
docker compose -f docker-compose.prod.yml build

echo "[$(date '+%F %T')] up"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

docker image prune -f >/dev/null
docker compose -f docker-compose.prod.yml ps --format '{{.Name}} {{.Status}}'
echo "[$(date '+%F %T')] done"
