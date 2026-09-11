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
    },

    loginUser: async (
      credentials
    ) => {
      return await ipcRenderer.invoke(
        'login-user',
        credentials
      )
    },

    logoutUser: async () => {
      return await ipcRenderer.invoke(
        'logout-user'
      )
    },

    getStopReasons: async () => {
      return await ipcRenderer.invoke(
        'get-stop-reasons'
      )
    },

    registerStopReason: async (
      data
    ) => {
      return await ipcRenderer.invoke(
        'register-stop-reason',
        data
      )
    }
  }
)