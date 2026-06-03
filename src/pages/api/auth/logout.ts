import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { sessions } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const sessionToken = cookies.get('session')?.value;

  if (sessionToken) {
    try {
      await db.delete(sessions).where(eq(sessions.token, sessionToken));
    } catch {
      // Ignorar errores de DB en logout
    }
  }

  // Limpiar cookie
  const isSecure = import.meta.env.PROD;
  cookies.set('session', '', {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
