import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './constants';
import { SessionData } from './types';
import db from './db';

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;
  try { return JSON.parse(sessionCookie.value); } catch { return null; }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const result = await db.query('SELECT * FROM users WHERE id = $1', [session.userId]);
  return result.rows[0] || null;
}

export async function createSession(sessionData: SessionData) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
