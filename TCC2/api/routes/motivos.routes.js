
import express from 'express'

import {
  listarMotivosAtivos,
  listarTodosMotivos,
  cadastrarMotivo,
  atualizarMotivo,
  alterarStatusMotivo
} from '../controllers/motivos.controller.js'

const router = express.Router()

router.get('/', listarMotivosAtivos)

router.get('/todos', listarTodosMotivos)

router.post('/', cadastrarMotivo)

router.put('/:id', atualizarMotivo)

router.patch('/:id/status', alterarStatusMotivo)

export default router