import { defineMiddleware } from 'astro/middleware';
import { db } from './lib/db';
import { sessions, users } from './lib/db/schema';
import { eq } from 'drizzle-orm';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = new Set(['/login', '/api/auth/login', '/_astro', '/favicon.ico', '/favicon.svg', '/logo.svg']);

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Inicializar user como null
  context.locals.user = null;

  // Assets estáticos y /login son públicos
  for (const prefix of PUBLIC_ROUTES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith('/_astro/')) {
      return next();
    }
  }

  // Intentar validar sesión
  const sessionToken = context.cookies.get('session')?.value;

  if (sessionToken) {
    try {
      const [session] = await db
        .select({
          token: sessions.token,
          user_id: sessions.user_id,
          expires_at: sessions.expires_at,
          user: {
            id: users.id,
            username: users.username,
            display_name: users.display_name,
          },
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.user_id, users.id))
        .where(eq(sessions.token, sessionToken))
        .limit(1);

      if (session && new Date(session.expires_at) > new Date()) {
        context.locals.user = {
          id: session.user.id,
          username: session.user.username,
          display_name: session.user.display_name,
        };
        return next();
      }
    } catch {
      // Si falla la DB, no bloquear — pasar como no auth
    }
  }

  // Rutas de API: devolver 401 en vez de redirect
  if (pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Redirección silenciosa al login
  return context.redirect('/login');
});