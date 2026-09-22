import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, requireAdmin, sameOrigin } from 'lib/adminAuth';
import prisma from 'lib/prisma';

const Create = z.object({
  brand: z.string().min(1, 'Марка не может быть пустой').max(60).trim(),
  model: z.string().min(1, 'Модель не может быть пустой').max(60).trim(),
  engine: z.string().min(1, 'Двигатель не может быть пустым').max(60).trim(),
  years: z.string().max(60).trim().optional(),
  note: z.string().max(60).trim().optional(),
});

const Delete = z.object({
  id: z.string().min(1),
});

const Publish = z.object({
  published: z.boolean(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'POST') {
    if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
    const parsed = Create.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Некорректные данные' });
    const { brand, model, engine, years, note } = parsed.data;
    const vehicle = await prisma.vehicle.create({
      data: {
        brand: brand.trim(),
        model: model.trim(),
        engine: engine.trim(),
        years: years?.trim() || null,
        note: note?.trim() || null,
      },
    });
    console.info(`[admin] ${session.user}@${clientIp(req)} created vehicle ${brand} ${model}`);
    return res.status(201).json({ id: vehicle.id, brand: vehicle.brand, model: vehicle.model, engine: vehicle.engine, years: vehicle.years, note: vehicle.note, createdAt: vehicle.createdAt.toISOString() });
  }

  if (req.method === 'DELETE') {
    if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
    const parsed = Delete.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Некорректные данные' });
    const { id } = parsed.data;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return res.status(404).json({ message: 'Двигатель не найден' });
    await prisma.vehicle.delete({ where: { id } });
    console.info(`[admin] ${session.user}@${clientIp(req)} deleted vehicle ${vehicle.brand} ${vehicle.model}`);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PUT') {
    if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
    const parsed = Publish.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Некорректные данные' });
    const { published } = parsed.data;
    const value = published ? 'on' : 'off';
    await prisma.setting.upsert({
      where: { key: 'compatibility' },
      update: { value },
      create: { key: 'compatibility', value },
    });
    const action = published ? 'published' : 'unpublished';
    console.info(`[admin] ${session.user}@${clientIp(req)} ${action} compatibility`);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
