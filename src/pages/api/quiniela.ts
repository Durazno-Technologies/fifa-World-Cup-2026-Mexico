import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { sessions, predictions } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { isDeadlinePassed, validatePredictions } from '../../lib/validators';

export const prerender = false;

export const PUT: APIRoute = async ({ request, cookies }) => {
  // Verificar sesión
  const sessionToken = cookies.get('session')?.value;
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Obtener user_id desde la sesión
    const [session] = await db
      .select({
        user_id: sessions.user_id,
        expires_at: sessions.expires_at,
      })
      .from(sessions)
      .where(eq(sessions.token, sessionToken))
      .limit(1);

    if (!session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Sesión expirada' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user_id;

    // Verificar deadline
    if (isDeadlinePassed()) {
      return new Response(JSON.stringify({ error: 'Fecha límite alcanzada. No es posible modificar predicciones.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Leer y validar payload
    const body = await request.json();
    const { predicciones } = body;

    if (!Array.isArray(predicciones)) {
      return new Response(JSON.stringify({ error: 'Formato inválido: se espera un array de predicciones' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validation = validatePredictions(predicciones);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upsert: insertar o actualizar cada predicción
    for (const pred of validation.predictions) {
      await db
        .insert(predictions)
        .values({
          user_id: userId,
          match_id: pred.matchId,
          resultado: pred.resultado,
          goles_local: pred.golesLocal,
          goles_visita: pred.golesVisita,
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: [predictions.user_id, predictions.match_id],
          set: {
            resultado: pred.resultado,
            goles_local: pred.golesLocal,
            goles_visita: pred.golesVisita,
            updated_at: new Date(),
          },
        });
    }

    return new Response(JSON.stringify({ ok: true, saved: validation.predictions.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('PUT /api/quiniela error:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};