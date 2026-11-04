
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg


const usarSSL = process.env.DB_SSL === 'true'

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',

  port: Number(process.env.DB_PORT || 5432),

  database: process.env.DB_NAME,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,


  ssl: usarSSL
    ? {
        rejectUnauthorized: true
      }
    : false,

  max: 5,

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 10000
})

pool.on('error', (error) => {
  console.error(
    'Erro inesperado na conexão com o PostgreSQL:',
    error.message
  )
})

export default pool
