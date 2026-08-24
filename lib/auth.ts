import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './constants';
import { SessionData } from './types';
import db from './db';

// Получение текущей сессии
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  
  if (!sessionCookie) return null;
  
  try {
    const session = JSON.parse(sessionCookie.value) as SessionData;
    return session;
  } catch {
    return null;
  }
}

// Получение текущего пользователя
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session) return null;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId);
  return user || null;
}

// Создание сессии
export async function createSession(sessionData: SessionData) {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: '/',
  });
}

// Удаление сессии
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Проверка роли
export async function requireRole(role: 'student' | 'leader') {
  const session = await getSession();
  
  if (!session) {
    return { authorized: false, redirect: '/login' };
  }
  
  if (session.role !== role) {
    return { authorized: false, redirect: session.role === 'student' ? '/dashboard' : '/leader' };
  }
  
  return { authorized: true, session };
}
