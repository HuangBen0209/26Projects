import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: { buffer: ArrayBuffer, filename: string }) => 
    ipcRenderer.invoke('dialog:saveFile', data),
})
