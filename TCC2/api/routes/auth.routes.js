
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../database.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()

    const senha = req.body?.senha

    if (!email || typeof senha !== 'string' || !senha) {
      return res.status(400).json({
        success: false,
        message: 'E-mail e senha são obrigatórios.'
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado.')

      return res.status(500).json({
        success: false,
        message: 'Autenticação indisponível.'
      })
    }

    const result = await pool.query(
      `
      SELECT
        id,
        nome,
        email,
        senha,
        perfil,
        ativo
      FROM usuarios
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    )

    const usuario = result.rows[0]

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        success: false,
        message: 'E-mail ou senha inválidos.'
      })
    }

    if (!['gestor', 'operador'].includes(usuario.perfil)) {
      return res.status(403).json({
        success: false,
        message: 'Perfil de usuário não autorizado.'
      })
    }

    // A senha precisa estar armazenada como hash bcrypt.
    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha
    )

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'E-mail ou senha inválidos.'
      })
    }

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h',
        algorithm: 'HS256'
      }
    )

    const user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso.',
      user,
      token
    })
  } catch (error) {
    console.error('Erro no login:', error)

    return res.status(500).json({
      success: false,
      message: 'Não foi possível realizar o login.'
    })
  }
})

export default router
