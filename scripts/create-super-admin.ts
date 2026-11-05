/**
 * Creates or promotes a super admin in fpvlovers_app.users.
 *
 * Usage (credentials come from the environment, never from source):
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' [ADMIN_NAME='Name'] \
 *   FPV_DATABASE_URL=postgresql://... pnpm tsx scripts/create-super-admin.ts
 *
 * Add --print-sql to only print the idempotent upsert statement (with the
 * bcrypt hash, never the password) so it can be run through psql on the
 * database host.
 */
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const MIN_PASSWORD_LENGTH = 12;
const ROLE = 'super_admin';
const UPSERT_SQL = `INSERT INTO fpvlovers_app.users (name, email, password_hash, role, email_verified)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name, updated_at = NOW()
RETURNING id`;

function readConfig() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = (process.env.ADMIN_NAME ?? 'Admin').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return { email, password, name };
}

async function main() {
  const { email, password, name } = readConfig();
  const passwordHash = await bcrypt.hash(password, 12);

  if (process.argv.includes('--print-sql')) {
    const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;
    console.log(
      UPSERT_SQL.replace('$1', quote(name))
        .replace('$2', quote(email))
        .replace('$3', quote(passwordHash))
        .replace('$4', quote(ROLE)) + ';'
    );
    return;
  }

  const connectionString = process.env.FPV_DATABASE_URL;
  if (!connectionString) {
    throw new Error('FPV_DATABASE_URL is required (or use --print-sql).');
  }
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query(UPSERT_SQL, [name, email, passwordHash, ROLE]);
    console.log(`SUCCESS: "${email}" is now ${ROLE} (id ${result.rows[0].id}).`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('create-super-admin failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
