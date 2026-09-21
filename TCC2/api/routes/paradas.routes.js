
import express from 'express'
import pool from '../database.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { inicio, operadorId } = req.body

    if (!inicio || !operadorId) {
      return res.status(400).json({
        success: false,
        message: 'Início e operador são obrigatórios.'
      })
    }

    const operador = await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE id = $1
        AND perfil = 'operador'
        AND ativo = TRUE
      LIMIT 1
      `,
      [operadorId]
    )

    if (operador.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Operador inválido ou inativo.'
      })
    }

    const result = await pool.query(
      `
      INSERT INTO paradas (
        inicio,
        justificada,
        operador_id
      )
      VALUES (
        $1::timestamp,
        FALSE,
        $2
      )
      RETURNING *
      `,
      [inicio, operadorId]
    )

    const parada = result.rows[0]

    console.log('')
    console.log('Parada criada pela API:')
    console.log(parada)

    return res.status(201).json({
      success: true,
      message: 'Parada criada com sucesso.',
      data: parada
    })
  } catch (error) {
    console.error(
      'Erro ao criar parada pela API:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Não foi possível criar a parada.'
    })
  }
})

router.post('/:id/ocorrencias', async (req, res) => {
  const paradaId = Number(req.params.id)

  const {
    usuarioId,
    motivoId,
    observacao
  } = req.body

  if (
    !Number.isInteger(paradaId) ||
    paradaId <= 0 ||
    !Number.isInteger(Number(usuarioId)) ||
    Number(usuarioId) <= 0 ||
    !Number.isInteger(Number(motivoId)) ||
    Number(motivoId) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Parada, usuário e motivo válidos são obrigatórios.'
    })
  }

  let client

  try {
    client = await pool.connect()

    await client.query('BEGIN')

    const usuarioResult = await client.query(
      `
      SELECT id
      FROM usuarios
      WHERE id = $1
        AND perfil = 'operador'
        AND ativo = TRUE
      LIMIT 1
      `,
      [Number(usuarioId)]
    )

    if (usuarioResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return res.status(403).json({
        success: false,
        message:
          'Apenas operadores ativos podem justificar paradas.'
      })
    }

    const paradaResult = await client.query(
      `
      SELECT id, justificada
      FROM paradas
      WHERE id = $1
      FOR UPDATE
      `,
      [paradaId]
    )

    if (paradaResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'Parada não encontrada.'
      })
    }

    if (paradaResult.rows[0].justificada) {
      await client.query('ROLLBACK')

      return res.status(409).json({
        success: false,
        message: 'Esta parada já foi justificada.'
      })
    }

    const motivoResult = await client.query(
      `
      SELECT id
      FROM motivos_parada
      WHERE id = $1
        AND ativo = TRUE
      LIMIT 1
      `,
      [Number(motivoId)]
    )

    if (motivoResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'Motivo de parada inválido ou inativo.'
      })
    }

    const ocorrenciaResult = await client.query(
      `
      INSERT INTO ocorrencias (
        parada_id,
        usuario_id,
        motivo_id,
        observacao
      )
      VALUES (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING *
      `,
      [
        paradaId,
        Number(usuarioId),
        Number(motivoId),
        typeof observacao === 'string'
          ? observacao.trim() || null
          : null
      ]
    )

    await client.query(
      `
      UPDATE paradas
      SET justificada = TRUE
      WHERE id = $1
      `,
      [paradaId]
    )

    await client.query('COMMIT')

    const ocorrencia = ocorrenciaResult.rows[0]

    console.log('')
    console.log('Ocorrência registrada pela API:')
    console.log(ocorrencia)

    return res.status(201).json({
      success: true,
      message: 'Justificativa registrada com sucesso.',
      data: ocorrencia
    })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error(
          'Erro ao desfazer transação:',
          rollbackError
        )
      }
    }

    console.error(
      'Erro ao registrar justificativa:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Não foi possível registrar a justificativa.'
    })
  } finally {
    if (client) {
      client.release()
    }
  }
})

router.patch('/:id/finalizar', async (req, res) => {
  const paradaId = Number(req.params.id)

  const {
    fim,
    duracaoSegundos
  } = req.body

  if (
    !Number.isInteger(paradaId) ||
    paradaId <= 0 ||
    typeof fim !== 'string' ||
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(fim) ||
    !Number.isInteger(duracaoSegundos) ||
    duracaoSegundos < 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Parada, horário de fim e duração válidos são obrigatórios.'
    })
  }

  try {
    const result = await pool.query(
      `
      UPDATE paradas
      SET
        fim = $1::timestamp,
        duracao_segundos = $2
      WHERE id = $3
        AND fim IS NULL
        AND $1::timestamp >= inicio
      RETURNING *
      `,
      [
        fim,
        duracaoSegundos,
        paradaId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message:
          'Parada não encontrada, já finalizada ou com horário de fim inválido.'
      })
    }

    const parada = result.rows[0]

    console.log('')
    console.log('================================')
    console.log('PARADA FINALIZADA PELA API')
    console.log('ID:', parada.id)
    console.log('Início:', parada.inicio)
    console.log('Fim:', parada.fim)
    console.log(
      'Duração:',
      parada.duracao_segundos,
      'segundos'
    )
    console.log('================================')

    return res.status(200).json({
      success: true,
      message: 'Parada finalizada com sucesso.',
      data: parada
    })
  } catch (error) {
    console.error(
      'Erro ao finalizar parada pela API:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Não foi possível finalizar a parada.'
    })
  }
})

export default router