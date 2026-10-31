
import bcrypt from 'bcrypt'
import pool from '../database.js'

const campos = `
  id, nome, email, perfil, ativo, criado_em
`

function criarErro(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode

  return error
}

export async function listarOperadores() {
  const result = await pool.query(`
    SELECT ${campos}
    FROM usuarios
    WHERE perfil = 'operador'
    ORDER BY nome ASC
  `)

  return {
    total: result.rowCount,
    data: result.rows
  }
}

export async function cadastrarOperador({
  nome,
  email,
  senha
}) {

  const existente = await pool.query(
    `
      SELECT id
      FROM usuarios
      WHERE LOWER(email) = $1
    `,
    [email]
  )

  if (existente.rowCount > 0) {
    throw criarErro(
      'Este e-mail já está cadastrado.',
      409
    )
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

  return result.rows[0]
}


export async function atualizarOperador({
  id,
  nome,
  email
}) {


  const duplicado = await pool.query(
    `
      SELECT id
      FROM usuarios
      WHERE LOWER(email) = $1
        AND id <> $2
    `,
    [email, id]
  )

  if (duplicado.rowCount > 0) {
    throw criarErro(
      'E-mail já utilizado por outro usuário.',
      409
    )
  }


  const result = await pool.query(
    `
      UPDATE usuarios
      SET
        nome = $1,
        email = $2
      WHERE id = $3
        AND perfil = 'operador'
      RETURNING ${campos}
    `,
    [nome, email, id]
  )

  if (!result.rowCount) {
    throw criarErro(
      'Operador não encontrado.',
      404
    )
  }

  return result.rows[0]
}

export async function alterarStatusOperador({
  id,
  ativo
}) {

  const result = await pool.query(
    `
      UPDATE usuarios
      SET ativo = $1
      WHERE id = $2
        AND perfil = 'operador'
      RETURNING ${campos}
    `,
    [ativo, id]
  )

  if (!result.rowCount) {
    throw criarErro(
      'Operador não encontrado.',
      404
    )
  }

  return result.rows[0]
}

export async function redefinirSenhaOperador({
  id,
  senha
}) {


  const hash = await bcrypt.hash(senha, 12)

  const result = await pool.query(
    `
      UPDATE usuarios
      SET senha = $1
      WHERE id = $2
        AND perfil = 'operador'
      RETURNING ${campos}
    `,
    [hash, id]
  )

  if (!result.rowCount) {
    throw criarErro(
      'Operador não encontrado.',
      404
    )
  }

  return result.rows[0]
}