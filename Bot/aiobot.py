import os
import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, InputFile, BufferedInputFile
from aiogram.filters import Command, CommandObject
from aiogram.utils.markdown import hbold, hcode, hitalic
from aiogram.enums import ParseMode
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from aiogram.client.default import DefaultBotProperties
import csv
import io
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.filters.callback_data import CallbackData
import matplotlib.pyplot as plt
import numpy as np
from colorama import Fore, Back, Style, init

# Инициализация colorama для Windows
init(autoreset=True)

# --- Загрузка переменных окружения ---
load_dotenv()
BOT_TOKEN = os.getenv('BOT_TOKEN')
ADMIN_ID = int(os.getenv('ADMIN_ID', 0))
DB_URL = os.getenv('DB_URL')

# --- FSM (на будущее, для поиска и т.д.) ---
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# --- Подключение к базе данных ---
def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# --- CallbackData для фильтрации и массовых действий ---
class OrderFilterCallback(CallbackData, prefix="of"):  # фильтр по статусу
    status: str

class MassActionCallback(CallbackData, prefix="ma"):  # массовые действия
    action: str
    ids: str  # id через запятую

# --- Клавиатуры ---
def get_main_menu():
    keyboard = [
        [InlineKeyboardButton(text="📦 Последние заказы", callback_data='orders')],
        [InlineKeyboardButton(text="🔍 Поиск заказа", callback_data='find_menu')],
        [InlineKeyboardButton(text="📊 Статистика", callback_data='stats')],
        [InlineKeyboardButton(text="📈 График продаж", callback_data='sales_graph')],
        [InlineKeyboardButton(text="🗂 Фильтр по статусу", callback_data='filter_menu')],
        [InlineKeyboardButton(text="🧩 Массовые действия", callback_data='mass_select')],
        [InlineKeyboardButton(text="📤 Экспорт заказов", callback_data='export')],
        [InlineKeyboardButton(text="❓ Помощь", callback_data='help')],
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

def get_back_menu():
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🏠 Главное меню", callback_data='main_menu')]])

def get_status_buttons(order_id):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='🟡 В обработке', callback_data=f'setstatus:{order_id}:pending'),
         InlineKeyboardButton(text='🟢 Оплачен', callback_data=f'setstatus:{order_id}:paid')],
        [InlineKeyboardButton(text='🔴 Отменён', callback_data=f'setstatus:{order_id}:cancelled'),
         InlineKeyboardButton(text='✅ Выполнен', callback_data=f'setstatus:{order_id}:done')],
        [InlineKeyboardButton(text='❌ Удалить заказ', callback_data=f'deleteorder_confirm:{order_id}')],
        [InlineKeyboardButton(text='🏠 Главное меню', callback_data='main_menu')],
    ])

def get_delete_confirm_buttons(order_id):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='❌ Подтвердить удаление', callback_data=f'deleteorder:{order_id}')],
        [InlineKeyboardButton(text='↩️ Отмена', callback_data=f'order:{order_id}')],
        [InlineKeyboardButton(text='🏠 Главное меню', callback_data='main_menu')],
    ])

def get_find_menu():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='🔎 Поиск по email/телефону', callback_data='find_contact')],
        [InlineKeyboardButton(text='🔎 Поиск по ID', callback_data='find_id')],
        [InlineKeyboardButton(text='🏠 Главное меню', callback_data='main_menu')],
    ])

def get_filter_menu():
    builder = InlineKeyboardBuilder()
    builder.button(text="Все", callback_data=OrderFilterCallback(status="all"))
    builder.button(text="В обработке", callback_data=OrderFilterCallback(status="pending"))
    builder.button(text="Оплачен", callback_data=OrderFilterCallback(status="paid"))
    builder.button(text="Выполнен", callback_data=OrderFilterCallback(status="done"))
    builder.button(text="Отменён", callback_data=OrderFilterCallback(status="cancelled"))
    builder.button(text="🏠 Главное меню", callback_data="main_menu")
    builder.adjust(2, 2, 1)
    return builder.as_markup()

def get_mass_action_menu(selected_ids):
    builder = InlineKeyboardBuilder()
    builder.button(text="❌ Удалить", callback_data=MassActionCallback(action="delete", ids=selected_ids))
    builder.button(text="🟡 В обработке", callback_data=MassActionCallback(action="setstatus_pending", ids=selected_ids))
    builder.button(text="🟢 Оплачен", callback_data=MassActionCallback(action="setstatus_paid", ids=selected_ids))
    builder.button(text="✅ Выполнен", callback_data=MassActionCallback(action="setstatus_done", ids=selected_ids))
    builder.button(text="🏠 Главное меню", callback_data="main_menu")
    builder.adjust(2, 2, 1)
    return builder.as_markup()

# --- Форматирование ---
def format_status(status):
    status_map = {
        'pending': '🟡 <b>В обработке</b>',
        'paid': '🟢 <b>Оплачен</b>',
        'cancelled': '🔴 <b>Отменён</b>',
        'done': '✅ <b>Выполнен</b>',
    }
    return status_map.get(status, f'❔ <b>{status}</b>')

def format_datetime(dt):
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except Exception:
            return str(dt)
    return dt.strftime('%d %B %Y, %H:%M')

def format_order(order, new=False):
    contact = order.get('contact')
    items = order.get('items')
    contact_str = ''
    phone = ''
    email = ''
    preferred = ''
    if contact:
        if isinstance(contact, dict):
            phone = contact.get('phone', '')
            email = contact.get('email', '')
            preferred = contact.get('preferredContact', '')
            contact_str = f"\n<b>Клиент:</b>"
            if phone:
                contact_str += f"\n📞 <a href='tel:{phone}'>{phone}</a>"
            if email:
                contact_str += f"\n✉️ <a href='mailto:{email}'>{email}</a>"
            if preferred == 'whatsapp' and phone:
                contact_str += f"\n💬 <a href='https://wa.me/{''.join(filter(str.isdigit, phone))}'>WhatsApp</a>"
        else:
            contact_str = f"\n<b>Контакт:</b> {contact}"
    items_str = ''
    if items:
        if isinstance(items, list):
            items_str = '\n'.join([
                f"• {i.get('title', '')} (<b>{i.get('quantity', '')} шт.</b>) — <b>{i.get('price', '')}₽</b>" for i in items
            ])
        else:
            items_str = str(items)
    lines = []
    if new:
        lines.append("🛍 <b>Новый заказ!</b>")
    lines.append(f"<b>ID:</b> <code>{order['id']}</code>")
    lines.append(f"<b>Статус:</b> {format_status(order['status'])}")
    lines.append(f"<b>Сумма:</b> <b>{order['totalPrice']}₽</b>")
    lines.append(f"<b>Создан:</b> <i>{format_datetime(order['createdAt'])}</i>{contact_str}")
    lines.append("<b>Товары:</b>")
    lines.append(items_str)
    msg = '\n'.join(lines)
    return msg

# --- Проверка админа ---
def is_admin(user_id):
    return int(user_id) == ADMIN_ID

# --- Логирование в консоль ---
def log_info(message):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{Fore.CYAN}[{timestamp}]{Style.RESET_ALL} {Fore.GREEN}ℹ{Style.RESET_ALL}  {message}")

def log_success(message):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{Fore.CYAN}[{timestamp}]{Style.RESET_ALL} {Fore.GREEN}✓{Style.RESET_ALL}  {message}")

def log_warning(message):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{Fore.CYAN}[{timestamp}]{Style.RESET_ALL} {Fore.YELLOW}⚠{Style.RESET_ALL}  {message}")

def log_error(message):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{Fore.CYAN}[{timestamp}]{Style.RESET_ALL} {Fore.RED}✗{Style.RESET_ALL}  {message}")

def log_order(message):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{Fore.CYAN}[{timestamp}]{Style.RESET_ALL} {Fore.MAGENTA}🛍{Style.RESET_ALL}  {message}")

# --- Хранение последнего заказа ---
LAST_ORDER_ID_FILE = 'last_order_id.txt'
def get_last_order_id():
    try:
        with open(LAST_ORDER_ID_FILE, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

def set_last_order_id(order_id):
    with open(LAST_ORDER_ID_FILE, 'w') as f:
        f.write(str(order_id))

# --- Команды ---
@dp.message(Command('start'))
async def cmd_start(message: types.Message):
    if not is_admin(message.from_user.id):
        log_warning(f"Неавторизованный доступ: {message.from_user.username or message.from_user.id}")
        await message.answer('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    log_info(f"Админ {message.from_user.username or message.from_user.id} запустил бота")
    await message.answer(
        "👋 <b>Привет, админ!</b>\n\n<b>Выберите команду:</b>\n\n"
        "<b>📦 Последние заказы</b> — просмотр последних заказов\n"
        "<b>🔍 Поиск заказа</b> — найти заказ по email, телефону или ID\n"
        "<b>📊 Статистика</b> — статистика по заказам и топ товарам\n"
        "<b>📤 Экспорт заказов</b> — выгрузить все заказы в CSV\n"
        "<b>❓ Помощь</b> — список всех команд",
        parse_mode=ParseMode.HTML,
        reply_markup=get_main_menu()
    )

# --- Callback-меню ---
@dp.callback_query(F.data == 'main_menu')
async def cb_main_menu(call: types.CallbackQuery):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    await call.message.edit_text(
        "👋 <b>Привет, админ!</b>\n\n<b>Выберите команду:</b>\n\n"
        "<b>📦 Последние заказы</b> — просмотр последних заказов\n"
        "<b>🔍 Поиск заказа</b> — найти заказ по email, телефону или ID\n"
        "<b>📊 Статистика</b> — статистика по заказам и топ товарам\n"
        "<b>📤 Экспорт заказов</b> — выгрузить все заказы в CSV\n"
        "<b>❓ Помощь</b> — список всех команд",
        parse_mode=ParseMode.HTML,
        reply_markup=get_main_menu()
    )

@dp.callback_query(F.data == 'orders')
async def cb_orders(call: types.CallbackQuery):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    log_info("Запрос списка последних заказов")
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT "id", "status", "totalPrice", "createdAt", "contact" FROM "Order" ORDER BY "createdAt" DESC LIMIT 10;')
            orders = cur.fetchall()
        if not orders:
            await call.message.edit_text('❌ <b>Нет заказов в базе.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
        else:
            log_success(f"Найдено заказов: {len(orders)}")
            text = '\n\n'.join([
                f"<b>ID:</b> <code>{o['id']}</code>\n<b>Статус:</b> {format_status(o['status'])}\n<b>Сумма:</b> <b>{o['totalPrice']}₽</b>\n<b>Создан:</b> <i>{format_datetime(o['createdAt'])}</i>\n<b>Телефон:</b> <code>{o['contact'].get('phone', '') if isinstance(o['contact'], dict) else ''}</code>\n<b>Email:</b> <code>{o['contact'].get('email', '') if isinstance(o['contact'], dict) else ''}</code>" for o in orders
            ])
            # Формируем кнопки "Подробнее" для каждого заказа
            builder = InlineKeyboardBuilder()
            for o in orders:
                builder.button(text=f"Подробнее: {o['id'][:6]}", callback_data=f"order:{o['id']}")
            builder.button(text="🏠 Главное меню", callback_data="main_menu")
            builder.adjust(2, 1)
            await call.message.edit_text(f"<b>Последние заказы:</b>\n\n{text}", parse_mode=ParseMode.HTML, reply_markup=builder.as_markup())
    finally:
        conn.close()

@dp.callback_query(F.data.startswith('order:'))
async def cb_order_detail(call: types.CallbackQuery):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    order_id = call.data.split(':')[1]
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM "Order" WHERE "id"=%s;', (order_id,))
            order = cur.fetchone()
        if not order:
            await call.message.edit_text('❌ <b>Заказ не найден.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
        else:
            msg = format_order(order)
            await call.message.edit_text(msg, parse_mode=ParseMode.HTML, reply_markup=get_status_buttons(order_id))
    finally:
        conn.close()

@dp.callback_query(F.data.startswith('setstatus:'))
async def cb_setstatus(call: types.CallbackQuery):
    await call.answer('✅ Статус обновлён')
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    _, order_id, status = call.data.split(':')
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('UPDATE "Order" SET "status"=%s WHERE "id"=%s RETURNING *;', (status, order_id))
            order = cur.fetchone()
            conn.commit()
        if order:
            log_success(f"Статус заказа {order_id[:8]}... изменён на '{status}'")
            msg = format_order(order)
            await call.message.edit_text(msg, parse_mode=ParseMode.HTML, reply_markup=get_status_buttons(order_id))
        else:
            await call.message.edit_text('❌ <b>Заказ не найден.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
    finally:
        conn.close()

@dp.callback_query(F.data.startswith('deleteorder_confirm:'))
async def cb_delete_confirm(call: types.CallbackQuery):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    order_id = call.data.split(':')[1]
    await call.message.edit_text('❗️ <b>Вы уверены, что хотите удалить заказ?</b>', parse_mode=ParseMode.HTML, reply_markup=get_delete_confirm_buttons(order_id))

@dp.callback_query(F.data.startswith('deleteorder:'))
async def cb_delete_order(call: types.CallbackQuery):
    await call.answer('🗑 Заказ удалён')
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    order_id = call.data.split(':')[1]
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM "Order" WHERE "id"=%s RETURNING "id";', (order_id,))
            result = cur.fetchone()
            conn.commit()
        if result:
            log_warning(f"Заказ {order_id[:8]}... удалён")
            await call.message.edit_text(f'✅ Заказ {order_id} удалён.', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
        else:
            await call.message.edit_text('❌ <b>Заказ не найден.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
    finally:
        conn.close()

@dp.callback_query(F.data == 'help')
async def cb_help(call: types.CallbackQuery):
    await call.answer()
    await call.message.edit_text(
        "<b>❓ Помощь</b>\n\n"
        "<b>/orders</b> — последние заказы\n"
        "<b>/stats</b> — статистика\n"
        "<b>/order &lt;id&gt;</b> — детали заказа\n"
        "<b>/setstatus &lt;id&gt; &lt;status&gt;</b> — сменить статус заказа\n"
        "<b>/deleteorder &lt;id&gt;</b> — удалить заказ\n"
        "<b>/start</b> — главное меню",
        parse_mode=ParseMode.HTML,
        reply_markup=get_back_menu()
    )

@dp.callback_query(F.data == 'stats')
async def cb_stats(call: types.CallbackQuery):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    log_info("Запрос статистики заказов")
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT COUNT(*) as count, SUM("totalPrice") as sum, AVG("totalPrice") as avg FROM "Order";')
            stats = cur.fetchone()
            cur.execute('SELECT "items" FROM "Order";')
            all_items = cur.fetchall()
        from collections import Counter
        product_counter = Counter()
        for row in all_items:
            items = row['items']
            if isinstance(items, list):
                for item in items:
                    product_counter[item.get('title', 'Без названия')] += item.get('quantity', 1)
        top_products = product_counter.most_common(5)
        stats_text = (
            f"<b>Всего заказов:</b> {stats['count']}\n"
            f"<b>Сумма заказов:</b> {stats['sum']}₽\n"
            f"<b>Средний чек:</b> {stats['avg']}₽\n\n"
            f"<b>Топ товары:</b>\n" + '\n'.join([f"- {title}: {qty} шт." for title, qty in top_products])
        )
        await call.message.edit_text(stats_text, parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
    finally:
        conn.close()

@dp.callback_query(F.data == 'export')
async def cb_export(call: types.CallbackQuery):
    await call.answer('📥 Подготовка экспорта...')
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    log_info("Экспорт заказов в CSV")
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM "Order" ORDER BY "createdAt" DESC;')
            orders = cur.fetchall()
        if not orders:
            await call.message.edit_text('❌ <b>Нет заказов для экспорта.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
            return
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=orders[0].keys())
        writer.writeheader()
        for order in orders:
            writer.writerow(order)
        output.seek(0)
        file = BufferedInputFile(output.getvalue().encode(), filename='orders.csv')
        await call.message.delete()
        await call.message.answer_document(file, caption='📤 Экспорт заказов', reply_markup=get_back_menu())
        log_success(f"Экспортировано заказов: {len(orders)}")
    finally:
        conn.close()

@dp.callback_query(F.data == 'find_menu')
async def cb_find_menu(call: types.CallbackQuery):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    await call.message.edit_text('🔍 <b>Выберите способ поиска заказа:</b>', parse_mode=ParseMode.HTML, reply_markup=get_find_menu())

@dp.callback_query(F.data == 'find_contact')
async def cb_find_contact(call: types.CallbackQuery, state: FSMContext):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    await state.set_state('find_query_contact')
    await call.message.edit_text('📧 <b>Введите email или телефон для поиска заказа:</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())

@dp.callback_query(F.data == 'find_id')
async def cb_find_id(call: types.CallbackQuery, state: FSMContext):
    await call.answer()
    if not is_admin(call.from_user.id):
        await call.message.edit_text('Вы не администратор. Хотите ли вы купить что-нибудь? https://railguard.ru')
        return
    await state.set_state('find_query_id')
    await call.message.edit_text('🆔 <b>Введите ID заказа для поиска:</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())

@dp.message()
async def find_query_handler(message: types.Message, state: FSMContext):
    data = await state.get_state()
    if data == 'find_query_contact':
        query = message.text.strip()
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM "Order" WHERE (contact->>\'email\' = %s OR contact->>\'phone\' = %s) ORDER BY "createdAt" DESC;', (query, query))
                orders = cur.fetchall()
            if not orders:
                await message.answer('❌ <b>Заказ не найден.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
            else:
                for order in orders:
                    msg = format_order(order)
                    await message.answer(msg, parse_mode=ParseMode.HTML, reply_markup=get_status_buttons(order['id']))
        finally:
            conn.close()
        await state.clear()
    elif data == 'find_query_id':
        query = message.text.strip()
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM "Order" WHERE "id"=%s;', (query,))
                order = cur.fetchone()
            if not order:
                await message.answer('❌ <b>Заказ не найден.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
            else:
                msg = format_order(order)
                await message.answer(msg, parse_mode=ParseMode.HTML, reply_markup=get_status_buttons(order['id']))
        finally:
            conn.close()
        await state.clear()

@dp.callback_query(F.data == 'filter_menu')
async def cb_filter_menu(call: types.CallbackQuery):
    await call.answer()
    await call.message.edit_text('🗂 <b>Выберите статус для фильтрации заказов:</b>', parse_mode=ParseMode.HTML, reply_markup=get_filter_menu())

@dp.callback_query(OrderFilterCallback.filter())
async def cb_filter_orders(call: types.CallbackQuery, callback_data: OrderFilterCallback):
    await call.answer()
    status = callback_data.status
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if status == 'all':
                cur.execute('SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 20;')
            else:
                cur.execute('SELECT * FROM "Order" WHERE "status"=%s ORDER BY "createdAt" DESC LIMIT 20;', (status,))
            orders = cur.fetchall()
        if not orders:
            await call.message.edit_text('❌ <b>Нет заказов с таким статусом.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
        else:
            text = '\n\n'.join([
                f"<b>ID:</b> <code>{o['id']}</code>\n<b>Статус:</b> {format_status(o['status'])}\n<b>Сумма:</b> <b>{o['totalPrice']}₽</b>\n<b>Создан:</b> <i>{format_datetime(o['createdAt'])}</i>" for o in orders
            ])
            status_name = 'Все' if status == 'all' else format_status(status)
            await call.message.edit_text(f"<b>Заказы со статусом:</b> {status_name}\n\n{text}", parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
    finally:
        conn.close()

@dp.callback_query(F.data == 'mass_select')
async def cb_mass_select(call: types.CallbackQuery):
    await call.answer()
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT "id", "status", "totalPrice", "createdAt" FROM "Order" ORDER BY "createdAt" DESC LIMIT 20;')
            orders = cur.fetchall()
        if not orders:
            await call.message.edit_text('❌ <b>Нет заказов для массовых действий.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
            return
        builder = InlineKeyboardBuilder()
        for o in orders:
            builder.button(text=f"{o['id'][:8]}... [{format_status(o['status'])}]", callback_data=f"masspick:{o['id']}")
        builder.button(text="🏠 Главное меню", callback_data="main_menu")
        builder.adjust(2, 1)
        await call.message.edit_text('🧩 <b>Выберите заказы для массового действия:</b>', parse_mode=ParseMode.HTML, reply_markup=builder.as_markup())
    finally:
        conn.close()

# --- Сбор выбранных для массового действия ---
selected_mass_ids = set()

@dp.callback_query(F.data.startswith('masspick:'))
async def cb_mass_pick(call: types.CallbackQuery):
    order_id = call.data.split(':')[1]
    selected_mass_ids.add(order_id)
    await call.answer(f'✅ Выбрано: {len(selected_mass_ids)}')
    await call.message.edit_text(
        f'<b>Выбрано заказов:</b> {len(selected_mass_ids)}\n\n' + 
        '\n'.join([f'• <code>{oid[:8]}...</code>' for oid in list(selected_mass_ids)[:10]]),
        parse_mode=ParseMode.HTML,
        reply_markup=get_mass_action_menu(",".join(selected_mass_ids))
    )

@dp.callback_query(MassActionCallback.filter())
async def cb_mass_action(call: types.CallbackQuery, callback_data: MassActionCallback):
    ids = callback_data.ids.split(',')
    action = callback_data.action
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if action == 'delete':
                cur.execute(f'DELETE FROM "Order" WHERE "id" IN %s RETURNING "id";', (tuple(ids),))
                conn.commit()
                log_warning(f"Массовое удаление: {len(ids)} заказов")
                await call.answer(f'🗑 Удалено: {len(ids)}', show_alert=True)
                await call.message.edit_text(f'✅ <b>Удалено заказов:</b> {len(ids)}', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
            elif action.startswith('setstatus_'):
                new_status = action.split('_')[1]
                cur.execute(f'UPDATE "Order" SET "status"=%s WHERE "id" IN %s;', (new_status, tuple(ids)))
                conn.commit()
                log_success(f"Массовое обновление статуса '{new_status}': {len(ids)} заказов")
                await call.answer(f'✅ Обновлено: {len(ids)}', show_alert=True)
                await call.message.edit_text(f'✅ <b>Статус изменён для {len(ids)} заказов.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
    finally:
        conn.close()
    selected_mass_ids.clear()

# --- Фоновая задача: уведомления о просроченных заказах ---
async def poll_new_orders(bot: Bot):
    log_info("Мониторинг новых заказов запущен")
    while True:
        await asyncio.sleep(10)
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 1;')
                order = cur.fetchone()
            if order:
                last_id = get_last_order_id()
                if str(order['id']) != str(last_id):
                    log_order(f"Новый заказ! ID: {order['id'][:8]}... | Сумма: {order['totalPrice']}₽")
                    msg = format_order(order, new=True)
                    await bot.send_message(chat_id=ADMIN_ID, text=msg, parse_mode=ParseMode.HTML, reply_markup=get_status_buttons(order['id']))
                    set_last_order_id(order['id'])
            # --- Проверка просроченных ---
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM "Order" WHERE "status"=%s AND "createdAt" < NOW() - INTERVAL '"'1 day'"';', ('pending',))
                overdue = cur.fetchall()
            if overdue:
                log_warning(f"Просроченных заказов: {len(overdue)}")
                for o in overdue:
                    msg = f'⚠️ <b>Просроченный заказ!</b>\n{format_order(o)}'
                    await bot.send_message(chat_id=ADMIN_ID, text=msg, parse_mode=ParseMode.HTML, reply_markup=get_status_buttons(o['id']))
        except Exception as e:
            log_error(f"Ошибка мониторинга: {e}")
        finally:
            conn.close()

# --- График продаж ---
@dp.callback_query(F.data == 'sales_graph')
async def cb_sales_graph(call: types.CallbackQuery):
    await call.answer('📊 Генерация графика...')
    log_info("Генерация графика продаж")
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT "createdAt", "totalPrice" FROM "Order" ORDER BY "createdAt" ASC;')
            data = cur.fetchall()
        if not data:
            await call.message.edit_text('❌ <b>Нет данных для графика.</b>', parse_mode=ParseMode.HTML, reply_markup=get_back_menu())
            return
        log_success("График продаж отправлен")
        # Готовим данные для графика
        dates = [d['createdAt'].date() for d in data]
        prices = [d['totalPrice'] for d in data]
        from collections import defaultdict
        day_sum = defaultdict(int)
        for d, p in zip(dates, prices):
            day_sum[d] += p
        days = sorted(day_sum.keys())
        sums = [day_sum[d] for d in days]
        fig, ax = plt.subplots(figsize=(6, 3))
        ax.plot(days, sums, marker='o')
        ax.set_title('Сумма продаж по дням')
        ax.set_xlabel('Дата')
        ax.set_ylabel('Сумма, ₽')
        fig.autofmt_xdate()
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        buf.seek(0)
        from aiogram.types import BufferedInputFile
        photo = BufferedInputFile(buf.getvalue(), filename='sales.png')
        await call.message.delete()
        await call.message.answer_photo(photo, caption='📈 График продаж', reply_markup=get_back_menu())
        plt.close(fig)
    finally:
        conn.close()

# --- Обработка ошибок ---
@dp.error()
async def on_error(event):
    log_error(f"Ошибка: {event.exception}")
    try:
        if ADMIN_ID:
            await Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML)).send_message(chat_id=ADMIN_ID, text=f"Ошибка: {event.exception}")
    except Exception as e:
        log_error(f"Не удалось отправить ошибку админу: {e}")

# --- Запуск ---
async def main():
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}║{Style.RESET_ALL}{Fore.MAGENTA}{' '*15}🤖 ADMIN BOT STARTING{' '*22}{Style.RESET_ALL}{Fore.CYAN}║{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")
    
    log_info(f"Admin ID: {ADMIN_ID}")
    log_info("Подключение к базе данных...")
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute('SELECT COUNT(*) as count FROM "Order";')
            count = cur.fetchone()['count']
        conn.close()
        log_success(f"База данных подключена | Заказов в БД: {count}")
    except Exception as e:
        log_error(f"Ошибка подключения к БД: {e}")
        return
    
    bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    asyncio.create_task(poll_new_orders(bot))
    
    log_success("Бот успешно запущен!")
    print(f"\n{Fore.GREEN}{'─'*60}{Style.RESET_ALL}\n")
    
    await dp.start_polling(bot)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{Fore.YELLOW}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}║{Style.RESET_ALL}{Fore.RED}{' '*18}🛑 БОТ ОСТАНОВЛЕН{' '*21}{Style.RESET_ALL}{Fore.YELLOW}║{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}{'='*60}{Style.RESET_ALL}\n") 