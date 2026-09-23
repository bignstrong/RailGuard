import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from 'lib/adminAuth';
import { csvField } from 'lib/adminShared';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) return;
  const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  const csv = ['email;createdAt;consentAt', ...rows.map((r) => [r.email, r.createdAt.toISOString(), r.consentAt?.toISOString() ?? ''].map(csvField).join(';'))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send('﻿' + csv);
}
