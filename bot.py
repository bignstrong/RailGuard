import os
import psycopg2
from psycopg2.extras import RealDictCursor
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Подключение к базе данных
DB_URL = os.getenv('DATABASE_URL', 'postgresql://main:main@localhost:5432/main')

def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# Функция для получения заказов
async def get_orders():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT "id", "status", "totalPrice", "createdAt" FROM "Order" ORDER BY "createdAt" DESC LIMIT 10;')
            orders = cur.fetchall()
        return orders
    finally:
        conn.close()

# Функция для обработки команды /start
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('Привет! Я ваш бот. Используйте /orders для просмотра заказов.')

# Команда /orders
async def orders_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    orders = await get_orders()
    if not orders:
        await update.message.reply_text('Нет заказов в базе.')
    else:
        text = '\n\n'.join([
            f"ID: {o['id']}\nСтатус: {o['status']}\nСумма: {o['totalPrice']}\nСоздан: {o['createdAt']}" for o in orders
        ])
        await update.message.reply_text(f"Последние заказы:\n{text}")

# Пример манипуляции: смена статуса заказа
async def set_status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) != 2:
        await update.message.reply_text('Использование: /setstatus <order_id> <status>')
        return
    order_id, status = args
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('UPDATE "Order" SET "status"=%s WHERE "id"=%s RETURNING "id";', (status, order_id))
            result = cur.fetchone()
            conn.commit()
        if result:
            await update.message.reply_text(f'Статус заказа {order_id} обновлён на {status}.')
        else:
            await update.message.reply_text('Заказ не найден.')
    finally:
        conn.close()

# Функция для обработки текстовых сообщений
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message_type = update.message.chat.type
    text = update.message.text

    print(f'User ({update.message.chat.id}) in {message_type}: "{text}"')

    if message_type == 'group':
        if '@your_bot_username' in text:
            new_text = text.replace('@your_bot_username', '').strip()
            response = f'Сообщение в группе: {new_text}'
        else:
            return
    else:
        response = f'Ваше сообщение: {text}'

    print('Bot:', response)
    await update.message.reply_text(response)

# Функция для обработки ошибок
async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print(f'Update {update} caused error {context.error}')

if __name__ == '__main__':
    TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    if not TOKEN:
        print('Ошибка: не задан TELEGRAM_BOT_TOKEN')
        exit(1)

    print('Starting bot...')
    app = Application.builder().token(TOKEN).build()

    # Добавляем обработчики команд
    app.add_handler(CommandHandler('start', start_command))
    app.add_handler(CommandHandler('orders', orders_command))
    app.add_handler(CommandHandler('setstatus', set_status_command))
    
    # Добавляем обработчик текстовых сообщений
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Добавляем обработчик ошибок
    app.add_error_handler(error)

    # Запускаем бота
    print('Polling...')
    app.run_polling(poll_interval=3) 