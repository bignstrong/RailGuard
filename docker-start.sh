#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Запуск RailGuard в Docker...${NC}"

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo -e "${BLUE}📝 Создаём .env из .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Файл .env создан. Отредактируйте его перед запуском!${NC}"
    exit 1
fi

# Останавливаем предыдущие контейнеры
echo -e "${BLUE}🛑 Останавливаем предыдущие контейнеры...${NC}"
docker-compose down

# Собираем образы
echo -e "${BLUE}🔨 Собираем Docker образы...${NC}"
docker-compose build --no-cache

# Запускаем контейнеры
echo -e "${BLUE}🚀 Запускаем контейнеры...${NC}"
docker-compose up -d

# Ждём запуска базы данных
echo -e "${BLUE}⏳ Ожидаем запуск PostgreSQL...${NC}"
sleep 5

# Проверяем статус
echo -e "${BLUE}📊 Статус контейнеров:${NC}"
docker-compose ps

echo -e "${GREEN}✅ RailGuard успешно запущен!${NC}"
echo -e "${GREEN}🌐 Приложение доступно на: http://localhost:3000${NC}"
echo -e "${BLUE}📝 Логи: docker-compose logs -f${NC}"
