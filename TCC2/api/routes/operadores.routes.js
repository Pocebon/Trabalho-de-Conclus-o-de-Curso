
import express from 'express'

import {
  autenticar,
  permitirPerfis
} from '../middlewares/auth.middleware.js'

import {
  listarOperadores,
  cadastrarOperador,
  atualizarOperador,
  alterarStatusOperador,
  redefinirSenhaOperador
} from '../controllers/operadores.controller.js'

const router = express.Router()

router.use(autenticar, permitirPerfis('gestor'))

router.get('/', listarOperadores)


router.post('/', cadastrarOperador)

router.put('/:id', atualizarOperador)

router.patch('/:id/status', alterarStatusOperador)

router.patch('/:id/senha', redefinirSenhaOperador)

export default router