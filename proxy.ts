import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'session';

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  const path = request.nextUrl.pathname;

  // Публичные маршруты
  const publicRoutes = ['/login', '/register', '/'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  // API маршруты
  const isApiRoute = path.startsWith('/api');
  
  // Реферальные ссылки
  const isRefRoute = path.startsWith('/ref/');

  // Пропускаем публичные маршруты, API и реферальные ссылки
  if (isPublicRoute || isApiRoute || isRefRoute) {
    return NextResponse.next();
  }

  // Проверка авторизации для защищенных маршрутов
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Парсим сессию для проверки роли
  try {
    const sessionData = JSON.parse(session.value);
    
    // /admin — только для админа
    if (path.startsWith('/admin') && sessionData.role !== 'admin') {
      if (sessionData.role === 'leader') {
        return NextResponse.redirect(new URL('/leader', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // /leader — для лидера и админа
    if (path.startsWith('/leader') && !['leader', 'admin'].includes(sessionData.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // /dashboard и /lesson — для ученика и админа
    if ((path.startsWith('/dashboard') || path.startsWith('/lesson')) && !['student', 'admin'].includes(sessionData.role)) {
      return NextResponse.redirect(new URL('/leader', request.url));
    }
  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
