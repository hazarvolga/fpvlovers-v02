import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  const isLocal = process.argv.includes('--local');
  
  let pool: Pool;
  
  if (isLocal) {
    console.log('Connecting strictly to LOCAL PostgreSQL at localhost:5432...');
    pool = new Pool({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
      connectionTimeoutMillis: 5000,
    });
  } else {
    loadEnvLocal();
    let connectionString = process.env.FPV_DATABASE_URL;
    if (connectionString && connectionString.includes('yo4kkoc08kgw080k404w440w')) {
      console.log('Resolving internal hostname to public IP 80.225.231.62...');
      connectionString = connectionString.replace('yo4kkoc08kgw080k404w440w', '80.225.231.62');
    }

    if (connectionString) {
      console.log('Connecting via FPV_DATABASE_URL connection string...');
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
      });
    } else {
      console.log('Connecting via host parameters...');
      pool = new Pool({
        host: '80.225.231.62',
        port: 5432,
        user: 'postgres',
        password: process.env.DB_PASSWORD || 'difyai123456',
        database: 'postgres',
        connectionTimeoutMillis: 5000,
      });
    }
  }

  const email = 'hazarvolga@gmail.com';
  const password = 'Vol?*187';
  const name = 'Hazar Volga';
  const role = 'super_admin';

  try {
    console.log('Generating secure bcrypt hash for the super admin password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('Password hash generated successfully.');

    // Check if the user already exists
    console.log(`Checking if user "${email}" exists in the fpvlovers_app.users table...`);
    const checkRes = await pool.query(
      'SELECT id, email, role FROM fpvlovers_app.users WHERE email = $1',
      [email]
    );

    if (checkRes.rows.length > 0) {
      const existingUser = checkRes.rows[0];
      console.log(`User exists with ID: ${existingUser.id}. Updating password hash and promoting to "${role}"...`);
      
      await pool.query(
        'UPDATE fpvlovers_app.users SET password_hash = $1, role = $2, name = $3, updated_at = NOW() WHERE email = $4',
        [passwordHash, role, name, email]
      );
      
      console.log(`SUCCESS: User "${email}" updated to "${role}".`);
    } else {
      console.log(`User does not exist. Creating new "${role}" user...`);
      
      const insertRes = await pool.query(
        `INSERT INTO fpvlovers_app.users (name, email, password_hash, role, email_verified) 
         VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
        [name, email, passwordHash, role]
      );
      
      console.log(`SUCCESS: Created new "${role}" user with ID: ${insertRes.rows[0].id}`);
    }

  } catch (error) {
    console.error('CRITICAL: Database operation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database pool closed.');
  }
}

main();
