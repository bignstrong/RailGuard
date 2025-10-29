# Используем официальный Python образ
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл зависимостей
COPY requirments.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirments.txt

# Копируем весь проект
COPY . .

# Создаем файл для хранения последнего ID заказа, если его нет
RUN touch last_order_id.txt

# Запускаем бота
CMD ["python", "aiobot.py"]
