import express from 'express'
import pool from '../database.js'

const router = express.Router()

// ======================================================
// GET /api/motivos
// Lista somente motivos ativos
// Usado principalmente na tela de justificativa
// ======================================================

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id,
        descricao,
        ativo,
        criado_em
      FROM motivos_parada
      WHERE ativo = true
      ORDER BY descricao ASC
    `)

    return res.json({
      success: true,
      data: resultado.rows
    })
  } catch (error) {
    console.error('Erro ao buscar motivos:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar motivos de parada.'
    })
  }
})

// ======================================================
// GET /api/motivos/todos
// Lista ativos e inativos
// Usado na administração dos motivos
// ======================================================

router.get('/todos', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id,
        descricao,
        ativo,
        criado_em
      FROM motivos_parada
      ORDER BY descricao ASC
    `)

    return res.json({
      success: true,
      total: resultado.rowCount,
      data: resultado.rows
    })
  } catch (error) {
    console.error('Erro ao buscar todos os motivos:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar os motivos de parada.'
    })
  }
})

// ======================================================
// POST /api/motivos
// Cadastra um novo motivo
// ======================================================

router.post('/', async (req, res) => {
  try {
    const descricao = String(req.body.descricao || '').trim()

    if (!descricao) {
      return res.status(400).json({
        success: false,
        message: 'Informe a descrição do motivo.'
      })
    }

    // Evita motivos duplicados, ignorando maiúsculas/minúsculas
    const existente = await pool.query(
      `
        SELECT id
        FROM motivos_parada
        WHERE LOWER(descricao) = LOWER($1)
        LIMIT 1
      `,
      [descricao]
    )

    if (existente.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um motivo com essa descrição.'
      })
    }

    const resultado = await pool.query(
      `
        INSERT INTO motivos_parada (
          descricao,
          ativo
        )
        VALUES ($1, true)
        RETURNING
          id,
          descricao,
          ativo,
          criado_em
      `,
      [descricao]
    )

    return res.status(201).json({
      success: true,
      message: 'Motivo cadastrado com sucesso.',
      data: resultado.rows[0]
    })
  } catch (error) {
    console.error('Erro ao cadastrar motivo:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar motivo de parada.'
    })
  }
})

// ======================================================
// PUT /api/motivos/:id
// Altera a descrição de um motivo
// ======================================================

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const descricao = String(req.body.descricao || '').trim()

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID do motivo inválido.'
      })
    }

    if (!descricao) {
      return res.status(400).json({
        success: false,
        message: 'Informe a descrição do motivo.'
      })
    }

    // Verifica se outro motivo já possui essa descrição
    const duplicado = await pool.query(
      `
        SELECT id
        FROM motivos_parada
        WHERE LOWER(descricao) = LOWER($1)
          AND id <> $2
        LIMIT 1
      `,
      [descricao, id]
    )

    if (duplicado.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Já existe outro motivo com essa descrição.'
      })
    }

    const resultado = await pool.query(
      `
        UPDATE motivos_parada
        SET descricao = $1
        WHERE id = $2
        RETURNING
          id,
          descricao,
          ativo,
          criado_em
      `,
      [descricao, id]
    )

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Motivo não encontrado.'
      })
    }

    return res.json({
      success: true,
      message: 'Motivo atualizado com sucesso.',
      data: resultado.rows[0]
    })
  } catch (error) {
    console.error('Erro ao atualizar motivo:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar motivo de parada.'
    })
  }
})

// ======================================================
// PATCH /api/motivos/:id/status
// Ativa ou desativa um motivo
// ======================================================

router.patch('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { ativo } = req.body

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID do motivo inválido.'
      })
    }

    if (typeof ativo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'O campo ativo deve ser verdadeiro ou falso.'
      })
    }

    const resultado = await pool.query(
      `
        UPDATE motivos_parada
        SET ativo = $1
        WHERE id = $2
        RETURNING
          id,
          descricao,
          ativo,
          criado_em
      `,
      [ativo, id]
    )

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Motivo não encontrado.'
      })
    }

    return res.json({
      success: true,
      message: ativo
        ? 'Motivo ativado com sucesso.'
        : 'Motivo desativado com sucesso.',
      data: resultado.rows[0]
    })
  } catch (error) {
    console.error('Erro ao alterar status do motivo:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao alterar o status do motivo.'
    })
  }
})

export default router