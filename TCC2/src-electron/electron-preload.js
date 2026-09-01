import {
  contextBridge,
  ipcRenderer
} from 'electron'

contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    onMachineStopConfirmed: (
      callback
    ) => {
      const listener = (
        event,
        data
      ) => {
        callback(data)
      }

      ipcRenderer.on(
        'machine-stop-confirmed',
        listener
      )

      return () => {
        ipcRenderer.removeListener(
          'machine-stop-confirmed',
          listener
        )
      }
    }
  }
)