import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Страна визита берётся из заголовка Cloudflare `cf-ipcountry` (сайт должен быть за Cloudflare-прокси).
// Без заголовка страна = XX (неизвестна) и Google Analytics не грузится. GEO_DEFAULT_COUNTRY — для локальной проверки.
export function middleware(req: NextRequest) {
  const country = (req.headers.get('cf-ipcountry') || process.env.GEO_DEFAULT_COUNTRY || 'XX').toUpperCase();
  const res = NextResponse.next();
  if (req.cookies.get('geo-country')?.value !== country) {
    res.cookies.set('geo-country', country, { path: '/', maxAge: 86400, sameSite: 'lax' });
  }
  return res;
}

export const config = { matcher: ['/((?!_next|api|fonts|webp|.*\\..*).*)'] };
