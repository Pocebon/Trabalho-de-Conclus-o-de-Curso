
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const certificado = fs.readFileSync(
  path.join(__dirname, 'certs', 'prod-ca-2021.crt'),
  'utf8'
)

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: {
    ca: certificado,
    rejectUnauthorized: true
  },

  connectionTimeoutMillis: 15000
})

export default pool
