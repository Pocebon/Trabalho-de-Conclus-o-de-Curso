
import express from 'express'

import {
  listarParadas,
  criarParada,
  registrarJustificativa,
  finalizarParada
} from '../controllers/paradas.controller.js'

const router = express.Router()

router.get('/', listarParadas)

router.post('/', criarParada)

router.post('/:id/ocorrencias', registrarJustificativa)

router.patch('/:id/finalizar', finalizarParada)

export default router