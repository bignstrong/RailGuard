#!/bin/bash

# ============================================
# 🚀 RailGuard Auto-Deploy Script для Ubuntu
# ============================================

set -e  # Останавливаться при ошибках

# Улучшенная обработка ошибок
trap 'echo -e "${RED}❌ Ошибка на строке $LINENO${NC}"; exit 1' ERR

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Логирование установки
INSTALL_LOG="$HOME/railguard-install-$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$INSTALL_LOG")
exec 2>&1

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚄 RailGuard Auto-Deploy             ║${NC}"
echo -e "${BLUE}║  Автоматическая настройка сервера     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📝 Лог установки: $INSTALL_LOG${NC}"
echo ""

# Проверка root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Не запускайте скрипт от root! Используйте sudo внутри.${NC}"
    exit 1
fi

# ============================================
# 1. Обновление системы
# ============================================
echo -e "${BLUE}📦 Обновление системы...${NC}"
sudo apt update
sudo apt upgrade -y

# ============================================
# 2. Установка openssl (если нет)
# ============================================
echo -e "${BLUE}🔐 Проверка openssl...${NC}"
if ! command -v openssl &> /dev/null; then
    sudo apt install -y openssl
    echo -e "${GREEN}✅ OpenSSL установлен${NC}"
fi

# ============================================
# 3. Установка Docker
# ============================================
echo -e "${BLUE}🐳 Установка Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Docker уже установлен${NC}"
fi

# ============================================
# 4. Установка Docker Compose
# ============================================
echo -e "${BLUE}📦 Установка Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
    sudo apt install docker-compose-plugin -y
    echo -e "${GREEN}✅ Docker Compose установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose уже установлен${NC}"
fi

# ============================================
# 5. Установка дополнительных утилит
# ============================================
echo -e "${BLUE}🛠️  Установка утилит (git, nginx, certbot)...${NC}"
sudo apt install -y git nginx certbot python3-certbot-nginx ufw htop wget curl dnsutils

# ============================================
# 6. Настройка Firewall
# ============================================
echo -e "${BLUE}🔥 Настройка Firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
echo -e "${GREEN}✅ Firewall настроен${NC}"

# ============================================
# 7. Клонирование проекта
# ============================================
echo ""
echo -e "${BLUE}📥 Клонирование RailGuard...${NC}"
read -p "Введите путь для установки [/opt/railguard]: " INSTALL_PATH
INSTALL_PATH=${INSTALL_PATH:-/opt/railguard}

if [ -d "$INSTALL_PATH" ]; then
    echo -e "${YELLOW}⚠️  Директория $INSTALL_PATH уже существует${NC}"
    read -p "Удалить и клонировать заново? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo rm -rf $INSTALL_PATH
    else
        echo -e "${RED}❌ Отменено${NC}"
        exit 1
    fi
fi

sudo mkdir -p $INSTALL_PATH
sudo chown -R $USER:$USER $INSTALL_PATH
git clone https://github.com/bignstrong/RailGuard.git $INSTALL_PATH
cd $INSTALL_PATH

# ============================================
# 8. Настройка .env с валидацией
# ============================================
echo ""
echo -e "${BLUE}⚙️  Настройка переменных окружения${NC}"

# Резервная копия старого .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Старый .env сохранён в резервную копию${NC}"
fi

cp .env.example .env

# Генерация случайного пароля
POSTGRES_PASSWORD=$(openssl rand -base64 32)

echo -e "${YELLOW}📝 Заполните данные для .env:${NC}"
echo ""

# Валидация домена
while true; do
    read -p "Введите домен (например, railguard.ru): " DOMAIN
    if [[ $DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$ ]]; then
        break
    else
        echo -e "${RED}❌ Некорректный формат домена. Попробуйте ещё раз.${NC}"
    fi
done

# Валидация Telegram Bot Token
while true; do
    read -p "Введите Telegram Bot Token: " TELEGRAM_TOKEN
    if [[ $TELEGRAM_TOKEN =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
        break
    else
        echo -e "${RED}❌ Некорректный формат токена (должен быть вида: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz).${NC}"
    fi
done

# Валидация Telegram Chat ID
while true; do
    read -p "Введите Telegram Chat ID: " TELEGRAM_CHAT_ID
    if [[ $TELEGRAM_CHAT_ID =~ ^-?[0-9]+$ ]]; then
        break
    else
        echo -e "${RED}❌ Chat ID должен быть числом.${NC}"
    fi
done

# Заполняем .env
cat > .env << EOF
# Database
POSTGRES_USER=railguard
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=railguard
DATABASE_URL=postgresql://railguard:$POSTGRES_PASSWORD@postgres:5432/railguard?schema=public

# Telegram Bot
TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
NODE_ENV=production
EOF

echo -e "${GREEN}✅ Файл .env создан${NC}"

# ============================================
# 9. Проверка портов
# ============================================
echo ""
echo -e "${BLUE}🔍 Проверка доступности портов...${NC}"
if ss -tulpn 2>/dev/null | grep -q ":3000 "; then
    echo -e "${RED}❌ Порт 3000 уже занят!${NC}"
    echo -e "${YELLOW}Процессы на порту 3000:${NC}"
    ss -tulpn | grep ":3000 "
    read -p "Продолжить установку? Это может вызвать конфликты (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Порт 3000 свободен${NC}"
fi

# ============================================
# 10. Применение прав Docker группы
# ============================================
echo ""
echo -e "${BLUE}🐳 Применение прав Docker группы...${NC}"
echo -e "${YELLOW}⚠️  Запуск команд в новой Docker группе...${NC}"

# Создаём временный скрипт для выполнения в новой группе
cat > /tmp/railguard_docker_setup.sh << 'DOCKER_SCRIPT'
#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

INSTALL_PATH="$1"
cd "$INSTALL_PATH"

# ============================================
# Запуск Docker контейнеров
# ============================================
echo ""
echo -e "${BLUE}🚀 Запуск Docker контейнеров...${NC}"
docker compose -f docker-compose.simple.yml up -d --build

# ============================================
# Health check с таймаутом
# ============================================
echo ""
echo -e "${YELLOW}⏳ Ожидание запуска приложения...${NC}"
echo -e "${YELLOW}   (может занять до 60 секунд)${NC}"
sleep 10

for i in {1..30}; do
    if docker compose ps | grep -q "Up" && curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Приложение готово!${NC}"
        APP_READY=true
        break
    fi
    echo -n "."
    sleep 2
done

if [ -z "$APP_READY" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Приложение запускается дольше обычного...${NC}"
    echo -e "${YELLOW}   Проверьте логи: docker compose logs${NC}"
fi

# ============================================
# Запуск миграций БД
# ============================================
echo ""
if docker compose ps web | grep -q "Up"; then
    echo -e "${BLUE}📊 Запуск миграций базы данных...${NC}"
    if docker compose exec -T web npx prisma migrate deploy 2>/dev/null; then
        echo -e "${GREEN}✅ Миграции выполнены${NC}"
    else
        echo -e "${YELLOW}⚠️  Миграции не удалось выполнить или они не требуются${NC}"
    fi
else
    echo -e "${RED}❌ Контейнер web не запущен, пропускаем миграции${NC}"
fi

# Проверка статуса
echo ""
echo -e "${BLUE}📊 Статус контейнеров:${NC}"
docker compose ps

DOCKER_SCRIPT

chmod +x /tmp/railguard_docker_setup.sh

# Выполняем скрипт в контексте Docker группы
if ! sg docker "/tmp/railguard_docker_setup.sh $INSTALL_PATH"; then
    echo -e "${RED}❌ Ошибка при запуске Docker контейнеров${NC}"
    echo -e "${YELLOW}Попробуйте выполнить вручную:${NC}"
    echo -e "  newgrp docker"
    echo -e "  cd $INSTALL_PATH"
    echo -e "  docker compose -f docker-compose.simple.yml up -d --build"
    exit 1
fi

rm /tmp/railguard_docker_setup.sh

# ============================================
# 11. Настройка Nginx
# ============================================
echo ""
echo -e "${BLUE}🌐 Настройка Nginx...${NC}"

# Останавливаем Docker Nginx если запущен
sg docker "cd $INSTALL_PATH && docker compose down nginx" 2>/dev/null || true

# Создаём конфиг для Nginx на хосте
sudo tee /etc/nginx/sites-available/railguard > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Логи
    access_log /var/log/nginx/railguard-access.log;
    error_log /var/log/nginx/railguard-error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

    # Проксируем на Docker контейнер
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Активируем конфиг
sudo ln -sf /etc/nginx/sites-available/railguard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфиг
if sudo nginx -t; then
    echo -e "${GREEN}✅ Конфигурация Nginx корректна${NC}"
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx${NC}"
    exit 1
fi

# Перезапускаем Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${GREEN}✅ Nginx настроен${NC}"

# ============================================
# 12. Установка SSL сертификата
# ============================================
echo ""
echo -e "${BLUE}🔒 Установка SSL сертификата...${NC}"

# Проверка DNS перед получением SSL
echo -e "${BLUE}🔍 Проверка DNS конфигурации...${NC}"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "unknown")
DOMAIN_IP=$(dig +short $DOMAIN 2>/dev/null | tail -n1)

if [ -n "$DOMAIN_IP" ] && [ "$SERVER_IP" != "unknown" ]; then
    if [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
        echo -e "${GREEN}✅ DNS настроен правильно ($DOMAIN → $SERVER_IP)${NC}"
    else
        echo -e "${YELLOW}⚠️  DNS возможно настроен неправильно:${NC}"
        echo -e "    Домен $DOMAIN → $DOMAIN_IP"
        echo -e "    Сервер IP: $SERVER_IP"
        echo -e "${YELLOW}    SSL может не установиться без правильного DNS${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Не удалось проверить DNS${NC}"
fi

read -p "Получить SSL сертификат от Let's Encrypt? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    while true; do
        read -p "Введите email для уведомлений: " EMAIL
        if [[ $EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        else
            echo -e "${RED}❌ Некорректный email. Попробуйте ещё раз.${NC}"
        fi
    done
    
    if sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL; then
        # Настройка автообновления
        sudo systemctl enable certbot.timer
        echo -e "${GREEN}✅ SSL сертификат установлен${NC}"
        
        # Показываем срок действия
        CERT_EXPIRY=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>/dev/null | cut -d= -f2)
        if [ -n "$CERT_EXPIRY" ]; then
            echo -e "${GREEN}📅 Сертификат действителен до: $CERT_EXPIRY${NC}"
        fi
    else
        echo -e "${RED}❌ Ошибка установки SSL сертификата${NC}"
        echo -e "${YELLOW}Проверьте:${NC}"
        echo -e "  1. Домен $DOMAIN указывает на этот сервер ($SERVER_IP)"
        echo -e "  2. Порты 80 и 443 открыты"
        echo -e "  3. Nginx запущен и доступен"
    fi
else
    echo -e "${YELLOW}⚠️  SSL сертификат не установлен${NC}"
fi

# ============================================
# 13. Создание скриптов управления
# ============================================
echo ""
echo -e "${BLUE}📝 Создание скриптов управления...${NC}"

# Скрипт обновления
cat > $INSTALL_PATH/update.sh << EOF
#!/bin/bash
cd $INSTALL_PATH
echo "🔄 Обновление RailGuard..."
git stash  # сохраняем локальные изменения
git pull origin master
git stash pop 2>/dev/null || true  # восстанавливаем локальные изменения
docker compose -f docker-compose.simple.yml up -d --build
docker compose exec -T web npx prisma migrate deploy 2>/dev/null || true
echo "✅ Обновление завершено!"
EOF
chmod +x $INSTALL_PATH/update.sh

# Скрипт бэкапа
cat > $INSTALL_PATH/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="$INSTALL_PATH/backups"
mkdir -p \$BACKUP_DIR
BACKUP_FILE="\$BACKUP_DIR/backup_\$(date +%Y%m%d_%H%M%S).sql"
cd $INSTALL_PATH
docker compose exec -T postgres pg_dump -U railguard railguard > \$BACKUP_FILE
if [ -f "\$BACKUP_FILE" ]; then
    echo "✅ Backup создан: \$BACKUP_FILE"
    echo "📊 Размер: \$(du -h \$BACKUP_FILE | cut -f1)"
    # Удаляем старые бэкапы (старше 7 дней)
    find \$BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
    echo "🗑️  Старые бэкапы (>7 дней) удалены"
else
    echo "❌ Ошибка создания бэкапа"
    exit 1
fi
EOF
chmod +x $INSTALL_PATH/backup.sh

# Скрипт просмотра логов
cat > $INSTALL_PATH/logs.sh << EOF
#!/bin/bash
cd $INSTALL_PATH
docker compose logs -f --tail=100
EOF
chmod +x $INSTALL_PATH/logs.sh

# Скрипт восстановления из бэкапа
cat > $INSTALL_PATH/restore.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/backups"

if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/*.sql 2>/dev/null)" ]; then
    echo "❌ Нет доступных бэкапов"
    exit 1
fi

echo "📦 Доступные бэкапы:"
select BACKUP_FILE in $BACKUP_DIR/*.sql; do
    if [ -n "$BACKUP_FILE" ]; then
        echo "🔄 Восстановление из: $BACKUP_FILE"
        read -p "⚠️  Это удалит текущие данные! Продолжить? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$( dirname "${BASH_SOURCE[0]}" )"
            docker compose exec -T postgres psql -U railguard -d railguard < "$BACKUP_FILE"
            echo "✅ Восстановление завершено"
        else
            echo "❌ Отменено"
        fi
        break
    fi
done
EOF
chmod +x $INSTALL_PATH/restore.sh

# Добавляем cron для автобэкапа
(crontab -l 2>/dev/null | grep -v "$INSTALL_PATH/backup.sh"; echo "0 3 * * * $INSTALL_PATH/backup.sh") | crontab -

echo -e "${GREEN}✅ Скрипты созданы${NC}"
echo -e "${GREEN}✅ Автоматический бэкап настроен (каждый день в 3:00)${NC}"

# ============================================
# 14. Финальная проверка компонентов
# ============================================
echo ""
echo -e "${BLUE}🔍 Финальная проверка компонентов...${NC}"
echo ""

checks_passed=0
checks_total=5

# 1. Docker контейнеры
if sg docker "cd $INSTALL_PATH && docker compose ps" | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker контейнеры запущены${NC}"
    ((checks_passed++))
else
    echo -e "${RED}❌ Docker контейнеры не запущены${NC}"
fi

# 2. База данных
if sg docker "cd $INSTALL_PATH && docker compose exec -T postgres pg_isready -U railguard" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ База данных PostgreSQL работает${NC}"
    ((checks_passed++))
else
    echo -e "${RED}❌ База данных не отвечает${NC}"
fi

# 3. Приложение
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" =~ ^(200|301|302)$ ]]; then
    echo -e "${GREEN}✅ Приложение отвечает (HTTP $HTTP_CODE)${NC}"
    ((checks_passed++))
else
    echo -e "${RED}❌ Приложение не отвечает (HTTP $HTTP_CODE)${NC}"
fi

# 4. Nginx
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx работает${NC}"
    ((checks_passed++))
else
    echo -e "${RED}❌ Nginx не работает${NC}"
fi

# 5. SSL сертификат
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    CERT_EXPIRY=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        echo -e "${GREEN}✅ SSL сертификат установлен (до: $CERT_EXPIRY)${NC}"
    else
        echo -e "${GREEN}✅ SSL сертификат установлен${NC}"
    fi
    ((checks_passed++))
else
    echo -e "${YELLOW}⚠️  SSL сертификат не установлен${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Пройдено проверок: ${GREEN}$checks_passed${BLUE}/${checks_total}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ============================================
# 15. Итоговая информация
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 Установка завершена!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Информация о системе:${NC}"
echo -e "  🌐 Сайт:        ${GREEN}https://$DOMAIN${NC}"
echo -e "  📁 Путь:        ${GREEN}$INSTALL_PATH${NC}"
echo -e "  🔑 Пароль БД:   ${GREEN}$POSTGRES_PASSWORD${NC}"
echo -e "  📝 Лог:         ${GREEN}$INSTALL_LOG${NC}"
echo ""
echo -e "${BLUE}📝 Полезные команды:${NC}"
echo -e "  Логи:           ${GREEN}cd $INSTALL_PATH && ./logs.sh${NC}"
echo -e "  Обновление:     ${GREEN}cd $INSTALL_PATH && ./update.sh${NC}"
echo -e "  Бэкап:          ${GREEN}cd $INSTALL_PATH && ./backup.sh${NC}"
echo -e "  Восстановление: ${GREEN}cd $INSTALL_PATH && ./restore.sh${NC}"
echo -e "  Статус:         ${GREEN}cd $INSTALL_PATH && docker compose ps${NC}"
echo -e "  Перезапуск:     ${GREEN}cd $INSTALL_PATH && docker compose restart${NC}"
echo ""
echo -e "${YELLOW}⚠️  ВАЖНО: Сохраните эту информацию в безопасном месте!${NC}"
echo -e "${YELLOW}📋 Пароль БД сохранён в: ${GREEN}$INSTALL_PATH/.env${NC}"
echo ""

if [ $checks_passed -lt $checks_total ]; then
    echo -e "${YELLOW}⚠️  Некоторые проверки не прошли. Рекомендации:${NC}"
    echo -e "  1. Проверьте логи: ${GREEN}cd $INSTALL_PATH && ./logs.sh${NC}"
    echo -e "  2. Проверьте статус: ${GREEN}cd $INSTALL_PATH && docker compose ps${NC}"
    echo -e "  3. Перезапустите: ${GREEN}cd $INSTALL_PATH && docker compose restart${NC}"
    echo ""
fi

echo -e "${GREEN}✨ RailGuard готов к работе!${NC}"
echo ""
echo -e "${BLUE}🔄 Если нужно обновить приложение в будущем:${NC}"
echo -e "  ${GREEN}cd $INSTALL_PATH && ./update.sh${NC}"
echo ""
echo -e "${BLUE}💾 Бэкапы создаются автоматически каждый день в 3:00${NC}"
echo -e "${BLUE}📦 Или создайте вручную: ${GREEN}cd $INSTALL_PATH && ./backup.sh${NC}"