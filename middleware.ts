import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Страна визита: заголовок X-Country от nginx (geoip2, см. nginx/Dockerfile), либо cf-ipcountry, если сайт за Cloudflare.
// Без заголовка страна = XX (неизвестна) и Google Analytics не грузится. GEO_DEFAULT_COUNTRY — для локальной проверки.
export function middleware(req: NextRequest) {
  const country = (req.headers.get('x-country') || req.headers.get('cf-ipcountry') || process.env.GEO_DEFAULT_COUNTRY || 'XX').toUpperCase();
  const res = NextResponse.next();
  if (req.cookies.get('geo-country')?.value !== country) {
    res.cookies.set('geo-country', country, { path: '/', maxAge: 86400, sameSite: 'lax' });
  }
  return res;
}

export const config = { matcher: ['/((?!_next|api|fonts|webp|.*\\..*).*)'] };
