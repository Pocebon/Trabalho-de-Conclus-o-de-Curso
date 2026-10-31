
import * as paradasService from '../services/paradas.service.js'

export async function listarParadas(req, res) {
  try {
    const paradas = await paradasService.listarParadas()

    console.log('')
    console.log('Paradas consultadas pela API:', paradas.length)

    return res.status(200).json({
      success: true,
      total: paradas.length,
      data: paradas
    })
  } catch (error) {
    console.error('Erro ao consultar paradas:', error)

    return res.status(500).json({
      success: false,
      message: 'Não foi possível consultar as paradas.'
    })
  }
}


export async function criarParada(req, res) {
  try {
    const { inicio, operadorId } = req.body

    if (!inicio || !operadorId) {
      return res.status(400).json({
        success: false,
        message: 'Início e operador são obrigatórios.'
      })
    }

    const parada = await paradasService.criarParada({
      inicio,
      operadorId
    })

    console.log('')
    console.log('Parada criada pela API:')
    console.log(parada)

    return res.status(201).json({
      success: true,
      message: 'Parada criada com sucesso.',
      data: parada
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    console.error('Erro ao criar parada pela API:', error)

    return res.status(500).json({
      success: false,
      message: 'Não foi possível criar a parada.'
    })
  }
}

export async function registrarJustificativa(req, res) {
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
      message: 'Parada, usuário e motivo válidos são obrigatórios.'
    })
  }

  try {
    const ocorrencia = await paradasService.registrarJustificativa({
      paradaId,
      usuarioId: Number(usuarioId),
      motivoId: Number(motivoId),
      observacao
    })

    console.log('')
    console.log('Ocorrência registrada pela API:')
    console.log(ocorrencia)

    return res.status(201).json({
      success: true,
      message: 'Justificativa registrada com sucesso.',
      data: ocorrencia
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    console.error('Erro ao registrar justificativa:', error)

    return res.status(500).json({
      success: false,
      message: 'Não foi possível registrar a justificativa.'
    })
  }
}

export async function finalizarParada(req, res) {
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
      message: 'Parada, horário de fim e duração válidos são obrigatórios.'
    })
  }

  try {
    const parada = await paradasService.finalizarParada({
      paradaId,
      fim,
      duracaoSegundos
    })

    console.log('')
    console.log('================================')
    console.log('PARADA FINALIZADA PELA API')
    console.log('ID:', parada.id)
    console.log('Início:', parada.inicio)
    console.log('Fim:', parada.fim)
    console.log('Duração:', parada.duracao_segundos, 'segundos')
    console.log('================================')

    return res.status(200).json({
      success: true,
      message: 'Parada finalizada com sucesso.',
      data: parada
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    console.error('Erro ao finalizar parada pela API:', error)

    return res.status(500).json({
      success: false,
      message: 'Não foi possível finalizar a parada.'
    })
  }
}