# 🐳 Деплой RailGuard через Docker

## 📋 Требования

- Docker 20.10+
- Docker Compose 2.0+
- Домен (railguard.ru)

## 🚀 Быстрый старт

### 1. Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Устанавливаем Docker Compose
sudo apt install docker-compose-plugin -y

# Проверяем установку
docker --version
docker compose version
```

### 2. Клонируем проект

```bash
# Создаём директорию
sudo mkdir -p /opt/railguard
cd /opt/railguard

# Клонируем репозиторий
git clone https://github.com/bignstrong/RailGuard.git .

# Даём права
sudo chown -R $USER:$USER /opt/railguard
```

### 3. Настраиваем окружение

```bash
# Копируем пример конфига
cp .env.example .env

# Редактируем .env
nano .env
```

**Обязательно заполните:**
```env
POSTGRES_PASSWORD=ваш_сильный_пароль_123
TELEGRAM_BOT_TOKEN=12345:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
NEXT_PUBLIC_SITE_URL=https://railguard.ru
```

### 4. Запуск

```bash
# Даём права на скрипт
chmod +x docker-start.sh

# Запускаем
./docker-start.sh

# Или вручную:
docker compose up -d --build
```

### 5. Проверка

```bash
# Статус контейнеров
docker compose ps

# Логи
docker compose logs -f web

# Проверяем доступность
curl http://localhost:3000
```

## 🔧 Настройка Nginx с SSL

### Вариант 1: Без Nginx (только для теста)

Приложение доступно на порту 3000. Откройте порт:
```bash
sudo ufw allow 3000
```

### Вариант 2: С Nginx и Let's Encrypt (рекомендуется)

#### 1. Первый запуск без SSL

Отредактируйте `docker-compose.yml` - закомментируйте секцию `nginx`:
```yaml
  # nginx:
  #   image: nginx:alpine
  #   ...
```

Запустите приложение:
```bash
docker compose up -d web postgres
```

#### 2. Установите Certbot на хосте

```bash
sudo apt install certbot python3-certbot-nginx -y

# Временно установите Nginx на хост
sudo apt install nginx -y

# Создайте минимальный конфиг
sudo nano /etc/nginx/sites-available/railguard
```

```nginx
server {
    listen 80;
    server_name railguard.ru www.railguard.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

```bash
# Активируйте конфиг
sudo ln -s /etc/nginx/sites-available/railguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Получите SSL сертификат
sudo certbot --nginx -d railguard.ru -d www.railguard.ru
```

#### 3. Скопируйте сертификаты в проект

```bash
# Создайте директорию для SSL
mkdir -p nginx/ssl

# Скопируйте сертификаты
sudo cp /etc/letsencrypt/live/railguard.ru/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/railguard.ru/privkey.pem nginx/ssl/

# Дайте права
sudo chown -R $USER:$USER nginx/ssl
```

#### 4. Раскомментируйте SSL в nginx.conf

Отредактируйте `nginx/nginx.conf`:
```nginx
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

#### 5. Запустите с Nginx

```bash
# Остановите хост-Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Раскомментируйте nginx в docker-compose.yml
nano docker-compose.yml

# Перезапустите
docker compose up -d
```

## 📊 Управление

### Основные команды

```bash
# Запуск
docker compose up -d

# Остановка
docker compose down

# Перезапуск
docker compose restart

# Пересборка
docker compose up -d --build

# Логи
docker compose logs -f
docker compose logs -f web    # только web
docker compose logs -f postgres # только БД

# Статус
docker compose ps

# Выполнение команд внутри контейнера
docker compose exec web sh
docker compose exec postgres psql -U railguard -d railguard
```

### Обновление приложения

```bash
# Подтянуть изменения
git pull origin master

# Пересобрать и перезапустить
docker compose up -d --build

# Применить миграции (если нужно)
docker compose exec web npx prisma migrate deploy
```

### Бэкап базы данных

```bash
# Создать бэкап
docker compose exec postgres pg_dump -U railguard railguard > backup_$(date +%Y%m%d).sql

# Восстановить из бэкапа
cat backup_20241024.sql | docker compose exec -T postgres psql -U railguard -d railguard
```

### Мониторинг

```bash
# Использование ресурсов
docker stats

# Размер образов
docker images

# Использование томов
docker volume ls
docker system df
```

### Очистка

```bash
# Удалить остановленные контейнеры
docker container prune

# Удалить неиспользуемые образы
docker image prune -a

# Удалить всё неиспользуемое
docker system prune -a --volumes
```

## 🔥 Production оптимизации

### 1. Ограничение ресурсов

В `docker-compose.yml`:
```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. Health checks

```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 3. Автоперезапуск

```yaml
services:
  web:
    restart: unless-stopped
```

### 4. Ротация логов

Создайте `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

## 🆘 Troubleshooting

### Контейнер не запускается

```bash
# Проверьте логи
docker compose logs web

# Проверьте конфиг
docker compose config

# Пересоберите без кеша
docker compose build --no-cache
```

### База данных недоступна

```bash
# Проверьте статус
docker compose exec postgres pg_isready -U railguard

# Проверьте логи
docker compose logs postgres

# Подключитесь вручную
docker compose exec postgres psql -U railguard -d railguard
```

### Проблемы с миграциями

```bash
# Примените миграции вручную
docker compose exec web npx prisma migrate deploy

# Сгенерируйте клиент заново
docker compose exec web npx prisma generate
```

### Порты заняты

```bash
# Проверьте что слушает порт
sudo lsof -i :3000
sudo lsof -i :5432

# Остановите конфликтующий сервис
sudo systemctl stop postgresql
```

## 📈 Мониторинг production

### Установка Portainer (веб-интерфейс для Docker)

```bash
docker volume create portainer_data

docker run -d -p 9000:9000 \
  --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Откройте http://your-server:9000

### Prometheus + Grafana (опционально)

Добавьте в `docker-compose.yml`:
```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

## 🔐 Безопасность

1. **Используйте сильные пароли** в `.env`
2. **Регулярно обновляйте** образы: `docker compose pull && docker compose up -d`
3. **Настройте firewall**: `sudo ufw enable`
4. **Ограничьте доступ к портам**: закройте 5432, 3000 если используете Nginx
5. **Настройте fail2ban** для защиты от брутфорса

## 📚 Полезные ссылки

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma](https://www.prisma.io/docs/)

---

**Готово!** 🎉 Ваш RailGuard работает в Docker!
