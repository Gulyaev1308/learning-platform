import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './constants';
import { SessionData } from './types';
import db from './db';

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;
  try { 
    return JSON.parse(sessionCookie.value); 
  } catch { 
    return null; 
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  
  // Безопасность: Проверяем оба варианта ключа (userId или id), чтобы Postgres не получил undefined
  const targetId = session.userId || (session as any).id;
  if (!targetId) return null;

  const result = await db.query('SELECT * FROM users WHERE id = $1', [targetId]);
  return result.rows[0] || null;
}

export async function createSession(sessionData: SessionData) {
  const cookieStore = await cookies();
  
  // Магия совместимости: дублируем ID в оба формата, чтобы старый код сайта не ломался в Postgres
  const enrichedSession = {
    ...sessionData,
    userId: sessionData.userId || (sessionData as any).id,
    id: sessionData.userId || (sessionData as any).id
  };

  cookieStore.set(SESSION_COOKIE, JSON.stringify(enrichedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 дней
    path: '/',
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
