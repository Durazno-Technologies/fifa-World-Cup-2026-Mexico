import type { APIRoute } from 'astro';
import { db, schema } from '../../../lib/db';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import crypto from 'crypto';
import { checkRateLimit } from '../../../lib/rate-limiter';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  // Rate limiting: 5 intentos por minuto por IP
  const xff = request.headers.get('x-forwarded-for');
  const ip = (xff ? xff.split(',')[0]?.trim() : clientAddress) || clientAddress || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`login:${ip}`, 5, 60_000);
  if (!allowed) {
    return new Response(JSON.stringify({
      error: `Demasiados intentos. Intenta de nuevo en ${retryAfter} segundos.`
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
    });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Formato inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { username, password } = body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return new Response(JSON.stringify({ error: 'Usuario o contraseña inválidos' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const usernameLower = username.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, usernameLower))
      .limit(1);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario o contraseña inválidos' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validPassword = await verify(user.password_hash, password);
    if (!validPassword) {
      return new Response(JSON.stringify({ error: 'Usuario o contraseña inválidos' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generar token de sesión
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 días

    // Reemplazar sesiones previas del mismo usuario para evitar conflicto de índice
    await db.delete(schema.sessions).where(eq(schema.sessions.user_id, user.id));

    await db.insert(schema.sessions).values({
      token,
      user_id: user.id,
      expires_at: expiresAt,
    });

    // Setear cookie
    const isSecure = new URL(request.url).protocol === 'https:' || import.meta.env.PROD;
    cookies.set('session', token, {
      path: '/',
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60, // 90 días en segundos
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
