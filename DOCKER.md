# 🐳 Docker Quick Reference

## Файлы

- `Dockerfile` - образ приложения
- `docker-compose.yml` - версия для разработки (БД + Web + Nginx)
- `docker-compose.prod.yml` - версия для production
- `.dockerignore` - игнорируемые файлы при сборке
- `.env.example` - пример переменных окружения

## Команды

### Первый запуск

```bash
# 1. Создайте .env
cp .env.example .env
nano .env

# 2. Запустите
docker compose up -d
```

### Управление

```bash
# Статус
docker compose ps

# Логи
docker compose logs -f
docker compose logs -f web      # только приложение
docker compose logs -f postgres # только БД

# Остановить
docker compose down

# Перезапустить
docker compose restart

# Пересобрать
docker compose up -d --build
```

### Обновление

```bash
git pull
docker compose up -d --build
```

### База данных

```bash
# Подключиться к БД
docker compose exec postgres psql -U railguard -d railguard

# Применить миграции
docker compose exec web npx prisma migrate deploy

# Backup
docker compose exec postgres pg_dump -U railguard railguard > backup.sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U railguard -d railguard
```

### Отладка

```bash
# Зайти в контейнер
docker compose exec web sh

# Проверить переменные окружения
docker compose exec web env

# Проверить доступность
curl http://localhost:3000
```

### Очистка

```bash
# Удалить контейнеры и сети
docker compose down

# Удалить контейнеры, сети и volumes (УДАЛИТ БД!)
docker compose down -v

# Очистить Docker
docker system prune -a
```

## Порты

- `3000` - Next.js приложение
- `5432` - PostgreSQL
- `80` - Nginx HTTP (если используется)
- `443` - Nginx HTTPS (если используется)

## Volumes

- `postgres_data` - данные PostgreSQL

## Переменные .env

```env
POSTGRES_USER=railguard
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=railguard
DATABASE_URL=postgresql://railguard:your_password@postgres:5432/railguard

NEXT_PUBLIC_SITE_URL=https://railguard.ru
NODE_ENV=production
```

## Troubleshooting

### Порт занят
```bash
# Проверить что использует порт
sudo lsof -i :3000
sudo lsof -i :5432

# Изменить порт в docker-compose.yml
ports:
  - "3001:3000"  # вместо 3000:3000
```

### Контейнер не запускается
```bash
# Смотрим логи
docker compose logs web

# Пересобираем без кеша
docker compose build --no-cache web
docker compose up -d
```

### База данных не доступна
```bash
# Проверяем статус
docker compose ps

# Проверяем логи
docker compose logs postgres

# Проверяем подключение
docker compose exec postgres pg_isready -U railguard
```

### Не применяются миграции
```bash
# Применяем вручную
docker compose exec web npx prisma migrate deploy

# Генерируем клиент
docker compose exec web npx prisma generate
```

## Production Checklist

- [ ] Изменён пароль PostgreSQL в `.env`
- [ ] Указан правильный домен в NEXT_PUBLIC_SITE_URL
- [ ] Настроен SSL через Certbot
- [ ] Настроен firewall (ufw)
- [ ] Настроен backup базы данных
- [ ] Настроен мониторинг логов

## Ссылки

- [QUICKSTART.md](./QUICKSTART.md) - быстрый старт
- [DEPLOY.md](./DEPLOY.md) - полная инструкция
