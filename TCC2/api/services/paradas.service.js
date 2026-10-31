
import pool from '../database.js'


function criarErro(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export async function listarParadas() {
  const result = await pool.query(`
    SELECT
      p.id,
      p.inicio,
      p.fim,
      p.duracao_segundos,
      p.justificada,

      u.id AS operador_id,
      u.nome AS operador,

      o.id AS ocorrencia_id,
      o.observacao,
      o.registrado_em,

      m.id AS motivo_id,
      m.descricao AS motivo

    FROM paradas p

    LEFT JOIN usuarios u
      ON u.id = p.operador_id

    LEFT JOIN ocorrencias o
      ON o.parada_id = p.id

    LEFT JOIN motivos_parada m
      ON m.id = o.motivo_id

    ORDER BY p.inicio DESC
  `)

  return result.rows.map(parada => ({
    id: parada.id,
    inicio: parada.inicio,
    fim: parada.fim,
    duracaoSegundos: parada.duracao_segundos,
    justificada: parada.justificada,

    operador: {
      id: parada.operador_id,
      nome: parada.operador
    },

    motivo: parada.motivo
      ? {
          id: parada.motivo_id,
          descricao: parada.motivo
        }
      : null,

    observacao: parada.observacao,
    registradoEm: parada.registrado_em
  }))
}

export async function criarParada({
  inicio,
  operadorId
}) {
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
    throw criarErro(
      'Operador inválido ou inativo.',
      400
    )
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
    [
      inicio,
      operadorId
    ]
  )

  return result.rows[0]
}

export async function registrarJustificativa({
  paradaId,
  usuarioId,
  motivoId,
  observacao
}) {
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
      [usuarioId]
    )

    if (usuarioResult.rows.length === 0) {
      throw criarErro(
        'Apenas operadores ativos podem justificar paradas.',
        403
      )
    }

    const paradaResult = await client.query(
      `
        SELECT
          id,
          justificada
        FROM paradas
        WHERE id = $1
        FOR UPDATE
      `,
      [paradaId]
    )

    if (paradaResult.rows.length === 0) {
      throw criarErro(
        'Parada não encontrada.',
        404
      )
    }

    if (paradaResult.rows[0].justificada) {
      throw criarErro(
        'Esta parada já foi justificada.',
        409
      )
    }

    const motivoResult = await client.query(
      `
        SELECT id
        FROM motivos_parada
        WHERE id = $1
          AND ativo = TRUE
        LIMIT 1
      `,
      [motivoId]
    )

    if (motivoResult.rows.length === 0) {
      throw criarErro(
        'Motivo de parada inválido ou inativo.',
        400
      )
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
        usuarioId,
        motivoId,
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

    return ocorrenciaResult.rows[0]
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

    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

export async function finalizarParada({
  paradaId,
  fim,
  duracaoSegundos
}) {
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
    throw criarErro(
      'Parada não encontrada, já finalizada ou com horário de fim inválido.',
      409
    )
  }

  return result.rows[0]
}