import { useApp } from '../store/useApp'
import type { PersistPayload } from '@shared/types'

const LS_KEY = 'antropometria-bia.v1'

async function read(): Promise<PersistPayload | null> {
  try {
    if (window.antropometriaBia) return (await window.antropometriaBia.loadLibrary()) as PersistPayload
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as PersistPayload) : null
  } catch {
    return null
  }
}

async function write(payload: PersistPayload) {
  try {
    if (window.antropometriaBia) {
      await window.antropometriaBia.saveLibrary(payload)
      return
    }
    localStorage.setItem(LS_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export async function hydrateStore() {
  const data = await read()
  if (!data) {
    useApp.setState({ ready: true })
    return
  }
  useApp.getState().hydrate(data)
}

let t: ReturnType<typeof setTimeout> | null = null

export function flushPersist() {
  if (t) {
    clearTimeout(t)
    t = null
  }
  void write(useApp.getState().snapshot())
}

export function bindAutosave() {
  return useApp.subscribe(() => {
    if (!useApp.getState().ready) return
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      void write(useApp.getState().snapshot())
    }, 400)
  })
}
