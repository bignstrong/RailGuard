import { SESSION_COOKIE, verifySession } from 'lib/adminSession';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const clientIp = (req: NextRequest) => req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';

// Админка живёт на секретном префиксе ADMIN_PATH (например /k3x9-panel) и внутренне переписывается на /admin/*.
// Прямые /admin и /api/admin всегда 404. Без ADMIN_PATH админка недоступна вообще.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const adminPath = (process.env.ADMIN_PATH || '').replace(/\/+$/, '');
  if (adminPath.length > 1 && (pathname === adminPath || pathname.startsWith(adminPath + '/'))) {
    const allowed = process.env.ADMIN_ALLOWED_IPS?.split(',').map((s) => s.trim()).filter(Boolean);
    if (allowed?.length && !allowed.includes(clientIp(req))) {
      return new NextResponse('Not found', { status: 404 });
    }
    const rest = pathname.slice(adminPath.length) || '/';
    const isApi = rest.startsWith('/api/');
    const isLogin = rest === '/login' || rest === '/api/login';
    if (!isLogin && !(await verifySession(req.cookies.get(SESSION_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET))) {
      return isApi ? NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) : NextResponse.redirect(new URL(`${adminPath}/login`, req.url));
    }
    const target = isApi ? `/api/admin${rest.slice(4)}` : `/admin${rest === '/' ? '' : rest}`;
    const url = req.nextUrl.clone();
    url.pathname = target;
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  // Гео-cookie только для страниц сайта.
  if (pathname.startsWith('/api/') || /\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();
  const country = (req.headers.get('x-country') || req.headers.get('cf-ipcountry') || process.env.GEO_DEFAULT_COUNTRY || 'XX').toUpperCase();
  const res = NextResponse.next();
  if (req.cookies.get('geo-country')?.value !== country) {
    res.cookies.set('geo-country', country, { path: '/', maxAge: 86400, sameSite: 'lax' });
  }
  return res;
}

export const config = { matcher: ['/((?!_next/|favicon.ico|fonts/|webp/).*)'] };
