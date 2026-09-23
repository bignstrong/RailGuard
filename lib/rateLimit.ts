import type { NextApiRequest } from 'next';
import { clientIp } from 'lib/adminAuth';

// ponytail: in-memory per-process limiter; use Redis if web scales beyond one replica
const hits = new Map<string, number[]>();

export function rateLimit(req: NextApiRequest, limit = 10, windowMs = 60_000): boolean {
  // X-Real-IP ставит nginx из $remote_addr; левый X-Forwarded-For подделывается клиентом
  const ip = clientIp(req);
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length <= limit;
}
