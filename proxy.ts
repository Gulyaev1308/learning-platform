import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'session';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Пропускаем загрузку файлов без обработки
  if (path.includes('/api/admin/upload')) {
    return NextResponse.next();
  }

  // Пропускаем статические файлы
  if (path.startsWith('/videos/') || path.startsWith('/_next/') || path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  const publicRoutes = ['/login', '/register', '/register-leader', '/', '/ref/'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  if (isPublicRoute) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const sessionData = JSON.parse(session.value);
    
    if (path.startsWith('/admin') && sessionData.role !== 'admin') {
      return NextResponse.redirect(new URL(sessionData.role === 'leader' ? '/leader' : '/dashboard', request.url));
    }
    if (path.startsWith('/leader') && !['leader', 'admin'].includes(sessionData.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if ((path.startsWith('/dashboard') || path.startsWith('/lesson')) && !['student', 'admin'].includes(sessionData.role)) {
      return NextResponse.redirect(new URL('/leader', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)'],
};
