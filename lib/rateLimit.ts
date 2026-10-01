import type { NextApiRequest } from 'next';
import { clientIp } from 'lib/adminAuth';

// ponytail: in-memory per-process limiter; use Redis if web scales beyond one replica
const hits = new Map<string, number[]>();

export function rateLimit(req: NextApiRequest, limit = 10, windowMs = 60_000, name = 'default'): boolean {
  // X-Real-IP ставит nginx из $remote_addr; левый X-Forwarded-For подделывается клиентом
  const ip = clientIp(req);
  const key = `${name}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  // delete+set переносит ключ в конец Map: первым вытесняется тот, кто дольше всех не обращался.
  hits.delete(key);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    const first = hits.entries().next().value;
    if (first) hits.delete(first[0]);
  }
  return recent.length <= limit;
}
