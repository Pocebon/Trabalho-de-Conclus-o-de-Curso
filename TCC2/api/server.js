
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import pool from './database.js'

import authRoutes from './routes/auth.routes.js'
import motivosRoutes from './routes/motivos.routes.js'
import paradasRoutes from './routes/paradas.routes.js'
import operadoresRoutes from './routes/operadores.routes.js'

dotenv.config()

const app = express()

const PORT = Number(
  process.env.PORT || process.env.API_PORT || 3000
)

const HOST = process.env.API_HOST || '0.0.0.0'

const localOrigins = [
  'http://localhost:9000',
  'http://127.0.0.1:9000',
  'http://localhost:9001',
  'http://127.0.0.1:9001',
  'http://localhost:9300',
  'http://127.0.0.1:9300'
]

const extraOrigins = (
  process.env.CORS_ORIGINS || ''
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const allowedOrigins = [
  ...localOrigins,
  ...extraOrigins
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(
      new Error('Origem não permitida pelo CORS')
    )
  },
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}))

app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/motivos', motivosRoutes)

app.use('/api/paradas', paradasRoutes)

app.use('/api/operadores', operadoresRoutes)

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT NOW() AS agora'
    )

    return res.status(200).json({
      success: true,
      message: 'API funcionando e banco conectado.',
      databaseTime: result.rows[0].agora
    })
  } catch (error) {
    console.error(
      'Erro ao conectar ao banco:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'API funcionando, mas ocorreu erro na conexão com o banco.'
    })
  }
})

app.use((err, req, res, next) => {
  if (err.message === 'Origem não permitida pelo CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origem não autorizada.'
    })
  }

  console.error('Erro na API:', err)

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor.'
  })
})

app.listen(PORT, HOST, () => {
  console.log('')
  console.log('================================')
  console.log('API DO TCC INICIADA')
  console.log('================================')
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Host: ${HOST}`)
  console.log(`Porta: ${PORT}`)
  console.log('')
  console.log('Rotas disponíveis:')
  console.log('/api/health')
  console.log('/api/auth')
  console.log('/api/motivos')
  console.log('/api/paradas')
  console.log('/api/operadores')
  console.log('================================')
})