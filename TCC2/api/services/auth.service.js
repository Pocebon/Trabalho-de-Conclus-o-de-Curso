
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../database.js'


function criarErro(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export async function autenticarUsuario({
  email,
  senha
}) {


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
    throw criarErro(
      'E-mail ou senha inválidos.',
      401
    )
  }

  if (!['gestor', 'operador'].includes(usuario.perfil)) {
    throw criarErro(
      'Perfil de usuário não autorizado.',
      403
    )
  }


  const senhaValida = await bcrypt.compare(
    senha,
    usuario.senha
  )

  if (!senhaValida) {
    throw criarErro(
      'E-mail ou senha inválidos.',
      401
    )
  }

  const token = jwt.sign(
    {
      id: usuario.id
    },
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

  return {
    user,
    token
  }
}
