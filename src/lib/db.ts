import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sikaya',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = unknown>(sql: string, values?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, values)
  return rows as T[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryOne<T = unknown>(sql: string, values?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, values)
  return rows[0] ?? null
}

export default pool
