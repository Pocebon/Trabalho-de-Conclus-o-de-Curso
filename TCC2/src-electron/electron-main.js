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

import db from './database.js'

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

let mainWindow
let logMonitor
let currentOperator = null

function padNumber (value) {
  return String(value)
    .padStart(2, '0')
}

function formatLocalDateTime (date) {
  const year =
    date.getFullYear()

  const month =
    padNumber(
      date.getMonth() + 1
    )

  const day =
    padNumber(
      date.getDate()
    )

  const hour =
    padNumber(
      date.getHours()
    )

  const minute =
    padNumber(
      date.getMinutes()
    )

  const second =
    padNumber(
      date.getSeconds()
    )

  return (
    `${year}-${month}-${day} ` +
    `${hour}:${minute}:${second}`
  )
}

async function createWindow () {
  mainWindow =
    new BrowserWindow({
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
            process.env
              .QUASAR_ELECTRON_PRELOAD_FOLDER,

            'electron-preload' +
              process.env
                .QUASAR_ELECTRON_PRELOAD_EXTENSION
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
    mainWindow
      .webContents
      .openDevTools()
  } else {
    mainWindow
      .webContents
      .on(
        'devtools-opened',
        () => {
          mainWindow
            .webContents
            .closeDevTools()
        }
      )
  }

  mainWindow.on(
    'closed',
    () => {
      mainWindow = null
    }
  )
}

async function testDatabaseConnection () {
  try {
    const result =
      await db.one(
        'SELECT NOW()'
      )

    console.log(
      'Banco conectado com sucesso:'
    )

    console.log(result)
  } catch (error) {
    console.error(
      'Erro ao conectar no banco:',
      error
    )
  }
}

function registerIpcHandlers () {
  ipcMain.handle(
    'login-user',

    async (
      event,
      credentials
    ) => {
      try {
        const user =
          await db.oneOrNone(
            `
            SELECT
              id,
              nome,
              email,
              perfil
            FROM usuarios
            WHERE LOWER(email) = LOWER($1)
              AND senha = $2
              AND ativo = TRUE
            LIMIT 1
            `,
            [
              credentials.email,
              credentials.senha
            ]
          )

        if (!user) {
          return {
            success: false,
            message:
              'E-mail ou senha inválidos.'
          }
        }

        currentOperator = user

        console.log('')
        console.log(
          'Usuário autenticado:'
        )
        console.log(user)

        return {
          success: true,
          user
        }
      } catch (error) {
        console.error(
          'Erro ao realizar login:',
          error
        )

        return {
          success: false,
          message:
            'Não foi possível realizar o login.'
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
        const reasons =
          await db.any(
            `
            SELECT
              id,
              descricao
            FROM motivos_parada
            WHERE ativo = TRUE
            ORDER BY descricao
            `
          )

        return {
          success: true,
          data: reasons
        }
      } catch (error) {
        console.error(
          'Erro ao buscar motivos:',
          error
        )

        return {
          success: false,
          message:
            'Erro ao buscar motivos de parada.'
        }
      }
    }
  )

  ipcMain.handle(
    'register-stop-reason',

    async (
      event,
      data
    ) => {
      try {
        console.log('')
        console.log(
          'Registrando ocorrência...'
        )

        console.log(data)

        if (!data.paradaId) {
          return {
            success: false,
            message:
              'Parada não informada.'
          }
        }

        if (!currentOperator) {
          return {
            success: false,
            message:
              'Nenhum usuário está autenticado.'
          }
        }

        const occurrence =
          await db.one(
            `
            INSERT INTO ocorrencias (
              parada_id,
              usuario_id,
              motivo_id,
              observacao
            )
            VALUES (
              $1,
              $2,
              $3,
              $4
            )
            RETURNING *
            `,
            [
              data.paradaId,
              currentOperator.id,
              data.reasonId,
              data.observation || null
            ]
          )

        await db.none(
          `
          UPDATE paradas
          SET justificada = TRUE
          WHERE id = $1
          `,
          [
            data.paradaId
          ]
        )

        console.log(
          'Ocorrência registrada com sucesso:'
        )

        console.log(
          occurrence
        )

        return {
          success: true,
          data: occurrence
        }
      } catch (error) {
        console.error(
          'Erro ao registrar ocorrência:',
          error
        )

        return {
          success: false,
          message:
            'Não foi possível registrar a ocorrência.'
        }
      }
    }
  )
}

async function createStop (
  stop
) {
  if (!currentOperator) {
    console.log('')
    console.log(
      'Parada detectada, mas não existe operador logado.'
    )

    return null
  }

  try {
    const startedAt =
      formatLocalDateTime(
        stop.startedAt
      )

    const parada =
      await db.one(
        `
        INSERT INTO paradas (
          inicio,
          justificada,
          operador_id
        )
        VALUES (
          $1::timestamp,
          FALSE,
          $2
        )
        RETURNING *
        `,
        [
          startedAt,
          currentOperator.id
        ]
      )

    console.log('')
    console.log(
      'Parada criada no banco:'
    )

    console.log(
      parada
    )

    return parada
  } catch (error) {
    console.error(
      'Erro ao criar parada:',
      error
    )

    return null
  }
}

function initializeLogMonitor () {
  const logFilePath =
    path.resolve(
      process.cwd(),
      'src-electron',
      'logs',
      '20250106.dia'
    )

  logMonitor =
    startLogMonitor(
      logFilePath,
      {
        stopThresholdMs: 10000,

        onStopConfirmed:
          async (stop) => {
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

            const parada =
              await createStop(
                stop
              )

            if (
              mainWindow &&
              parada
            ) {
              mainWindow
                .webContents
                .send(
                  'machine-stop-confirmed',
                  {
                    paradaId:
                      parada.id,

                    startedAt:
                      startedAtLocal,

                    operadorId:
                      currentOperator.id,

                    operadorNome:
                      currentOperator.nome,

                    alarms:
                      stop.alarms ?? []
                  }
                )

              console.log(
                'Evento enviado para a interface.'
              )
            }
          },

        onProductionStopped:
          (stop) => {
            console.log(
              'Produção interrompida em:',
              formatLocalDateTime(
                stop.startedAt
              )
            )
          },

        onProductionStarted:
          (production) => {
            console.log(
              'Produção iniciada em:',
              formatLocalDateTime(
                production.startedAt
              )
            )
          }
      }
    )
}

app.whenReady().then(
  async () => {
    registerIpcHandlers()

    await createWindow()

    await testDatabaseConnection()

    initializeLogMonitor()
  }
)

app.on(
  'window-all-closed',
  () => {
    if (logMonitor) {
      logMonitor.stop()
    }

    if (
      platform !== 'darwin'
    ) {
      app.quit()
    }
  }
)

app.on(
  'activate',
  () => {
    if (
      mainWindow === null
    ) {
      createWindow()
    }
  }
)