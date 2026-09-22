import type { NextApiRequest } from 'next';

// ponytail: in-memory per-process limiter; use Redis if web scales beyond one replica
const hits = new Map<string, number[]>();

export function rateLimit(req: NextApiRequest, limit = 10, windowMs = 60_000): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length <= limit;
}
