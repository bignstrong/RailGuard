import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import prisma from '../../lib/prisma';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
});

// Validation schema
const OrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
        image: z.string().url(),
      }),
    )
    .nonempty(),
  contact: z.object({
    phone: z.string().regex(/^\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}$/),
    preferredContact: z.enum(['phone', 'whatsapp', 'telegram']),
  }),
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
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('Telegram configuration is missing');
  }

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
💰 Сумма: ${order.totalPrice.toLocaleString('ru-RU')}₽

Товары:
${order.items.map((item) => `- ${item.title} (${item.quantity} шт.)`).join('\n')}
`;

  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send Telegram notification: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

// Apply rate limiting to the API route
const applyRateLimit = (req: NextApiRequest, res: NextApiResponse) =>
  new Promise((resolve, reject) => {
    limiter(req, res, (result: any) => (result instanceof Error ? reject(result) : resolve(result)));
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check method
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Apply rate limiting
    await applyRateLimit(req, res);

    // Validate request body
    const validationResult = OrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: validationResult.error.errors,
      });
    }

    // Verify total price calculation
    const calculatedTotal = validationResult.data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (Math.abs(calculatedTotal - validationResult.data.totalPrice) > 0.01) {
      return res.status(400).json({ message: 'Invalid total price' });
    }

    const orderData: OrderData = {
      ...validationResult.data,
      status: 'pending',
      createdAt: new Date(),
    };

    // Save order to database within a transaction
    const savedOrder = await prisma.$transaction(async (tx: PrismaClient) => {
      const order = await tx.order.create({
        data: {
          items: orderData.items,
          contact: orderData.contact,
          totalPrice: orderData.totalPrice,
          status: orderData.status,
        },
      });

      // Send Telegram notification
      await sendTelegramNotification(orderData);

      return order;
    });

    return res.status(200).json({
      message: 'Order created successfully',
      orderId: savedOrder.id,
    });
  } catch (error) {
    console.error('Error processing order:', error);

    // Don't expose internal error details to the client
    return res.status(500).json({
      message: 'An error occurred while processing your order. Please try again later.',
    });
  }
}
