import fs from 'node:fs'
import path from 'node:path'

export function startLogMonitor(
  logFilePath,
  {
    stopThresholdMs = 10000,
    onStopConfirmed = null
  } = {}
) {
  console.log('--------------------------------')
  console.log('MONITOR DE LOG INICIADO')
  console.log('Arquivo:', logFilePath)
  console.log('--------------------------------')

  const directory = path.dirname(logFilePath)

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', 'utf8')
  }

  let processedLines = 0
  let currentState = null
  let stopStartedAt = null
  let stopTimer = null
  let stopConfirmed = false

  function processLine(line) {
    const cleanedLine = line.trim()

    if (!cleanedLine) {
      return
    }

    const match = cleanedLine.match(
      /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(RUN|STOP)$/i
    )

    if (!match) {
      console.log('Linha ignorada:', cleanedLine)
      return
    }

    const date = match[1]
    const time = match[2]
    const state = match[3].toUpperCase()

    const eventDate = new Date(`${date}T${time}`)

    console.log('')
    console.log(`Evento recebido: ${state} - ${date} ${time}`)

    if (state === currentState) {
      return
    }

    if (state === 'STOP') {
      currentState = 'STOP'
      stopStartedAt = eventDate
      stopConfirmed = false

      console.log('PARADA DETECTADA')
      console.log('Início:', eventDate.toLocaleString())

      if (stopTimer) {
        clearTimeout(stopTimer)
      }

      stopTimer = setTimeout(() => {
        stopConfirmed = true

        console.log('')
        console.log('PARADA ULTRAPASSOU O LIMITE')
        console.log('Solicitar motivo ao operador.')

        if (onStopConfirmed) {
          onStopConfirmed({
            startedAt: stopStartedAt
          })
        }
      }, stopThresholdMs)

      return
    }

    if (state === 'RUN') {
      if (currentState === 'STOP') {
        if (stopTimer) {
          clearTimeout(stopTimer)
          stopTimer = null
        }

        const durationMs =
          eventDate.getTime() - stopStartedAt.getTime()

        const durationSeconds = Math.max(
          0,
          Math.floor(durationMs / 1000)
        )

        console.log('✅ MÁQUINA RETORNOU AO ESTADO RUN')
        console.log('Fim:', eventDate.toLocaleString())
        console.log(
          'Duração da parada:',
          durationSeconds,
          'segundos'
        )

        if (!stopConfirmed) {
          console.log(
            'Parada curta. Não é necessário solicitar motivo.'
          )
        }
      }

      currentState = 'RUN'
      stopStartedAt = null
      stopConfirmed = false
    }
  }

  function readLog() {
    try {
      const content = fs.readFileSync(
        logFilePath,
        'utf8'
      )

      const lines = content
        .split(/\r?\n/)
        .filter(line => line.trim() !== '')

      if (lines.length < processedLines) {
        processedLines = 0
        currentState = null
      }

      const newLines = lines.slice(processedLines)

      for (const line of newLines) {
        processLine(line)
      }

      processedLines = lines.length
    } catch (error) {
      console.error(
        'Erro ao ler arquivo de log:',
        error
      )
    }
  }

  readLog()

  fs.watchFile(
    logFilePath,
    {
      interval: 500
    },
    () => {
      readLog()
    }
  )

  return {
    stop() {
      fs.unwatchFile(logFilePath)

      if (stopTimer) {
        clearTimeout(stopTimer)
      }

      console.log('Monitor de log encerrado.')
    }
  }
}