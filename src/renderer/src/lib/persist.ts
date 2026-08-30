import { useApp } from '../store/useApp'
import type { AppIndex, WorkspaceFile } from '@shared/types'
import { EMPTY_INDEX } from '@shared/types'
import { parseIndex, parseWorkspace } from '@shared/library'

const LS_INDEX = 'antropometria-bia.index.v2'
const LS_WS = (id: string) => `antropometria-bia.ws.${id}`

async function readIndex(): Promise<AppIndex> {
  try {
    if (window.antropometriaBia) {
      const raw = await window.antropometriaBia.loadIndex()
      return parseIndex(raw) ?? { ...EMPTY_INDEX }
    }
    const raw = localStorage.getItem(LS_INDEX)
    return raw ? (parseIndex(JSON.parse(raw)) ?? { ...EMPTY_INDEX }) : { ...EMPTY_INDEX }
  } catch {
    return { ...EMPTY_INDEX }
  }
}

async function writeIndex(index: AppIndex) {
  try {
    if (window.antropometriaBia) {
      await window.antropometriaBia.saveIndex(index)
      return
    }
    localStorage.setItem(LS_INDEX, JSON.stringify(index))
  } catch {
    /* ignore */
  }
}

async function readWorkspace(id: string): Promise<WorkspaceFile | null> {
  try {
    if (window.antropometriaBia) {
      const raw = await window.antropometriaBia.loadWorkspace(id)
      return parseWorkspace(raw)
    }
    const raw = localStorage.getItem(LS_WS(id))
    return raw ? parseWorkspace(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

async function writeWorkspace(file: WorkspaceFile) {
  try {
    if (window.antropometriaBia) {
      await window.antropometriaBia.saveWorkspace(file.workspace.id, file)
      return
    }
    localStorage.setItem(LS_WS(file.workspace.id), JSON.stringify(file))
  } catch {
    /* ignore */
  }
}

export async function deleteWorkspaceFiles(id: string) {
  try {
    if (window.antropometriaBia) {
      await window.antropometriaBia.deleteWorkspace(id)
      return
    }
    localStorage.removeItem(LS_WS(id))
  } catch {
    /* ignore */
  }
}

export async function hydrateStore() {
  const index = await readIndex()
  useApp.getState().applyIndex(index)
  const id = index.activeWorkspaceId ?? index.workspaces[0]?.id
  if (!id) {
    useApp.setState({ ready: true })
    return
  }
  const ws = await readWorkspace(id)
  if (ws) useApp.getState().applyWorkspace(ws)
  else useApp.setState({ ready: true })
}

export async function switchWorkspace(id: string) {
  flushPersist()
  const ws = await readWorkspace(id)
  if (!ws) return false
  useApp.getState().applyWorkspace(ws)
  return true
}

let t: ReturnType<typeof setTimeout> | null = null

export function flushPersist() {
  if (t) {
    clearTimeout(t)
    t = null
  }
  const snap = useApp.getState().snapshotWorkspace()
  const index = useApp.getState().index
  void writeIndex(index)
  if (snap) void writeWorkspace(snap)
}

export function bindAutosave() {
  return useApp.subscribe(() => {
    if (!useApp.getState().ready) return
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      flushPersist()
    }, 400)
  })
}
