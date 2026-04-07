import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function initDb(): Promise<void> {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT UNIQUE NOT NULL,
      auth TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export interface SubRow {
  endpoint: string;
  auth: string;
  p256dh: string;
}

export async function saveSubscription(sub: SubRow): Promise<void> {
  await initDb();
  await getPool().query(
    `INSERT INTO push_subscriptions (endpoint, auth, p256dh)
     VALUES ($1, $2, $3)
     ON CONFLICT (endpoint) DO UPDATE SET auth=$2, p256dh=$3`,
    [sub.endpoint, sub.auth, sub.p256dh]
  );
}

export async function getSubscriptions(): Promise<SubRow[]> {
  await initDb();
  const result = await getPool().query('SELECT endpoint, auth, p256dh FROM push_subscriptions');
  return result.rows;
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await getPool().query('DELETE FROM push_subscriptions WHERE endpoint=$1', [endpoint]);
}
