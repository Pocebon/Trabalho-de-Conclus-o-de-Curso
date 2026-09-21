import express from 'express'

import pool from '../database.js'

const router = express.Router()

router.get(
  '/',
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            descricao
          FROM motivos_parada
          WHERE ativo = TRUE
          ORDER BY descricao
          `
        )

      console.log('')
      console.log(
        'Motivos de parada consultados pela API.'
      )

      return res
        .status(200)
        .json({
          success: true,
          data: result.rows
        })
    } catch (error) {
      console.error(
        'Erro ao buscar motivos de parada:',
        error
      )

      return res
        .status(500)
        .json({
          success: false,
          message:
            'Não foi possível buscar os motivos de parada.'
        })
    }
  }
)

export default router