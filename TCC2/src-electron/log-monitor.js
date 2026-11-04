
import fs from 'node:fs'
import path from 'node:path'

export function startLogMonitor(
  logSource,
  {
    stopThresholdMs = 420000,
    onStopConfirmed = null,
    onProductionStarted = null,
    onProductionStopped = null
  } = {}
) {
  const fixedFile =
    typeof logSource === 'string' && /\.dia$/i.test(logSource)

  const reportDirectory = fixedFile
    ? path.dirname(logSource)
    : logSource

  let currentFile = null
  let offset = 0
  let pending = Buffer.alloc(0)
  let machineState = null
  let stopStartedAt = null
  let stopTimer = null
  let stopConfirmed = false
  let currentAlarm = null
  let alarmsDuringStop = []
  let stopped = false
  let busy = false

  function dailyFile(date) {
    if (fixedFile) return logSource

    const yyyy = String(date.getFullYear())
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')

    return path.join(
      reportDirectory,
      yyyy,
      `${yyyy}${mm}${dd}.dia`
    )
  }

  function eventDateFromLine(file, hh, mm, ss) {
    const match = path.basename(file).match(
      /^(\d{4})(\d{2})(\d{2})\.dia$/i
    )

    const base = match
      ? new Date(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3])
        )
      : new Date()

    let eventDate = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      Number(hh),
      Number(mm),
      Number(ss)
    )

    // No arquivo fixo de testes, considera a virada
    // de meia-noite durante uma parada.
    if (
      fixedFile &&
      stopStartedAt &&
      machineState === 'STOP' &&
      eventDate < stopStartedAt
    ) {
      eventDate = new Date(eventDate)
      eventDate.setDate(eventDate.getDate() + 1)
    }

    return eventDate
  }

  function clearStopTimer() {
    if (stopTimer) {
      clearTimeout(stopTimer)
    }

    stopTimer = null
  }

  function confirmStop() {
    clearStopTimer()

    if (
      stopped ||
      machineState !== 'STOP' ||
      stopConfirmed ||
      !stopStartedAt
    ) {
      return false
    }

    stopConfirmed = true

    console.log('PARADA ULTRAPASSOU O LIMITE')

    try {
      const result = onStopConfirmed?.({
        startedAt: stopStartedAt,
        alarms: [...alarmsDuringStop]
      })

      Promise.resolve(result).catch(error => {
        console.error(
          'Erro ao confirmar parada:',
          error
        )
      })
    } catch (error) {
      console.error(
        'Erro ao confirmar parada:',
        error
      )
    }

    return true
  }

  function scheduleStopConfirmation() {
    clearStopTimer()

    if (
      !stopStartedAt ||
      stopConfirmed ||
      machineState !== 'STOP'
    ) {
      return
    }

    const remaining =
      stopThresholdMs -
      (Date.now() - stopStartedAt.getTime())

    if (remaining <= 0) {
      confirmStop()
    } else {
      stopTimer = setTimeout(
        confirmStop,
        remaining
      )
    }
  }

  function handleProductionStop(eventDate) {
    if (machineState === 'STOP') return

    machineState = 'STOP'
    stopStartedAt = eventDate
    stopConfirmed = false
    alarmsDuringStop = []

    console.log(
      'POSSÍVEL PARADA DETECTADA:',
      eventDate.toLocaleString('pt-BR')
    )

    onProductionStopped?.({
      startedAt: eventDate
    })

    scheduleStopConfirmation()
  }

  function handleProductionStart(eventDate) {
    if (machineState === 'STOP' && stopStartedAt) {
      clearStopTimer()

      const startedAt = stopStartedAt

      const durationMs = Math.max(
        0,
        eventDate.getTime() - startedAt.getTime()
      )

      const durationSeconds = Math.floor(
        durationMs / 1000
      )

      // Confirma pelo horário real dos eventos,
      // mesmo se o temporizador não tiver disparado.
      if (
        !stopConfirmed &&
        durationMs >= stopThresholdMs
      ) {
        confirmStop()
      }

      const wasConfirmed = stopConfirmed

      onProductionStarted?.({
        startedAt: eventDate,
        stopStartedAt: startedAt,
        durationSeconds,
        stopConfirmed: wasConfirmed
      })
    } else {
      onProductionStarted?.({
        startedAt: eventDate,
        stopStartedAt: null,
        durationSeconds: null,
        stopConfirmed: false
      })
    }

    machineState = 'RUN'
    stopStartedAt = null
    stopConfirmed = false
    alarmsDuringStop = []
  }

  function processLine(line, file) {
    const clean = line.trim()
    if (!clean) return

    const production = clean.match(
      /^(START|STOP)\s+PROD,(\d{2}),(\d{2}),(\d{2})$/i
    )

    if (production) {
      const eventDate = eventDateFromLine(
        file,
        production[2],
        production[3],
        production[4]
      )

      const type = production[1].toUpperCase()

      console.log(
        'Evento produção:',
        type,
        eventDate.toLocaleString('pt-BR')
      )

      if (type === 'STOP') {
        handleProductionStop(eventDate)
      } else {
        handleProductionStart(eventDate)
      }

      return
    }

    const alarmStart = clean.match(
      /^START\s+ALRM,(\d{2}),(\d{2}),(\d{2})$/i
    )

    if (alarmStart) {
      currentAlarm = {
        startedAt: eventDateFromLine(
          file,
          alarmStart[1],
          alarmStart[2],
          alarmStart[3]
        ),
        message: null
      }

      return
    }

    const alarmMessage = clean.match(
      /^ALRM,(.+)$/i
    )

    if (alarmMessage) {
      if (currentAlarm) {
        currentAlarm.message =
          alarmMessage[1].trim()

        if (machineState === 'STOP') {
          alarmsDuringStop.push({
            ...currentAlarm
          })
        }
      }

      return
    }

    if (
      /^STOP\s+ALRM,\d{2},\d{2},\d{2}$/i.test(clean)
    ) {
      currentAlarm = null
    }
  }

  function resetFilePosition(file, initial = false) {
    currentFile = file
    pending = Buffer.alloc(0)
    offset = 0

    if (!fs.existsSync(file)) {
      console.log(
        'Aguardando arquivo .dia:',
        file
      )
      return
    }

    if (initial) {
      offset = fs.statSync(file).size

      console.log(
        'Monitor posicionado no final do arquivo:',
        file
      )
    } else {
      console.log(
        'Monitorando novo arquivo diário:',
        file
      )
    }
  }

  function poll() {
    if (stopped || busy) return

    busy = true

    try {
      const desired = dailyFile(new Date())

      if (desired !== currentFile) {
        resetFilePosition(
          desired,
          currentFile === null
        )
      }

      if (!fs.existsSync(currentFile)) return

      const size = fs.statSync(currentFile).size

      if (size < offset) {
        console.log(
          'Arquivo reduzido ou substituído; reiniciando posição.'
        )

        offset = 0
        pending = Buffer.alloc(0)
      }

      if (size === offset) return

      const fd = fs.openSync(currentFile, 'r')

      try {
        while (offset < size) {
          const length = Math.min(
            64 * 1024,
            size - offset
          )

          const buffer = Buffer.allocUnsafe(length)

          const read = fs.readSync(
            fd,
            buffer,
            0,
            length,
            offset
          )

          if (!read) break

          offset += read

          pending = Buffer.concat([
            pending,
            buffer.subarray(0, read)
          ])

          let newline

          while (
            (newline = pending.indexOf(10)) !== -1
          ) {
            const line = pending
              .subarray(0, newline)
              .toString('latin1')

            pending = pending.subarray(
              newline + 1
            )

            processLine(
              line,
              currentFile
            )
          }
        }
      } finally {
        fs.closeSync(fd)
      }
    } catch (error) {
      console.error(
        'Erro ao acompanhar arquivo .dia:',
        error
      )
    } finally {
      busy = false
    }
  }

  console.log(
    'MONITOR DO ARQUIVO .DIA INICIADO:',
    reportDirectory
  )

  poll()

  const interval = setInterval(poll, 500)

  return {
    stop() {
      stopped = true
      clearInterval(interval)
      clearStopTimer()

      console.log(
        'Monitor do arquivo .dia encerrado.'
      )
    }
  }
}