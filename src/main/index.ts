import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

app.setName('Antropometria BIA')
if (process.platform === 'win32') {
  app.setAppUserModelId('it.gabrovec.antropometria-bia')
}
app.setAboutPanelOptions({
  applicationName: 'Antropometria BIA',
  applicationVersion: '1.1.0',
  version: '1.1.0',
  copyright:
    '© 2026 Daniele Gabrovec. Tutti i diritti riservati. Vietata la riproduzione, anche parziale.',
  authors: ['Daniele Gabrovec']
})

function dataDir() {
  return join(app.getPath('userData'), 'antropometria-bia')
}

async function ensureDir() {
  const dir = dataDir()
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  return dir
}

function parentWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

function createWindow() {
  const iconFile = join(__dirname, '../../build/icon.png')
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0B1220',
    title: 'Antropometria BIA — Daniele Gabrovec',
    autoHideMenuBar: true,
    ...(existsSync(iconFile) ? { icon: iconFile } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL()
    if (
      url !== current &&
      !url.startsWith('file:') &&
      !url.startsWith(process.env.ELECTRON_RENDERER_URL ?? 'about:blank')
    ) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function workspaceFile(id: string) {
  return join(dataDir(), 'workspaces', id, 'library.json')
}

ipcMain.handle('abia:load-index', async () => {
  const dir = await ensureDir()
  const indexPath = join(dir, 'index.json')
  if (existsSync(indexPath)) {
    return JSON.parse(await readFile(indexPath, 'utf8'))
  }
  const legacy = join(dir, 'library.json')
  if (existsSync(legacy)) {
    const old = JSON.parse(await readFile(legacy, 'utf8')) as Record<string, unknown>
    const id = crypto.randomUUID()
    const wsDir = join(dir, 'workspaces', id)
    await mkdir(wsDir, { recursive: true })
    const workspace = {
      kind: 'antropometria-bia-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace: { id, name: 'Cartella principale', kind: 'studio' },
      doctors: [],
      patients: old.patients ?? [],
      visits: old.visits ?? [],
      settings: (old.draft as { settings?: unknown } | null)?.settings ?? old.settings ?? null,
      draft: old.draft ?? { selectedPatientId: null, selectedVisitId: null, activeDoctorId: null }
    }
    await writeFile(join(wsDir, 'library.json'), JSON.stringify(workspace, null, 2), 'utf8')
    const index = {
      kind: 'antropometria-bia-index',
      version: 1,
      workspaces: [{ id, name: 'Cartella principale', kind: 'studio' }],
      activeWorkspaceId: id
    }
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8')
    return index
  }
  return {
    kind: 'antropometria-bia-index',
    version: 1,
    workspaces: [],
    activeWorkspaceId: null
  }
})

ipcMain.handle('abia:save-index', async (_e, payload: unknown) => {
  const dir = await ensureDir()
  await writeFile(join(dir, 'index.json'), JSON.stringify(payload, null, 2), 'utf8')
  return { ok: true }
})

ipcMain.handle('abia:load-workspace', async (_e, id: string) => {
  const file = workspaceFile(id)
  if (!existsSync(file)) return null
  return JSON.parse(await readFile(file, 'utf8'))
})

ipcMain.handle('abia:save-workspace', async (_e, id: string, payload: unknown) => {
  const file = workspaceFile(id)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(payload, null, 2), 'utf8')
  return { ok: true }
})

ipcMain.handle('abia:delete-workspace', async (_e, id: string) => {
  const dir = join(dataDir(), 'workspaces', id)
  if (existsSync(dir)) await rm(dir, { recursive: true, force: true })
  return { ok: true }
})

ipcMain.handle(
  'abia:export-file',
  async (_e, opts: { defaultName: string; content: string; ext: string }) => {
    const win = parentWindow()
    const ext = opts.ext.replace('.', '')
    const dialogOpts = {
      defaultPath: opts.defaultName,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
    }
    const res = win ? await dialog.showSaveDialog(win, dialogOpts) : await dialog.showSaveDialog(dialogOpts)
    if (res.canceled || !res.filePath) return { ok: false }
    await writeFile(res.filePath, opts.content, 'utf8')
    return { ok: true, path: res.filePath }
  }
)

ipcMain.handle(
  'abia:export-buffer',
  async (_e, opts: { defaultName: string; base64: string; ext: string }) => {
    const win = parentWindow()
    const ext = opts.ext.replace('.', '')
    const dialogOpts = {
      defaultPath: opts.defaultName,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
    }
    const res = win ? await dialog.showSaveDialog(win, dialogOpts) : await dialog.showSaveDialog(dialogOpts)
    if (res.canceled || !res.filePath) return { ok: false }
    await writeFile(res.filePath, Buffer.from(opts.base64, 'base64'))
    return { ok: true, path: res.filePath }
  }
)

ipcMain.handle('abia:import-file', async (_e, filters?: { name: string; extensions: string[] }[]) => {
  const win = parentWindow()
  const dialogOpts = {
    properties: ['openFile' as const],
    filters: filters ?? [
      { name: 'JSON / XLS', extensions: ['json', 'xls', 'xlsx'] },
      { name: 'Tutti i file', extensions: ['*'] }
    ]
  }
  const res = win ? await dialog.showOpenDialog(win, dialogOpts) : await dialog.showOpenDialog(dialogOpts)
  if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true }
  const path = res.filePaths[0]
  const buf = await readFile(path)
  const isText = /\.(json|html|htm|csv|xml|xls)$/i.test(path)
  return {
    ok: true,
    path,
    content: isText ? buf.toString('utf8') : undefined,
    base64: buf.toString('base64')
  }
})

async function htmlWindow(html: string): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: { sandbox: true, contextIsolation: true }
  })
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  return win
}

ipcMain.handle('abia:print-html', async (_e, html: string) => {
  const win = await htmlWindow(html)
  await new Promise<void>((resolve) => {
    win.webContents.print({ silent: false }, () => resolve())
  })
  win.close()
  return { ok: true }
})

ipcMain.handle('abia:pdf-html', async (_e, html: string, defaultName: string) => {
  const parent = parentWindow()
  const dialogOpts = {
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  }
  const res = parent
    ? await dialog.showSaveDialog(parent, dialogOpts)
    : await dialog.showSaveDialog(dialogOpts)
  if (res.canceled || !res.filePath) return { ok: false }
  const win = await htmlWindow(html)
  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { marginType: 'default' }
  })
  win.close()
  await writeFile(res.filePath, pdf)
  return { ok: true, path: res.filePath }
})

ipcMain.handle('abia:print', async () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return { ok: false }
  win.webContents.print({ silent: false })
  return { ok: true }
})

ipcMain.handle('abia:pdf', async (_e, defaultName: string) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return { ok: false }
  const res = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (res.canceled || !res.filePath) return { ok: false }
  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    margins: { marginType: 'default' }
  })
  await writeFile(res.filePath, pdf)
  return { ok: true, path: res.filePath }
})

ipcMain.handle('abia:open-path', async (_e, p: string) => {
  shell.showItemInFolder(p)
})
