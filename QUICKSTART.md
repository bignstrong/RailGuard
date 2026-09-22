# RailGuard Docker Quick Start

## 🚀 Самый простой способ

### 1. На вашем Windows (для теста):

```powershell
# Создайте .env файл
Copy-Item .env.example .env

# Отредактируйте .env (измените пароли и токены)
notepad .env

# Запустите (требуется Docker Desktop)
docker compose up -d

# Проверьте
docker ps
```

Откройте: http://localhost:3000

---

## 🌐 На сервере Linux (Production):

### Вариант 1: Простой (без Nginx)

```bash
# 1. Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Клонируйте проект
git clone https://github.com/bignstrong/RailGuard.git
cd RailGuard

# 3. Настройте .env
cp .env.example .env
nano .env  # Заполните все переменные!

# 4. Запустите
docker compose up -d

# 5. Проверьте логи
docker compose logs -f

# 6. Откройте порт 3000
sudo ufw allow 3000
```

Готово! Сайт на http://your-ip:3000

---

### Вариант 2: С Nginx и SSL (рекомендуется)

```bash
# 1-3. Те же шаги что выше

# 4. Установите Nginx и Certbot на хосте
sudo apt install nginx certbot python3-certbot-nginx -y

# 5. Создайте конфиг Nginx
sudo nano /etc/nginx/sites-available/railguard
```

Вставьте:
```nginx
server {
    listen 80;
    server_name railguard.ru www.railguard.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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

# Настройте автообновление
sudo certbot renew --dry-run
```

Готово! Сайт на https://railguard.ru

---

## 🔄 Обновление

```bash
git pull
docker compose up -d --build
```

## 📊 Управление

```bash
# Логи
docker compose logs -f

# Остановить
docker compose down

# Перезапустить
docker compose restart

# Статус
docker compose ps
```

## 🔍 Проверка работы

```bash
# Проверить доступность
curl http://localhost:3000

# Проверить БД
docker compose exec postgres psql -U railguard -d railguard -c "SELECT NOW();"

# Зайти в контейнер
docker compose exec web sh
```

## 💾 Backup

```bash
# Backup БД
docker compose exec postgres pg_dump -U railguard railguard > backup.sql

# Restore БД
cat backup.sql | docker compose exec -T postgres psql -U railguard -d railguard
```

---

## ⚙️ Настройки .env (обязательно!)

```env
# Смените пароль!
POSTGRES_PASSWORD=ваш_сложный_пароль_здесь

# Ваш домен
NEXT_PUBLIC_SITE_URL=https://railguard.ru
```

---

Всё! Максимально просто 🎉
