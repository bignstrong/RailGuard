import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import prisma from '../../lib/prisma';

// Validation schema for cart items
const CartItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string(),
});

// Validation schema for contact information
const ContactSchema = z.object({
  phone: z.string(),
  email: z.string().email(),
  preferredContact: z.enum(['phone', 'whatsapp', 'telegram']),
});

// Main order schema
const OrderSchema = z.object({
  items: z.array(CartItemSchema).nonempty(),
  contact: ContactSchema,
  totalPrice: z.number().positive(),
});

type OrderSchemaType = z.infer<typeof OrderSchema>;

// Telegram bot configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

interface OrderData extends OrderSchemaType {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
}

async function sendTelegramNotification(order: OrderData) {
  console.log('Telegram configuration:', {
    botTokenExists: !!TELEGRAM_BOT_TOKEN,
    chatIdExists: !!TELEGRAM_CHAT_ID,
    chatId: TELEGRAM_CHAT_ID,
  });

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram configuration is missing');
    return;
  }

  const chatId = TELEGRAM_CHAT_ID.startsWith('@') ? TELEGRAM_CHAT_ID : `${TELEGRAM_CHAT_ID}`;

  const getContactInfo = (contact: OrderData['contact']) => {
    const phone = contact.phone;
    switch (contact.preferredContact) {
      case 'phone':
        return `📞 Телефон: ${phone}`;
      case 'whatsapp':
        return `📱 WhatsApp: ${phone} (https://wa.me/${phone.replace(/\D/g, '')})`;
      case 'telegram':
        return `📬 Telegram: ${phone}`;
      default:
        return `📱 Контакт: ${phone}`;
    }
  };

  const message = `
🛍 Новый заказ!

${getContactInfo(order.contact)}
📧 Email: ${order.contact.email}
💰 Сумма: ${order.totalPrice.toLocaleString('ru-RU')}₽

Товары:
${order.items.map((item) => `- ${item.title} (${item.quantity} шт.)`).join('\n')}
`;

  console.log('Attempting to send Telegram message:', {
    url: TELEGRAM_API_URL,
    chatId,
    messageLength: message.length,
  });

  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const responseData = await response.json();
    console.log('Telegram API response:', responseData);

    if (!response.ok) {
      console.error('Failed to send Telegram notification:', responseData);
      console.log('Troubleshooting steps:');
      console.log('1. Verify that the bot token is correct');
      console.log('2. Make sure the bot is added to the chat/channel');
      console.log('3. If using a channel, ensure the chat_id starts with "@"');
      console.log('4. If using a private chat, get the correct chat_id from the @userinfobot');
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received order request:', {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'],
    },
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Parsed request body:', data);

    const validationResult = OrderSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return res.status(400).json({
        message: 'Invalid request data',
        errors: validationResult.error.errors,
      });
    }

    // Verify total price calculation
    const calculatedTotal = validationResult.data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (Math.abs(calculatedTotal - validationResult.data.totalPrice) > 0.01) {
      return res.status(400).json({
        message: 'Invalid total price',
        expected: calculatedTotal,
        received: validationResult.data.totalPrice,
      });
    }

    const orderData: OrderData = {
      ...validationResult.data,
      status: 'pending',
      createdAt: new Date(),
    };

    // Save order to database using a transaction
    const savedOrder = await prisma.$transaction(async (tx: PrismaClient) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          items: orderData.items,
          contact: orderData.contact,
          totalPrice: orderData.totalPrice,
          status: orderData.status,
        },
      });

      // Log the created order
      console.log('Order created in database:', order);

      return order;
    });

    // Send Telegram notification (don't wait for it)
    sendTelegramNotification(orderData).catch((error) => {
      console.error('Failed to send Telegram notification:', error);
    });

    return res.status(200).json({
      message: 'Order created successfully',
      orderId: savedOrder.id,
    });
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({
      message: 'An error occurred while processing your order. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
