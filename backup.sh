#!/bin/bash
# Ежедневный бэкап Postgres: дамп в /opt/railguard/backups (14 дней) + отправка в Telegram (curl, опционально через прокси),
# при неудаче — письмом через SMTP из .env. Запуск вручную или из cron (02:30 MSK).
set -uo pipefail
cd /opt/railguard
set -a; . ./.env; set +a
mkdir -p backups
file="backups/railguard-$(date '+%F-%H%M').dump"

docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$file" || exit 1
size=$(stat -c %s "$file")
[ "$size" -gt 1000 ] || { echo "dump too small ($size bytes)"; exit 1; }
find backups -name 'railguard-*.dump' -mtime +14 -delete
caption="RailGuard backup $(basename "$file"), $((size / 1024)) KB"

sent=""
if [ -n "${BACKUP_TG_TOKEN:-}" ] && [ -n "${BACKUP_TG_CHAT:-}" ]; then
  # Telegram из РФ может быть недоступен: BACKUP_TG_PROXY=socks5h://user:pass@host:1080 или http://host:3128
  if curl -sS -m 120 ${BACKUP_TG_PROXY:+--proxy "$BACKUP_TG_PROXY"} -F "chat_id=$BACKUP_TG_CHAT" -F "caption=$caption" -F "document=@$file" \
      "https://api.telegram.org/bot$BACKUP_TG_TOKEN/sendDocument" -o /dev/null -w '%{http_code}' | grep -q '^200$'; then
    sent=telegram
  else
    echo "telegram send failed"
  fi
fi
if [ -z "$sent" ]; then
  docker compose -f docker-compose.prod.yml exec -T -e BACKUP_NAME="$(basename "$file")" web node scripts/backup-send.mjs < "$file" && sent=email
fi
echo "[$(date '+%F %T')] backup $file ($size bytes) sent: ${sent:-NOWHERE, only local copy}"
[ -n "$sent" ]
