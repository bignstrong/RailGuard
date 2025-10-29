# 🤖 RailGuard Admin Bot

Telegram-бот для управления заказами магазина RailGuard.

> **Примечание**: Бот автоматически запускается вместе с основным проектом через `docker-compose.prod.yml` в корне проекта.

## 🚀 Быстрый запуск с Docker


### 1. Клонируйте репозиторий (или скачайте файлы)

### 2. Создайте `.env` файл
```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите свои данные:
```env
BOT_TOKEN=ваш_токен_бота
ADMIN_ID=ваш_telegram_id
DB_URL=ваша_строка_подключения_к_postgres
```

### 3. Запустите бота
```bash
docker-compose up -d
```

### 4. Проверьте логи
```bash
docker-compose logs -f bot
```

### 5. Остановите бота
```bash
docker-compose down
```

## 📋 Команды управления

### Запуск
```bash
docker-compose up -d              # Запустить в фоне
docker-compose up                 # Запустить с выводом логов
```

### Перезапуск
```bash
docker-compose restart            # Перезапустить
docker-compose down && docker-compose up -d  # Полный перезапуск
```

### Логи
```bash
docker-compose logs -f bot        # Смотреть логи в реальном времени
docker-compose logs --tail=100 bot # Последние 100 строк
```

### Обновление
```bash
# После изменения кода
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Очистка
```bash
docker-compose down -v            # Остановить и удалить volumes
docker system prune -a            # Очистить все неиспользуемые образы
```

## 🔧 Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `BOT_TOKEN` | Токен Telegram бота | - |
| `ADMIN_ID` | Telegram ID администратора | - |
| `DB_URL` | Строка подключения к PostgreSQL | - |

## 📁 Структура проекта

```
.
├── aiobot.py              # Основной код бота
├── requirments.txt        # Python зависимости
├── Dockerfile             # Конфигурация Docker образа
├── docker-compose.yml     # Конфигурация Docker Compose
├── .env                   # Переменные окружения (не коммитить!)
├── .env.example           # Пример переменных окружения
├── .dockerignore          # Игнорируемые файлы при сборке
├── last_order_id.txt      # Последний обработанный ID заказа
└── README.md              # Этот файл
```

## 🐛 Troubleshooting

### Бот не запускается
```bash
docker-compose logs bot    # Проверьте логи
docker-compose down
docker-compose up          # Запустите без -d для просмотра ошибок
```

### Ошибка подключения к БД
- Проверьте правильность `DB_URL` в `.env`
- Убедитесь, что база данных доступна

### Бот не отвечает
- Проверьте `BOT_TOKEN` в `.env`
- Убедитесь, что `ADMIN_ID` корректный

## 📝 Примечания

- Файл `last_order_id.txt` монтируется как volume для сохранения состояния между перезапусками
- Логи ротируются автоматически (максимум 10MB на файл, 3 файла)
- Бот автоматически перезапускается при падении (`restart: unless-stopped`)

## 🔐 Безопасность

⚠️ **ВАЖНО**: Не коммитьте файл `.env` в Git! Он содержит конфиденциальные данные.

Добавьте в `.gitignore`:
```
.env
last_order_id.txt
```
