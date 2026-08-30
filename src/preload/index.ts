import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('antropometriaBia', {
  loadLibrary: () => ipcRenderer.invoke('abia:load-library'),
  saveLibrary: (payload: unknown) => ipcRenderer.invoke('abia:save-library', payload),
  exportFile: (opts: { defaultName: string; content: string; ext: string }) =>
    ipcRenderer.invoke('abia:export-file', opts),
  importFile: () => ipcRenderer.invoke('abia:import-file'),
  print: () => ipcRenderer.invoke('abia:print'),
  pdf: (defaultName: string) => ipcRenderer.invoke('abia:pdf', defaultName),
  openPath: (p: string) => ipcRenderer.invoke('abia:open-path', p)
})
