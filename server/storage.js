export const SCHEMA = `CREATE TABLE IF NOT EXISTS huisrapport_interest (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 payload TEXT NOT NULL
)`;
// Keep the existing handler's storage contract; only its storage adapter changes.
export function mysqlBucket(pool) {
 return {
  async put(key, value) {
   const id = key.slice(9, -5);
   await pool.execute('INSERT INTO huisrapport_interest (id, payload) VALUES (?, ?) ON DUPLICATE KEY UPDATE payload = ?', [id, value, value]);
  },
  async list({cursor, limit = 1000}) {
   const [rows] = await pool.execute('SELECT id FROM huisrapport_interest WHERE id > ? ORDER BY id LIMIT ?', [cursor || '', Math.min(limit, 1000) + 1]);
   const page = rows.slice(0, limit);
   return {objects:page.map(row=>({key:`interest/${row.id}.json`})),truncated:rows.length>limit,cursor:page.at(-1)?.id};
  },
  async get(key) {
   const [rows] = await pool.execute('SELECT payload FROM huisrapport_interest WHERE id = ?', [key.slice(9, -5)]);
   return rows.length ? {json:async()=>JSON.parse(rows[0].payload)} : null;
  }
 };
}
export async function databasePool(env = process.env) {
 if (!env.DB_HOST || !env.DB_NAME || !env.DB_USER || !env.DB_PASSWORD) return null;
 const {default:mysql} = await import('mysql2/promise');
 return mysql.createPool({host:env.DB_HOST,port:Number(env.DB_PORT || 3306),database:env.DB_NAME,user:env.DB_USER,password:env.DB_PASSWORD,timezone:'Z',connectionLimit:5,waitForConnections:true,queueLimit:25,connectTimeout:5000,
  ...(env.DB_SSL === 'true' ? {ssl:{rejectUnauthorized:true}} : {})});
}

export async function initializeDatabase(pool) {
 const {HISTORY_SCHEMA}=await import('./history.js');
 await pool.execute(SCHEMA);
 await pool.execute(HISTORY_SCHEMA);
}
