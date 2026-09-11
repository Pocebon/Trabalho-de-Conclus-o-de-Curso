import fs from 'node:fs'
import path from 'node:path'

export function startLogMonitor(
  logFilePath,
  {
    stopThresholdMs = 10000,
    onStopConfirmed = null,
    onProductionStarted = null,
    onProductionStopped = null
  } = {}
) {
  console.log('--------------------------------')
  console.log('MONITOR DO ARQUIVO .DIA INICIADO')
  console.log('Arquivo:', logFilePath)
  console.log('--------------------------------')

  const directory = path.dirname(logFilePath)

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }

  if (!fs.existsSync(logFilePath)) {
    console.error('Arquivo .dia não encontrado:')
    console.error(logFilePath)
    return null
  }

  let processedLines = 0

  let machineState = null

  let stopStartedAt = null
  let stopTimer = null
  let stopConfirmed = false

  let currentAlarm = null
  let alarmsDuringStop = []

  function getFileDate() {
    const fileName = path.basename(logFilePath)

    const match = fileName.match(
      /^(\d{4})(\d{2})(\d{2})\.dia$/i
    )

    if (!match) {
      return new Date()
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])

    return new Date(
      year,
      month - 1,
      day
    )
  }

  const fileDate = getFileDate()

  function createDateFromTime(
    hour,
    minute,
    second
  ) {
    return new Date(
      fileDate.getFullYear(),
      fileDate.getMonth(),
      fileDate.getDate(),
      Number(hour),
      Number(minute),
      Number(second)
    )
  }

  function processProductionEvent(line) {
    const match = line.match(
      /^(START|STOP)\s+PROD,(\d{2}),(\d{2}),(\d{2})$/i
    )

    if (!match) return false

    const action = match[1].toUpperCase()

    const eventDate = createDateFromTime(
      match[2],
      match[3],
      match[4]
    )

    console.log('')
    console.log(
      `Evento produção: ${action} PROD`
    )

    console.log(
      'Horário:',
      eventDate.toLocaleString('pt-BR')
    )

    if (action === 'STOP') {
      handleProductionStop(eventDate)
    }

    if (action === 'START') {
      handleProductionStart(eventDate)
    }

    return true
  }

  function handleProductionStop(eventDate) {
    if (machineState === 'STOP') {
      return
    }

    machineState = 'STOP'

    stopStartedAt = eventDate
    stopConfirmed = false
    alarmsDuringStop = []

    console.log('')
    console.log('⚠ POSSÍVEL PARADA DETECTADA')

    console.log(
      'Início:',
      eventDate.toLocaleString('pt-BR')
    )

    if (onProductionStopped) {
      onProductionStopped({
        startedAt: eventDate
      })
    }

    if (stopTimer) {
      clearTimeout(stopTimer)
    }

    stopTimer = setTimeout(() => {
      if (machineState !== 'STOP') {
        return
      }

      stopConfirmed = true

      console.log('')
      console.log(
        '🚨 PARADA ULTRAPASSOU O LIMITE'
      )

      console.log(
        'Solicitar motivo ao operador.'
      )

      if (
        alarmsDuringStop.length > 0
      ) {
        console.log(
          'Alarmes durante a parada:'
        )

        alarmsDuringStop.forEach(
          alarm => {
            console.log('-', alarm.message)
          }
        )
      }

      if (onStopConfirmed) {
        onStopConfirmed({
          startedAt: stopStartedAt,
          alarms: alarmsDuringStop
        })
      }
    }, stopThresholdMs)
  }

  function handleProductionStart(eventDate) {
    if (machineState === 'STOP') {

      if (stopTimer) {
        clearTimeout(stopTimer)
        stopTimer = null
      }

      const durationMs =
        eventDate.getTime() -
        stopStartedAt.getTime()

      const durationSeconds =
        Math.max(
          0,
          Math.floor(durationMs / 1000)
        )

      console.log('')
      console.log(
        '✅ PRODUÇÃO INICIADA NOVAMENTE'
      )

      console.log(
        'Fim:',
        eventDate.toLocaleString('pt-BR')
      )

      console.log(
        'Duração:',
        durationSeconds,
        'segundos'
      )

      if (!stopConfirmed) {
        console.log(
          'Parada curta. Não necessita justificativa.'
        )
      } else {
        console.log(
          'Parada já havia sido confirmada.'
        )
      }
    }

    machineState = 'RUN'

    if (onProductionStarted) {
      onProductionStarted({
        startedAt: eventDate
      })
    }

    stopStartedAt = null
    stopConfirmed = false
  }

  function processAlarmEvent(line) {

    const startAlarmMatch =
      line.match(
        /^START\s+ALRM,(\d{2}),(\d{2}),(\d{2})$/i
      )

    if (startAlarmMatch) {

      const alarmDate =
        createDateFromTime(
          startAlarmMatch[1],
          startAlarmMatch[2],
          startAlarmMatch[3]
        )

      currentAlarm = {
        startedAt: alarmDate,
        message: null
      }

      return true
    }

    const alarmMessageMatch =
      line.match(/^ALRM,(.+)$/i)

    if (alarmMessageMatch) {

      const message =
        alarmMessageMatch[1].trim()

      console.log(
        '⚠ Alarme:',
        message
      )

      if (currentAlarm) {

        currentAlarm.message =
          message

        if (
          machineState === 'STOP'
        ) {
          alarmsDuringStop.push({
            ...currentAlarm
          })
        }
      }

      return true
    }

    const stopAlarmMatch =
      line.match(
        /^STOP\s+ALRM,(\d{2}),(\d{2}),(\d{2})$/i
      )

    if (stopAlarmMatch) {
      currentAlarm = null
      return true
    }

    return false
  }

  function processLine(line) {
    const cleanedLine =
      line.trim()

    if (!cleanedLine) return

    if (
      processProductionEvent(
        cleanedLine
      )
    ) {
      return
    }

    if (
      processAlarmEvent(
        cleanedLine
      )
    ) {
      return
    }
  }

  function readLog() {
    try {

      const content =
        fs.readFileSync(
          logFilePath,
          'latin1'
        )

      const lines =
        content
          .split(/\r?\n/)
          .filter(
            line =>
              line.trim() !== ''
          )

      if (
        lines.length <
        processedLines
      ) {
        console.log(
          'Arquivo reiniciado ou substituído.'
        )

        processedLines = 0
        machineState = null
      }

      const newLines =
        lines.slice(
          processedLines
        )

      for (
        const line of newLines
      ) {
        processLine(line)
      }

      processedLines =
        lines.length

    } catch (error) {

      console.error(
        'Erro ao ler arquivo .dia:',
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

      fs.unwatchFile(
        logFilePath
      )

      if (stopTimer) {
        clearTimeout(stopTimer)
      }

      console.log(
        'Monitor do arquivo .dia encerrado.'
      )
    }
  }
}