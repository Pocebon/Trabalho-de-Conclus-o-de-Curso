
import express from 'express'
import bcrypt from 'bcrypt'
import pool from '../database.js'

import {
  autenticar,
  permitirPerfis
} from '../middlewares/auth.middleware.js'

const router = express.Router()

// Todas as operações exigem login de gestor.
router.use(autenticar, permitirPerfis('gestor'))

const campos = `
  id, nome, email, perfil, ativo, criado_em
`

function validarId(valor) {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

function validarSenha(senha) {
  return typeof senha === 'string' &&
    senha.length >= 8 &&
    senha.length <= 72
}

function tratarErro(res, error) {
  console.error('Erro ao gerenciar operadores:', error)

  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Este e-mail já está cadastrado.'
    })
  }

  return res.status(500).json({
    success: false,
    message: 'Erro interno ao gerenciar operadores.'
  })
}

// GET /api/operadores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ${campos}
      FROM usuarios
      WHERE perfil = 'operador'
      ORDER BY nome ASC
    `)

    return res.json({
      success: true,
      total: result.rowCount,
      data: result.rows
    })
  } catch (error) {
    return tratarErro(res, error)
  }
})

// POST /api/operadores
router.post('/', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim()
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()
    const senha = req.body?.senha

    if (!nome || nome.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Informe um nome válido.'
      })
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Informe um e-mail válido.'
      })
    }

    if (!validarSenha(senha)) {
      return res.status(400).json({
        success: false,
        message: 'A senha precisa ter entre 8 e 72 caracteres.'
      })
    }

    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE LOWER(email) = $1',
      [email]
    )

    if (existente.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Este e-mail já está cadastrado.'
      })
    }

    const hash = await bcrypt.hash(senha, 12)

    const result = await pool.query(
      `
      INSERT INTO usuarios
        (nome, email, senha, perfil, ativo)
      VALUES ($1, $2, $3, 'operador', TRUE)
      RETURNING ${campos}
      `,
      [nome, email, hash]
    )

    return res.status(201).json({
      success: true,
      message: 'Operador cadastrado com sucesso.',
      data: result.rows[0]
    })
  } catch (error) {
    return tratarErro(res, error)
  }
})

// PUT /api/operadores/:id
router.put('/:id', async (req, res) => {
  try {
    const id = validarId(req.params.id)
    const nome = String(req.body?.nome || '').trim()
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()

    if (!id || !nome || nome.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'ID ou nome inválido.'
      })
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'E-mail inválido.'
      })
    }

    const duplicado = await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE LOWER(email) = $1 AND id <> $2
      `,
      [email, id]
    )

    if (duplicado.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'E-mail já utilizado por outro usuário.'
      })
    }

    const result = await pool.query(
      `
      UPDATE usuarios
      SET nome = $1, email = $2
      WHERE id = $3 AND perfil = 'operador'
      RETURNING ${campos}
      `,
      [nome, email, id]
    )

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Operador não encontrado.'
      })
    }

    return res.json({
      success: true,
      message: 'Operador atualizado com sucesso.',
      data: result.rows[0]
    })
  } catch (error) {
    return tratarErro(res, error)
  }
})

// PATCH /api/operadores/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const id = validarId(req.params.id)
    const { ativo } = req.body || {}

    if (!id || typeof ativo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'ID ou situação inválida.'
      })
    }

    const result = await pool.query(
      `
      UPDATE usuarios
      SET ativo = $1
      WHERE id = $2 AND perfil = 'operador'
      RETURNING ${campos}
      `,
      [ativo, id]
    )

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Operador não encontrado.'
      })
    }

    return res.json({
      success: true,
      message: ativo
        ? 'Operador ativado com sucesso.'
        : 'Operador inativado com sucesso.',
      data: result.rows[0]
    })
  } catch (error) {
    return tratarErro(res, error)
  }
})

// PATCH /api/operadores/:id/senha
router.patch('/:id/senha', async (req, res) => {
  try {
    const id = validarId(req.params.id)
    const senha = req.body?.senha

    if (!id || !validarSenha(senha)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido ou senha fora do limite de 8 a 72 caracteres.'
      })
    }

    const hash = await bcrypt.hash(senha, 12)

    const result = await pool.query(
      `
      UPDATE usuarios
      SET senha = $1
      WHERE id = $2 AND perfil = 'operador'
      RETURNING ${campos}
      `,
      [hash, id]
    )

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Operador não encontrado.'
      })
    }

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso.',
      data: result.rows[0]
    })
  } catch (error) {
    return tratarErro(res, error)
  }
})

export default router
