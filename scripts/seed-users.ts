/**
 * Script para crear usuarios en la DB.
 * Uso: npx tsx scripts/seed-users.ts admin:admin123 user1:password1 user2:password2
 *
 * Los pares username:password se pasan como argumentos.
 * El username se convierte a lowercase automáticamente.
 * El display_name se obtiene del username.
 */
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';

const connectionString = process.env.DATABASE_URL_QUINIELA;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL_QUINIELA environment variable is not set');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('USO: npx tsx scripts/seed-users.ts username:password [username2:password2 ...]');
  console.error('Ej: npx tsx scripts/seed-users.ts admin:changeme richi:secreto');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

try {
  for (const pair of args) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) {
      console.error(`  SKIP: "${pair}" no tiene formato username:password`);
      continue;
    }
    const username = pair.slice(0, colonIdx).toLowerCase().trim();
    const password = pair.slice(colonIdx + 1);

    if (!username || !password) {
      console.error(`  SKIP: username o password vacío en "${pair}"`);
      continue;
    }

    const password_hash = await hash(password, {
      algorithm: 2, // argon2id
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
    });

    const display_name = username.charAt(0).toUpperCase() + username.slice(1);

    await sql`
      INSERT INTO users (username, password_hash, display_name)
      VALUES (${username}, ${password_hash}, ${display_name})
      ON CONFLICT (username) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            display_name = EXCLUDED.display_name
    `;

    console.log(`  OK: "${username}" creado/actualizado (display_name: "${display_name}")`);
  }

  console.log('\n✅ Seed completado. Usuarios en DB:');
  const rows = await sql`SELECT id, username, display_name, created_at FROM users ORDER BY id`;
  for (const r of rows) {
    console.log(`   #${r.id} ${r.username} (${r.display_name}) — creado ${r.created_at}`);
  }
} catch (err) {
  console.error('ERROR:', err);
  process.exit(1);
} finally {
  await sql.end();
}