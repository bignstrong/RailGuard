#!/bin/bash

# 🚀 Автоматическая установка RailGuard на Ubuntu
# Использование: curl -fsSL https://raw.githubusercontent.com/bignstrong/RailGuard/master/setup-server.sh | bash

set -e

echo "🚀 Установка RailGuard..."

# Обновляем систему
echo "📦 Обновление системы..."
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
echo "🐳 Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
else
    echo "✅ Docker уже установлен"
fi

# Устанавливаем Docker Compose
echo "🐳 Установка Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    sudo apt install docker-compose-plugin -y
else
    echo "✅ Docker Compose уже установлен"
fi

# Клонируем проект
echo "📥 Клонирование проекта..."
cd /opt
sudo rm -rf railguard
sudo git clone https://github.com/bignstrong/RailGuard.git railguard
cd railguard
sudo chown -R $USER:$USER /opt/railguard

# Создаём .env файл
echo "⚙️  Настройка переменных окружения..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Генерируем случайный пароль
    RANDOM_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    sed -i "s/your_strong_password_here/$RANDOM_PASSWORD/g" .env
    
    echo ""
    echo "⚠️  ВАЖНО! Отредактируйте файл .env:"
    echo "   nano /opt/railguard/.env"
    echo ""
    echo "Заполните:"
    echo "  - TELEGRAM_BOT_TOKEN (получите у @BotFather)"
    echo "  - TELEGRAM_CHAT_ID (получите у @userinfobot)"
    echo "  - NEXT_PUBLIC_SITE_URL (ваш домен)"
    echo ""
    echo "Пароль БД сгенерирован автоматически: $RANDOM_PASSWORD"
    echo ""
    read -p "Нажмите Enter после редактирования .env..."
fi

# Запускаем Docker
echo "🚀 Запуск контейнеров..."
docker compose up -d --build

# Ждём запуска
echo "⏳ Ожидание запуска (30 секунд)..."
sleep 30

# Проверяем статус
echo "📊 Статус контейнеров:"
docker compose ps

echo ""
echo "✅ Установка завершена!"
echo ""
echo "🌐 Приложение доступно на порту 3000"
echo "📝 Логи: docker compose logs -f"
echo "🔄 Перезапуск: docker compose restart"
echo ""
echo "Настройте Nginx и SSL:"
echo "  sudo apt install nginx certbot python3-certbot-nginx -y"
echo "  sudo certbot --nginx -d ваш-домен.ru"
