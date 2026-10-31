
import pool from '../database.js'

function criarErro(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export async function listarMotivosAtivos() {
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

  return resultado.rows
}

export async function listarTodosMotivos() {
  const resultado = await pool.query(`
    SELECT
      id,
      descricao,
      ativo,
      criado_em
    FROM motivos_parada
    ORDER BY descricao ASC
  `)

  return {
    total: resultado.rowCount,
    data: resultado.rows
  }
}

export async function cadastrarMotivo(descricao) {


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
    throw criarErro(
      'Já existe um motivo com essa descrição.',
      409
    )
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

  return resultado.rows[0]
}

export async function atualizarMotivo(id, descricao) {

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
    throw criarErro(
      'Já existe outro motivo com essa descrição.',
      409
    )
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
    throw criarErro(
      'Motivo não encontrado.',
      404
    )
  }

  return resultado.rows[0]
}

export async function alterarStatusMotivo(id, ativo) {

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
    throw criarErro(
      'Motivo não encontrado.',
      404
    )
  }

  return resultado.rows[0]
}