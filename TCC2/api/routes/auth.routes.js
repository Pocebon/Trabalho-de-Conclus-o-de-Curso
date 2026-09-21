import express from 'express'

import pool from '../database.js'

const router = express.Router()

router.post(
  '/login',
  async (req, res) => {
    try {
      const {
        email,
        senha
      } = req.body

      // Validação básica
      if (!email || !senha) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              'E-mail e senha são obrigatórios.'
          })
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            nome,
            email,
            perfil
          FROM usuarios
          WHERE LOWER(email) = LOWER($1)
            AND senha = $2
            AND ativo = TRUE
          LIMIT 1
          `,
          [
            email,
            senha
          ]
        )

      if (
        result.rows.length === 0
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              'E-mail ou senha inválidos.'
          })
      }

      const user =
        result.rows[0]

      console.log('')
      console.log(
        'Login realizado pela API:'
      )
      console.log(user)

      return res
        .status(200)
        .json({
          success: true,
          message:
            'Login realizado com sucesso.',
          user
        })
    } catch (error) {
      console.error(
        'Erro no login:',
        error
      )

      return res
        .status(500)
        .json({
          success: false,
          message:
            'Não foi possível realizar o login.'
        })
    }
  }
)

export default router