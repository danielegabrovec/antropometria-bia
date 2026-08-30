import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('antropometriaBia', {
  loadIndex: () => ipcRenderer.invoke('abia:load-index'),
  saveIndex: (payload: unknown) => ipcRenderer.invoke('abia:save-index', payload),
  loadWorkspace: (id: string) => ipcRenderer.invoke('abia:load-workspace', id),
  saveWorkspace: (id: string, payload: unknown) => ipcRenderer.invoke('abia:save-workspace', id, payload),
  deleteWorkspace: (id: string) => ipcRenderer.invoke('abia:delete-workspace', id),
  exportFile: (opts: { defaultName: string; content: string; ext: string }) =>
    ipcRenderer.invoke('abia:export-file', opts),
  exportBuffer: (opts: { defaultName: string; base64: string; ext: string }) =>
    ipcRenderer.invoke('abia:export-buffer', opts),
  importFile: (filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('abia:import-file', filters),
  printHtml: (html: string) => ipcRenderer.invoke('abia:print-html', html),
  pdfHtml: (html: string, defaultName: string) => ipcRenderer.invoke('abia:pdf-html', html, defaultName),
  openPath: (p: string) => ipcRenderer.invoke('abia:open-path', p),
  onBeforeClose: (callback: () => void | Promise<void>) => {
    const listener = () => void callback()
    ipcRenderer.on('abia:before-close', listener)
    return () => ipcRenderer.removeListener('abia:before-close', listener)
  },
  closeReady: () => ipcRenderer.send('abia:close-ready')
})
