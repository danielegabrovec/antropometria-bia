export interface AntropometriaBiaApi {
  loadIndex: () => Promise<unknown>
  saveIndex: (payload: unknown) => Promise<{ ok: boolean }>
  loadWorkspace: (id: string) => Promise<unknown>
  saveWorkspace: (id: string, payload: unknown) => Promise<{ ok: boolean }>
  deleteWorkspace: (id: string) => Promise<{ ok: boolean }>
  exportFile: (opts: {
    defaultName: string
    content: string
    ext: string
  }) => Promise<{ ok: boolean; path?: string }>
  exportBuffer: (opts: {
    defaultName: string
    base64: string
    ext: string
  }) => Promise<{ ok: boolean; path?: string }>
  importFile: (filters?: { name: string; extensions: string[] }[]) => Promise<{
    ok: boolean
    canceled?: boolean
    content?: string
    base64?: string
    path?: string
  }>
  printHtml: (html: string) => Promise<{ ok: boolean }>
  pdfHtml: (html: string, defaultName: string) => Promise<{ ok: boolean; path?: string }>
  openPath: (p: string) => Promise<void>
  onBeforeClose: (callback: () => void | Promise<void>) => () => void
  closeReady: () => void
}

declare global {
  interface Window {
    antropometriaBia?: AntropometriaBiaApi
  }
}

export {}
