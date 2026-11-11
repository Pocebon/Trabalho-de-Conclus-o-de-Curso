
import * as operadoresService from '../services/operadores.service.js'

function validarId(valor) {
  const id = Number(valor)

  return Number.isInteger(id) && id > 0
    ? id
    : null
}

function validarSenha(senha) {
  return typeof senha === 'string' &&
    senha.length >= 8 &&
    senha.length <= 72
}

function tratarErro(res, error) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    })
  }

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


export async function listarOperadores(req, res) {
  try {
    const resultado = await operadoresService.listarOperadores()

    return res.json({
      success: true,
      total: resultado.total,
      data: resultado.data
    })

  } catch (error) {
    return tratarErro(res, error)
  }
}


export async function cadastrarOperador(req, res) {
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

    const operador = await operadoresService.cadastrarOperador({
      nome,
      email,
      senha
    })

    return res.status(201).json({
      success: true,
      message: 'Operador cadastrado com sucesso.',
      data: operador
    })

  } catch (error) {
    return tratarErro(res, error)
  }
}


export async function atualizarOperador(req, res) {
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

    const operador = await operadoresService.atualizarOperador({
      id,
      nome,
      email
    })

    return res.json({
      success: true,
      message: 'Operador atualizado com sucesso.',
      data: operador
    })

  } catch (error) {
    return tratarErro(res, error)
  }
}


export async function alterarStatusOperador(req, res) {
  try {
    const id = validarId(req.params.id)
    const { ativo } = req.body || {}

    if (!id || typeof ativo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'ID ou situação inválida.'
      })
    }

    const operador = await operadoresService.alterarStatusOperador({
      id,
      ativo
    })

    return res.json({
      success: true,
      message: ativo
        ? 'Operador ativado com sucesso.'
        : 'Operador inativado com sucesso.',
      data: operador
    })

  } catch (error) {
    return tratarErro(res, error)
  }
}

export async function redefinirSenhaOperador(req, res) {
  try {
    const id = validarId(req.params.id)
    const senha = req.body?.senha

    if (!id || !validarSenha(senha)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido ou senha fora do limite de 8 a 72 caracteres.'
      })
    }

    const operador = await operadoresService.redefinirSenhaOperador({
      id,
      senha
    })

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso.',
      data: operador
    })

  } catch (error) {
    return tratarErro(res, error)
  }
}