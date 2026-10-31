
import * as motivosService from '../services/motivos.service.js'

export async function listarMotivosAtivos(req, res) {
  try {
    const motivos = await motivosService.listarMotivosAtivos()

    return res.json({
      success: true,
      data: motivos
    })
  } catch (error) {
    console.error('Erro ao buscar motivos:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar motivos de parada.'
    })
  }
}

export async function listarTodosMotivos(req, res) {
  try {
    const resultado = await motivosService.listarTodosMotivos()

    return res.json({
      success: true,
      total: resultado.total,
      data: resultado.data
    })
  } catch (error) {
    console.error('Erro ao buscar todos os motivos:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar os motivos de parada.'
    })
  }
}

export async function cadastrarMotivo(req, res) {
  try {
    const descricao = String(req.body.descricao || '').trim()

    if (!descricao) {
      return res.status(400).json({
        success: false,
        message: 'Informe a descrição do motivo.'
      })
    }

    const motivo = await motivosService.cadastrarMotivo(descricao)

    return res.status(201).json({
      success: true,
      message: 'Motivo cadastrado com sucesso.',
      data: motivo
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    console.error('Erro ao cadastrar motivo:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar motivo de parada.'
    })
  }
}

export async function atualizarMotivo(req, res) {
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

    const motivo = await motivosService.atualizarMotivo(
      id,
      descricao
    )

    return res.json({
      success: true,
      message: 'Motivo atualizado com sucesso.',
      data: motivo
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    console.error('Erro ao atualizar motivo:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar motivo de parada.'
    })
  }
}

export async function alterarStatusMotivo(req, res) {
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

    const motivo = await motivosService.alterarStatusMotivo(
      id,
      ativo
    )

    return res.json({
      success: true,
      message: ativo
        ? 'Motivo ativado com sucesso.'
        : 'Motivo desativado com sucesso.',
      data: motivo
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    console.error('Erro ao alterar status do motivo:', error)

    return res.status(500).json({
      success: false,
      message: 'Erro ao alterar o status do motivo.'
    })
  }
}