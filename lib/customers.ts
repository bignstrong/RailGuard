import prisma from 'lib/prisma';

// Покупатель = пара «телефон + email» (логическое И): совпало одно из двух — это другой покупатель.
const key = (phone: string, email: string) => ({ phone, email: email.trim().toLowerCase() });

export async function customerFor(phone: string, email: string) {
  const k = key(phone, email);
  try {
    return await prisma.customer.upsert({ where: { phone_email: k }, create: k, update: {} });
  } catch (err: any) {
    // Два заказа одновременно: второй upsert ловит нарушение уникальности — покупатель уже создан.
    if (err?.code !== 'P2002') throw err;
    return prisma.customer.findUniqueOrThrow({ where: { phone_email: k } });
  }
}

// Покупатель без заказов — лишние персональные данные: удаляем.
export async function dropIfEmpty(id: string | null | undefined) {
  if (id) await prisma.customer.deleteMany({ where: { id, orders: { none: {} } } });
}
