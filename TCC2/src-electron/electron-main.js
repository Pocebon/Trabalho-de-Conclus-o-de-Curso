
import {
  app,
  BrowserWindow,
  ipcMain
} from 'electron'

import path from 'node:path'
import os from 'node:os'

import {
  fileURLToPath
} from 'node:url'

import {
  startLogMonitor
} from './log-monitor.js'

const platform =
  process.platform ||
  os.platform()

const currentDir =
  fileURLToPath(
    new URL('.', import.meta.url)
  )

const API_URL =
  'https://tcc-paradas-api.onrender.com/api'

let mainWindow
let logMonitor
let currentOperator = null
let activeStopId = null
let pendingStopCreation = null

function padNumber (value) {
  return String(value).padStart(2, '0')
}

function formatLocalDateTime (date) {
  const year = date.getFullYear()
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())

  const hour = padNumber(date.getHours())
  const minute = padNumber(date.getMinutes())
  const second = padNumber(date.getSeconds())

  return (
    `${year}-${month}-${day} ` +
    `${hour}:${minute}:${second}`
  )
}

async function createWindow () {
  mainWindow = new BrowserWindow({
    icon: path.resolve(
      currentDir,
      'icons/icon.png'
    ),

    width: 1000,
    height: 600,
    useContentSize: true,

    webPreferences: {
      contextIsolation: true,

      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,

          'electron-preload' +
            process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION
        )
      )
    }
  })

  if (process.env.DEV) {
    await mainWindow.loadURL(
      process.env.APP_URL
    )
  } else {
    await mainWindow.loadFile(
      'index.html'
    )
  }

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.webContents.on(
      'devtools-opened',
      () => {
        mainWindow.webContents.closeDevTools()
      }
    )
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function testApiConnection () {
  try {
    const response = await fetch(
      `${API_URL}/health`
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      console.error(
        'API respondeu com erro:',
        result.message
      )

      return
    }

    console.log('')
    console.log(
      'API conectada com sucesso.'
    )

    console.log(result.message)
  } catch (error) {
    console.error(
      'Não foi possível conectar à API:',
      error
    )
  }
}

function registerIpcHandlers () {

  ipcMain.handle(
    'login-user',

    async (event, credentials) => {
      try {
        console.log('')
        console.log(
          'Enviando login para a API...'
        )

        const response = await fetch(
          `${API_URL}/auth/login`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              email: credentials.email,
              senha: credentials.senha
            })
          }
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          return {
            success: false,
            message:
              result.message ||
              'E-mail ou senha inválidos.'
          }
        }

        currentOperator = result.user

        console.log('')
        console.log(
          'Usuário autenticado pela API:'
        )

        console.log(currentOperator)

        return {
          success: true,
          user: currentOperator
        }
      } catch (error) {
        console.error(
          'Erro ao comunicar com a API:',
          error
        )

        return {
          success: false,
          message:
            'Não foi possível conectar à API.'
        }
      }
    }
  )

  ipcMain.handle(
    'logout-user',

    async () => {
      currentOperator = null

      console.log(
        'Usuário desconectado.'
      )

      return {
        success: true
      }
    }
  )

  ipcMain.handle(
    'get-stop-reasons',

    async () => {
      try {
        console.log('')
        console.log(
          'Buscando motivos pela API...'
        )

        const response = await fetch(
          `${API_URL}/motivos`
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          return {
            success: false,
            message:
              result.message ||
              'Erro ao buscar motivos de parada.'
          }
        }

        console.log(
          'Motivos recebidos da API:',
          result.data.length
        )

        return {
          success: true,
          data: result.data
        }
      } catch (error) {
        console.error(
          'Erro ao comunicar com a API:',
          error
        )

        return {
          success: false,
          message:
            'Não foi possível buscar os motivos de parada.'
        }
      }
    }
  )

  ipcMain.handle(
    'register-stop-reason',

    async (event, data) => {
      try {
        console.log('')
        console.log(
          'Enviando justificativa para a API...'
        )

        if (!data?.paradaId) {
          return {
            success: false,
            message: 'Parada não informada.'
          }
        }

        if (!currentOperator) {
          return {
            success: false,
            message:
              'Nenhum usuário está autenticado.'
          }
        }

        if (
          currentOperator.perfil !== 'operador'
        ) {
          return {
            success: false,
            message:
              'Apenas operadores podem justificar paradas.'
          }
        }

        if (!data.reasonId) {
          return {
            success: false,
            message:
              'Selecione um motivo para a parada.'
          }
        }

        const response = await fetch(
          `${API_URL}/paradas/${data.paradaId}/ocorrencias`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              usuarioId: currentOperator.id,
              motivoId: data.reasonId,
              observacao: data.observation || null
            })
          }
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          console.error(
            'API recusou a justificativa:',
            result.message
          )

          return {
            success: false,
            message:
              result.message ||
              'Não foi possível registrar a justificativa.'
          }
        }

        console.log('')
        console.log(
          'Justificativa registrada pela API:'
        )

        console.log(result.data)

        return {
          success: true,
          data: result.data
        }
      } catch (error) {
        console.error(
          'Erro ao enviar justificativa para a API:',
          error
        )

        return {
          success: false,
          message:
            'Não foi possível conectar à API para registrar a justificativa.'
        }
      }
    }
  )
}

async function createStop (stop) {
  if (!currentOperator) {
    console.log('')
    console.log(
      'Parada detectada, mas não existe operador logado.'
    )

    return null
  }

  if (currentOperator.perfil !== 'operador') {
    console.log(
      'Parada detectada, mas o usuário não é operador.'
    )

    return null
  }

  try {
    const startedAt = formatLocalDateTime(
      stop.startedAt
    )

    console.log('')
    console.log(
      'Enviando criação da parada para a API...'
    )

    const response = await fetch(
      `${API_URL}/paradas`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          inicio: startedAt,
          operadorId: currentOperator.id
        })
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      console.error(
        'API recusou a criação da parada:',
        result.message
      )

      return null
    }

    const parada = result.data

    console.log('')
    console.log(
      'Parada criada pela API:'
    )

    console.log(parada)

    return parada
  } catch (error) {
    console.error(
      'Erro ao criar parada pela API:',
      error
    )

    return null
  }
}

async function finishStop (production) {
  if (!activeStopId) {
    console.log('')
    console.log(
      'START PROD detectado, mas não existe parada ativa.'
    )

    return null
  }

  try {
    const finishedAt = formatLocalDateTime(
      production.startedAt
    )

    console.log('')
    console.log(
      'Enviando finalização da parada para a API...'
    )

    const response = await fetch(
      `${API_URL}/paradas/${activeStopId}/finalizar`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          fim: finishedAt,
          duracaoSegundos: production.durationSeconds
        })
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      console.error(
        'API recusou a finalização:',
        result.message
      )

      return null
    }

    const parada = result.data

    console.log('')
    console.log(
      '================================'
    )

    console.log(
      'PARADA FINALIZADA PELA API'
    )

    console.log(
      'ID:',
      parada.id
    )

    console.log(
      'Início:',
      parada.inicio
    )

    console.log(
      'Fim:',
      parada.fim
    )

    console.log(
      'Duração:',
      parada.duracao_segundos,
      'segundos'
    )

    console.log(
      '================================'
    )

    activeStopId = null

    return parada
  } catch (error) {
    console.error(
      'Erro ao finalizar parada pela API:',
      error
    )

    return null
  }
}

function initializeLogMonitor () {
  const logSource = 'C:\\TCC2\\TesteXilog\\teste.dia'

  logMonitor = startLogMonitor(
    logSource,
    {
      stopThresholdMs: 420000,

      onStopConfirmed: async (stop) => {
        console.log('')
        console.log(
          '================================'
        )

        console.log(
          'PARADA CONFIRMADA PELO SISTEMA'
        )

        const startedAtLocal =
          formatLocalDateTime(
            stop.startedAt
          )

        console.log(
          'Início:',
          startedAtLocal
        )

        console.log(
          'Operador:',
          currentOperator
            ? currentOperator.nome
            : 'Nenhum operador logado'
        )

        console.log(
          'Alarmes:',
          stop.alarms ?? []
        )

        console.log(
          '================================'
        )

        const creation = createStop(stop)
        pendingStopCreation = creation
        const parada = await creation

        if (parada) {
          activeStopId = parada.id
        }

        if (mainWindow && parada) {
          mainWindow.webContents.send(
            'machine-stop-confirmed',
            {
              paradaId: parada.id,

              startedAt: startedAtLocal,

              operadorId: currentOperator.id,

              operadorNome: currentOperator.nome,

              alarms: stop.alarms ?? []
            }
          )

          console.log(
            'Evento enviado para a interface.'
          )
        }
      },

      onProductionStopped: (stop) => {
        console.log(
          'Produção interrompida em:',
          formatLocalDateTime(
            stop.startedAt
          )
        )
      },

      onProductionStarted: async (production) => {
        console.log(
          'Produção iniciada em:',
          formatLocalDateTime(
            production.startedAt
          )
        )

        if (production.stopConfirmed) {
          if (pendingStopCreation) await pendingStopCreation
          await finishStop(
            production
          )
          pendingStopCreation = null
        } else {
          console.log(
            'Não existe parada confirmada para finalizar.'
          )
        }
      }
    }
  )
}

app.whenReady().then(
  async () => {
    registerIpcHandlers()

    await createWindow()

    await testApiConnection()

    initializeLogMonitor()
  }
)

app.on(
  'window-all-closed',
  () => {
    if (logMonitor) {
      logMonitor.stop()
    }

    if (platform !== 'darwin') {
      app.quit()
    }
  }
)

app.on(
  'activate',
  () => {
    if (mainWindow === null) {
      createWindow()
    }
  }
)