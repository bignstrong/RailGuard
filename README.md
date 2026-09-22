# 🚄 RailGuard — Система защиты топливной системы

Веб-приложение для продажи и управления заказами системы защиты топливной системы RailGuard.

![RailGuard Banner](public/og-image.png)

---

## 📦 Структура проекта

```
├── components/     # Универсальные React-компоненты интерфейса
├── contexts/       # React-контексты для глобального состояния
├── hooks/          # Пользовательские React-хуки
├── lib/            # Вспомогательные библиотеки и интеграции (например, Prisma)
├── pages/          # Страницы Next.js (включая API-роуты)
├── prisma/         # Схема и миграции базы данных
├── public/         # Статические файлы (изображения, иконки, стили)
├── utils/          # Утилиты и вспомогательные функции
├── views/          # Крупные компоненты-виды для страниц
├── env.ts          # Работа с переменными окружения
├── types.ts        # Глобальные типы TypeScript
└── ...             # Конфигурационные и служебные файлы
```

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/BigVadya/Fuel.git
cd Fuel
```

### 2. Установка зависимостей

```bash
yarn install
# или
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example` и заполните необходимые переменные:

```bash
cp .env.example .env
```

**Обязательные переменные:**

- `DATABASE_URL` — строка подключения к PostgreSQL
- `NEXT_PUBLIC_SITE_URL` — публичный URL сайта

### 4. Миграция базы данных

```bash
npx prisma migrate dev
```

### 5. Запуск приложения

```bash
yarn dev
# или
npm run dev
```

Приложение будет доступно по адресу: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Технологии

- **Next.js** — SSR/SSG React-фреймворк
- **TypeScript** — типизация и надежность кода
- **Prisma** — ORM для работы с PostgreSQL
- **Styled Components** — стилизация компонентов
- **Docker** — контейнеризация для production

---

## 📁 Ключевые директории

- `components/` — переиспользуемые UI-компоненты (кнопки, карточки, формы и др.)
- `contexts/` — глобальные состояния (корзина, уведомления, светлая/темная тема)
- `pages/` — страницы сайта и API-роуты (например, `pages/api/orders.ts`)
- `prisma/` — схема данных и миграции
- `public/` — изображения, иконки, статические ресурсы
- `views/` — крупные секции для страниц (Hero и др.)

---

## 🧩 Особенности

- **SSR и SSG** для максимальной производительности и SEO
- **Корзина и оформление заказов** с интеграцией обработки
- **Модульная архитектура** — легко расширять и поддерживать
- **Адаптивный дизайн** для всех устройств

---

## 📝 Скрипты

- `yarn dev` — запуск в режиме разработки
- `yarn build` — сборка приложения
- `yarn start` — запуск production-сервера
- `yarn prisma` — работа с Prisma ORM

---

## 🐳 Docker Deployment

### Запуск на сервере

```bash
# Запустите в production
docker compose -f docker-compose.prod.yml up -d
```

### Проверка статуса

```bash
docker compose -f docker-compose.prod.yml ps
```

### Логи

```bash
# Все сервисы
docker compose -f docker-compose.prod.yml logs -f

# Только web
docker logs -f railguard_web

# Только база данных
docker logs -f railguard_db
```

### Обновление на сервере

```bash
./update-server.sh
```

**Что включает Docker Compose:**
- 🗄️ **PostgreSQL** — база данных
- 🌐 **Next.js** — веб-приложение
- 🔒 **Nginx** — reverse proxy с SSL

---

## 🧪 Тестирование

> _(Добавьте раздел, если появятся тесты)_

---

## 🔒 Лицензия

Проект распространяется под лицензией MIT.

---

## 🤝 Контакты и поддержка

- Вопросы и предложения: [issues](https://github.com/BigVadya/Fuel/issues)
- Автор: [BigVadya](https://github.com/BigVadya)

---

> _RailGuard — современная защита вашего топлива!_

## Админка и уведомления

- Заказы приходят письмом на `ORDER_NOTIFY_TO` через SMTP (`SMTP_*` в `.env`, Яндекс 360). Без SMTP заказ всё равно сохраняется.
- Админка живёт на секретном пути `ADMIN_PATH` (например `https://railguard.ru/k3x9-panel`). Прямой `/admin` всегда отдаёт 404.
- Вход: пароль (scrypt-хеш в `ADMIN_PASSWORD_HASH`) + код TOTP из приложения (`ADMIN_TOTP_SECRET`). Сессия 8 часов в cookie `__Host-admin_session` (HttpOnly, Secure, SameSite=Strict). 5 попыток входа за 15 минут с IP. Опционально `ADMIN_ALLOWED_IPS`.
- Сгенерировать значения: `node scripts/admin-setup.mjs [пароль]`, вставить в `.env`, перезапустить `web`.
