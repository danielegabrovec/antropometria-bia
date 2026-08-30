export interface AntropometriaBiaApi {
  loadLibrary: () => Promise<{
    patients: unknown[]
    visits: unknown[]
    draft: unknown
  }>
  saveLibrary: (payload: unknown) => Promise<{ ok: boolean }>
  exportFile: (opts: {
    defaultName: string
    content: string
    ext: string
  }) => Promise<{ ok: boolean; path?: string }>
  importFile: () => Promise<{ ok: boolean; canceled?: boolean; content?: string; path?: string }>
  print: () => Promise<{ ok: boolean }>
  pdf: (defaultName: string) => Promise<{ ok: boolean; path?: string }>
  openPath: (p: string) => Promise<void>
}

declare global {
  interface Window {
    antropometriaBia?: AntropometriaBiaApi
  }
}

export {}
