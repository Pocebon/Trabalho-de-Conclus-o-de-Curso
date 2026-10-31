
import { autenticarUsuario } from '../services/auth.service.js'

export async function login(req, res) {
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

    const resultado = await autenticarUsuario({
      email,
      senha
    })

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso.',
      user: resultado.user,
      token: resultado.token
    })

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    console.error('Erro no login:', error)

    return res.status(500).json({
      success: false,
      message: 'Não foi possível realizar o login.'
    })
  }
}