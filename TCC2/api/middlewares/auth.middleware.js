
import jwt from 'jsonwebtoken'
import pool from '../database.js'

export async function autenticar(req, res, next) {
  try {
    const authorization = req.headers.authorization

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não informado.'
      })
    }

    const token = authorization.slice(7).trim()

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    )

    const result = await pool.query(
      `
      SELECT id, nome, email, perfil, ativo
      FROM usuarios
      WHERE id = $1
      LIMIT 1
      `,
      [decoded.id]
    )

    const usuario = result.rows[0]

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário inexistente ou inativo.'
      })
    }

    req.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }

    next()
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida ou expirada.'
      })
    }

    console.error('Erro de autenticação:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao validar autenticação.'
    })
  }
}

export function permitirPerfis(...perfis) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado.'
      })
    }

    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({
        success: false,
        message: 'Você não possui permissão para esta operação.'
      })
    }

    next()
  }
}
