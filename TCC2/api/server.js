
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import pool from './database.js'

import authRoutes from './routes/auth.routes.js'
import motivosRoutes from './routes/motivos.routes.js'
import paradasRoutes from './routes/paradas.routes.js'

dotenv.config()

const app = express()

const PORT = process.env.API_PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/motivos', motivosRoutes)

app.use('/api/paradas', paradasRoutes)

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
      message:
        'API funcionando, mas ocorreu erro na conexão com o banco.'
    })
  }
})

app.listen(PORT, () => {
  console.log('')
  console.log('================================')
  console.log('API DO TCC INICIADA')
  console.log(`Porta: ${PORT}`)
  console.log(
    `Health: http://localhost:${PORT}/api/health`
  )
  console.log(
    `Motivos: http://localhost:${PORT}/api/motivos`
  )
  console.log(
    `Criar parada: POST http://localhost:${PORT}/api/paradas`
  )
  console.log('================================')
})