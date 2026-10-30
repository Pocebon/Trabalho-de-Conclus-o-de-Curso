
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

const PORT = process.env.API_PORT || 3000

// ============================================
// CONFIGURAÇÃO DO CORS
// ============================================

// Permite a comunicação do frontend Quasar
// com a API durante o desenvolvimento.
app.use(cors({
  origin: [
    'http://localhost:9000',
    'http://127.0.0.1:9000'
  ],
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

// Permite receber dados JSON
app.use(express.json())

// ============================================
// ROTAS DA API
// ============================================

// Autenticação
app.use('/api/auth', authRoutes)

// Funcionalidades existentes
app.use('/api/motivos', motivosRoutes)
app.use('/api/paradas', paradasRoutes)

// Gerenciamento exclusivo do gestor
app.use('/api/operadores', operadoresRoutes)

// ============================================
// VERIFICAÇÃO DA API E DO BANCO
// ============================================

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
    console.error('Erro ao conectar ao banco:', error)

    return res.status(500).json({
      success: false,
      message: 'API funcionando, mas ocorreu erro na conexão com o banco.'
    })
  }
})

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

app.listen(PORT, '127.0.0.1', () => {
  console.log('')
  console.log('================================')
  console.log('API DO TCC INICIADA')
  console.log(`Porta: ${PORT}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
  console.log(`Operadores: http://localhost:${PORT}/api/operadores`)
  console.log('================================')
})
