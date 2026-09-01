import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

import db from './database.js'
import { startLogMonitor } from './log-monitor.js'

const platform = process.platform || os.platform()

const currentDir = fileURLToPath(
  new URL('.', import.meta.url)
)

let mainWindow
let logMonitor

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

async function testDatabaseConnection () {
  try {
    const result = await db.one(
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

function initializeLogMonitor () {
  const logFilePath = path.resolve(
    process.cwd(),
    'src-electron',
    'logs',
    'maquina.log'
  )

  logMonitor = startLogMonitor(
    logFilePath,
    {
      stopThresholdMs: 10000,

      onStopConfirmed: (stop) => {
        console.log('')
        console.log(
          '================================'
        )
        console.log(
          'PARADA CONFIRMADA PELO SISTEMA'
        )
        console.log(
          'Início:',
          stop.startedAt
        )
        console.log(
          '================================'
        )

        if (mainWindow) {
          mainWindow.webContents.send(
            'machine-stop-confirmed',
            {
              startedAt:
                stop.startedAt.toISOString()
            }
          )

          console.log(
            'Evento enviado para a interface.'
          )
        }
      }
    }
  )
}

app.whenReady().then(async () => {
  await createWindow()

  await testDatabaseConnection()

  initializeLogMonitor()
})

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

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})