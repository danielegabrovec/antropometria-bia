import { useSyncExternalStore } from 'react'
import { useApp } from '../store/useApp'
import type { AppIndex, WorkspaceFile } from '@shared/types'
import { EMPTY_INDEX } from '@shared/types'
import { parseIndex, parseWorkspace } from '@shared/library'

const LS_INDEX = 'antropometria-bia.index.v2'
const LS_WS = (id: string) => `antropometria-bia.ws.${id}`

export type PersistenceStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error'
interface PersistenceSnapshot {
  status: PersistenceStatus
  message: string
  lastSavedAt: string | null
  blocking: boolean
}

let persistenceSnapshot: PersistenceSnapshot = {
  status: 'loading',
  message: 'Caricamento archivio…',
  lastSavedAt: null,
  blocking: false
}
const persistenceListeners = new Set<() => void>()

function setPersistence(next: Partial<PersistenceSnapshot>) {
  persistenceSnapshot = { ...persistenceSnapshot, ...next }
  persistenceListeners.forEach((listener) => listener())
}

export function usePersistStatus() {
  return useSyncExternalStore(
    (listener) => {
      persistenceListeners.add(listener)
      return () => persistenceListeners.delete(listener)
    },
    () => persistenceSnapshot
  )
}

async function readIndex(): Promise<AppIndex> {
  const raw = window.antropometriaBia
    ? await window.antropometriaBia.loadIndex()
    : JSON.parse(localStorage.getItem(LS_INDEX) ?? JSON.stringify(EMPTY_INDEX))
  const parsed = parseIndex(raw)
  if (!parsed) throw new Error('Indice delle cartelle non valido.')
  return parsed
}

async function writeIndex(index: AppIndex) {
  if (window.antropometriaBia) {
    await window.antropometriaBia.saveIndex(index)
    return
  }
  localStorage.setItem(LS_INDEX, JSON.stringify(index))
}

async function readWorkspace(id: string): Promise<WorkspaceFile | null> {
  const raw = window.antropometriaBia
    ? await window.antropometriaBia.loadWorkspace(id)
    : JSON.parse(localStorage.getItem(LS_WS(id)) ?? 'null')
  if (raw == null) return null
  const parsed = parseWorkspace(raw)
  if (!parsed) throw new Error('La cartella selezionata non è valida o è incompatibile.')
  return parsed
}

async function writeWorkspace(file: WorkspaceFile) {
  if (window.antropometriaBia) {
    await window.antropometriaBia.saveWorkspace(file.workspace.id, file)
    return
  }
  localStorage.setItem(LS_WS(file.workspace.id), JSON.stringify(file))
}

export async function deleteWorkspaceFiles(id: string) {
  if (window.antropometriaBia) await window.antropometriaBia.deleteWorkspace(id)
  else localStorage.removeItem(LS_WS(id))
}

export async function hydrateStore() {
  setPersistence({ status: 'loading', message: 'Caricamento archivio…', blocking: false })
  try {
    const index = await readIndex()
    useApp.getState().applyIndex(index)
    const id = index.activeWorkspaceId ?? index.workspaces[0]?.id
    if (!id) {
      useApp.setState({ ready: true })
      setPersistence({ status: 'idle', message: 'Archivio pronto', blocking: false })
      return
    }
    const ws = await readWorkspace(id)
    if (!ws) throw new Error('La cartella attiva non è stata trovata sul disco.')
    useApp.getState().applyWorkspace(ws)
    setPersistence({ status: 'idle', message: 'Archivio pronto', blocking: false })
  } catch (error) {
    console.error('Caricamento archivio non riuscito', error)
    useApp.setState({ ready: true })
    setPersistence({
      status: 'error',
      message: error instanceof Error ? error.message : 'Caricamento archivio non riuscito.',
      blocking: true
    })
  }
}

export async function switchWorkspace(id: string) {
  await flushPersist()
  const ws = await readWorkspace(id)
  if (!ws) return false
  useApp.getState().applyWorkspace(ws)
  return true
}

let timer: ReturnType<typeof setTimeout> | null = null
let persistBound = false
let persistChain: Promise<void> = Promise.resolve()

export function flushPersist(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  const snapshot = useApp.getState().snapshotWorkspace()
  const index = useApp.getState().index
  const operation = async () => {
    setPersistence({ status: 'saving', message: 'Salvataggio…', blocking: false })
    try {
      await Promise.all([writeIndex(index), snapshot ? writeWorkspace(snapshot) : Promise.resolve()])
      const lastSavedAt = new Date().toISOString()
      setPersistence({ status: 'saved', message: 'Salvato', lastSavedAt, blocking: false })
    } catch (error) {
      console.error('Salvataggio locale non riuscito', error)
      setPersistence({
        status: 'error',
        message: error instanceof Error ? error.message : 'Salvataggio locale non riuscito.',
        blocking: false
      })
      throw error
    }
  }
  persistChain = persistChain.catch(() => undefined).then(operation)
  return persistChain
}

export function bindAutosave() {
  if (!persistBound) {
    persistBound = true
    // Number fields intentionally commit on blur so decimal input is never
    // mangled while the user is still typing. Reflect that pending state and
    // force the final focused value to commit before a close handshake.
    document.addEventListener(
      'input',
      (event) => {
        if (event.target instanceof HTMLInputElement && event.target.type === 'number') {
          setPersistence({ status: 'idle', message: 'Modifica in corso…', blocking: false })
        }
      },
      true
    )
    window.addEventListener('pagehide', () => void flushPersist())
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void flushPersist()
    })
    window.addEventListener('dragover', (event) => event.preventDefault())
    window.addEventListener('drop', (event) => event.preventDefault())
    window.antropometriaBia?.onBeforeClose(async () => {
      try {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        await Promise.resolve()
        await flushPersist()
      } finally {
        window.antropometriaBia?.closeReady()
      }
    })
  }
  return useApp.subscribe(() => {
    if (!useApp.getState().ready) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void flushPersist(), 400)
  })
}
