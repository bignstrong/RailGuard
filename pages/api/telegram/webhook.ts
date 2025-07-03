import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map(id => id.trim());

interface TelegramUpdate {
  message?: {
    text: string;
    chat: {
      id: number;
    };
    from: {
      id: number;
    };
  };
  callback_query?: {
    data: string;
    message: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    from: {
      id: number;
    };
  };
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });
}

async function editTelegramMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });
}

async function handleStart(chatId: number) {
  const commands = `
Доступные команды:
/orders - Список последних заказов
/stats - Статистика по заказам
/help - Список команд
  `;
  await sendTelegramMessage(chatId, commands);
}

async function handleOrders(chatId: number) {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (orders.length === 0) {
    await sendTelegramMessage(chatId, 'Заказов пока нет');
    return;
  }

  for (const order of orders) {
    const items = order.items as any[];
    const contact = order.contact as any;
    
    const message = `
Заказ #${order.id}
Статус: ${order.status}
Дата: ${order.createdAt.toLocaleString('ru-RU')}
Сумма: ${order.totalPrice.toLocaleString('ru-RU')}₽

Контакт: ${contact.phone}
Email: ${contact.email}

Товары:
${items.map((item) => `- ${item.title} (${item.quantity} шт.)`).join('\n')}
`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Выполнен', callback_data: `status:${order.id}:completed` },
          { text: '🔄 В обработке', callback_data: `status:${order.id}:processing` },
          { text: '❌ Отменён', callback_data: `status:${order.id}:cancelled` },
        ],
      ],
    };

    await sendTelegramMessage(chatId, message, keyboard);
  }
}

async function handleStats(chatId: number) {
  const [
    totalOrders,
    completedOrders,
    totalRevenue,
    averageOrderValue,
    topProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'completed' } }),
    prisma.order.aggregate({
      where: { status: 'completed' },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { status: 'completed' },
      _avg: { totalPrice: true },
    }),
    prisma.order.findMany({
      select: { items: true },
    }),
  ]);

  // Подсчет популярных товаров
  const productStats = new Map();
  for (const order of topProducts) {
    const items = order.items as any[];
    for (const item of items) {
      const current = productStats.get(item.title) || { quantity: 0, revenue: 0 };
      productStats.set(item.title, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + (item.price * item.quantity),
      });
    }
  }

  // Сортировка товаров по количеству продаж
  const sortedProducts = Array.from(productStats.entries())
    .sort(([, a], [, b]) => b.quantity - a.quantity)
    .slice(0, 5);

  const stats = `
📊 Статистика заказов:

Всего заказов: ${totalOrders}
Выполнено заказов: ${completedOrders}
Общая выручка: ${totalRevenue._sum.totalPrice?.toLocaleString('ru-RU') || 0}₽
Средний чек: ${Math.round(averageOrderValue._avg.totalPrice || 0).toLocaleString('ru-RU')}₽

🏆 Топ 5 товаров:
${sortedProducts.map(([title, stats]) => 
  `- ${title}:
    Продано: ${stats.quantity} шт.
    Выручка: ${stats.revenue.toLocaleString('ru-RU')}₽`
).join('\n')}
`;

  await sendTelegramMessage(chatId, stats);
}

async function handleCallback(callbackQuery: TelegramUpdate['callback_query']) {
  if (!callbackQuery) return;

  const [action, orderId, value] = callbackQuery.data.split(':');
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;

  if (action === 'status') {
    try {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: value },
      });

      const items = updatedOrder.items as any[];
      const contact = updatedOrder.contact as any;

      const updatedMessage = `
Заказ #${updatedOrder.id}
Статус: ${updatedOrder.status}
Дата: ${updatedOrder.createdAt.toLocaleString('ru-RU')}
Сумма: ${updatedOrder.totalPrice.toLocaleString('ru-RU')}₽

Контакт: ${contact.phone}
Email: ${contact.email}

Товары:
${items.map((item) => `- ${item.title} (${item.quantity} шт.)`).join('\n')}
`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Выполнен', callback_data: `status:${updatedOrder.id}:completed` },
            { text: '🔄 В обработке', callback_data: `status:${updatedOrder.id}:processing` },
            { text: '❌ Отменён', callback_data: `status:${updatedOrder.id}:cancelled` },
          ],
        ],
      };

      await editTelegramMessage(chatId, messageId, updatedMessage, keyboard);
    } catch (error) {
      console.error('Error updating order status:', error);
      await sendTelegramMessage(chatId, 'Ошибка при обновлении статуса заказа');
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const update: TelegramUpdate = req.body;

    // Проверка авторизации пользователя
    const userId = update.message?.from.id || update.callback_query?.from.id;
    if (!userId || !ALLOWED_USERS.includes(String(userId))) {
      console.warn('Unauthorized access attempt:', userId);
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return res.status(200).json({ message: 'OK' });
    }

    if (!update.message?.text) {
      return res.status(400).json({ message: 'No message text' });
    }

    const chatId = update.message.chat.id;
    const command = update.message.text.toLowerCase();

    switch (command) {
      case '/start':
      case '/help':
        await handleStart(chatId);
        break;
      case '/orders':
        await handleOrders(chatId);
        break;
      case '/stats':
        await handleStats(chatId);
        break;
      default:
        await sendTelegramMessage(chatId, 'Неизвестная команда. Отправьте /help для списка команд.');
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Error processing telegram update:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 