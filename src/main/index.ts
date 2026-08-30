import { app, BrowserWindow, dialog, ipcMain, session, shell, type IpcMainInvokeEvent } from 'electron'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MAX_IMPORT_BYTES = 50 * 1024 * 1024
const MAX_TEXT_EXPORT_CHARS = 25 * 1024 * 1024
const MAX_BINARY_EXPORT_BYTES = 50 * 1024 * 1024
const WORKSPACE_ID = /^[A-Za-z0-9_-]{1,80}$/
const EXPORT_EXTENSIONS = new Set(['json', 'html', 'xls', 'xlsx', 'docx', 'pdf'])
const SUPPORT_EMAIL = 'info.dottdanielegabrovec@gmail.com'
const recentExports = new Set<string>()

app.setName('Antropometria BIA')
// The app is entirely 2D and must remain readable on workstations with strict
// application-control policies or unstable GPU drivers. Canvas charts retain
// their full resolution through Chromium's software renderer.
app.disableHardwareAcceleration()
if (process.platform === 'win32') app.setAppUserModelId('it.gabrovec.antropometria-bia')

const qaUserData = process.env.ANTROPOMETRIA_BIA_USER_DATA_DIR
if (qaUserData && isAbsolute(qaUserData)) app.setPath('userData', resolve(qaUserData))

app.setAboutPanelOptions({
  applicationName: 'Antropometria BIA',
  applicationVersion: app.getVersion(),
  version: app.getVersion(),
  copyright: '© 2026 Daniele Gabrovec · Licenza MIT',
  authors: ['Daniele Gabrovec']
})

function dataDir() {
  return join(app.getPath('userData'), 'antropometria-bia')
}

async function ensureDir() {
  const dir = dataDir()
  await mkdir(dir, { recursive: true })
  return dir
}

function parentWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

function assertWorkspaceId(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !WORKSPACE_ID.test(id)) throw new Error('Identificativo cartella non valido.')
}

function assertTrustedSender(event: IpcMainInvokeEvent) {
  const url = event.senderFrame?.url ?? event.sender.getURL()
  const devUrl = process.env.ELECTRON_RENDERER_URL
  let trusted = false
  try {
    trusted = devUrl
      ? new URL(url).origin === new URL(devUrl).origin
      : url.split(/[?#]/)[0] === pathToFileURL(join(__dirname, '../renderer/index.html')).href
  } catch {
    trusted = false
  }
  if (!trusted) throw new Error('Richiesta IPC rifiutata: origine non attendibile.')
}

function workspaceFile(id: unknown) {
  assertWorkspaceId(id)
  const root = resolve(dataDir(), 'workspaces')
  const file = resolve(root, id, 'library.json')
  const rel = relative(root, file)
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Percorso cartella non valido.')
  return file
}

function safeExtension(raw: unknown): string {
  const ext = String(raw ?? '').replace(/^\./, '').toLowerCase()
  if (!EXPORT_EXTENSIONS.has(ext)) throw new Error('Formato file non consentito.')
  return ext
}

function safeDefaultName(raw: unknown, ext: string): string {
  const cleaned = basename(String(raw ?? 'export')).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').trim()
  const stem = cleaned.replace(/\.[^.]+$/, '').slice(0, 120) || 'export'
  return `${stem}.${ext}`
}

function assertText(value: unknown, maxChars = MAX_TEXT_EXPORT_CHARS): asserts value is string {
  if (typeof value !== 'string' || value.length > maxChars) throw new Error('Contenuto file non valido o troppo grande.')
}

async function writeJsonAtomic(path: string, payload: unknown) {
  const folder = dirname(path)
  await mkdir(folder, { recursive: true })
  const tmp = join(folder, `.${basename(path)}.${process.pid}.${Date.now()}.tmp`)
  const backup = `${path}.bak`
  const content = JSON.stringify(payload, null, 2)
  if (content.length > MAX_TEXT_EXPORT_CHARS) throw new Error('Archivio locale troppo grande.')
  try {
    if (existsSync(path)) await copyFile(path, backup)
    await writeFile(tmp, content, { encoding: 'utf8', flag: 'wx' })
    await rename(tmp, path)
  } catch (error) {
    await rm(tmp, { force: true })
    throw error
  }
}

async function readJsonWithBackup(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (primaryError) {
    const backup = `${path}.bak`
    if (!existsSync(backup)) throw primaryError
    const recovered = JSON.parse(await readFile(backup, 'utf8'))
    await writeJsonAtomic(path, recovered)
    const win = parentWindow()
    const options = {
      type: 'warning' as const,
      title: 'Archivio recuperato',
      message: 'Il file principale era danneggiato. È stata ripristinata automaticamente la copia di sicurezza.',
      detail: `Origine recupero: ${basename(path)}.bak`
    }
    if (win) await dialog.showMessageBox(win, options)
    else await dialog.showMessageBox(options)
    return recovered
  }
}

function canOpenExternal(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (url.protocol === 'mailto:') {
      return url.pathname.toLowerCase() === SUPPORT_EMAIL && url.search === '' && url.hash === ''
    }
    return url.protocol === 'https:' && url.hostname === 'github.com'
  } catch {
    return false
  }
}

function configureNavigation(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (canOpenExternal(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (url === win.webContents.getURL()) return
    event.preventDefault()
    if (canOpenExternal(url)) void shell.openExternal(url)
  })
}

function createWindow() {
  const iconFile = join(__dirname, '../../build/icon.png')
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0B1220',
    title: `Antropometria BIA${qaUserData ? ' [QA]' : ''} — Daniele Gabrovec`,
    autoHideMenuBar: true,
    ...(existsSync(iconFile) ? { icon: iconFile } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  configureNavigation(win)
  let closeApproved = false
  win.on('close', (event) => {
    if (closeApproved || win.webContents.isDestroyed()) return
    event.preventDefault()
    win.webContents.send('abia:before-close')
  })
  ipcMain.once(`abia:close-ready:${win.webContents.id}`, () => {
    closeApproved = true
    win.close()
  })

  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('abia:load-index', async (event) => {
  assertTrustedSender(event)
  const dir = await ensureDir()
  const indexPath = join(dir, 'index.json')
  if (existsSync(indexPath)) return readJsonWithBackup(indexPath)
  const legacy = join(dir, 'library.json')
  if (existsSync(legacy)) {
    const old = (await readJsonWithBackup(legacy)) as Record<string, unknown>
    const id = crypto.randomUUID()
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
    await writeJsonAtomic(workspaceFile(id), workspace)
    const index = {
      kind: 'antropometria-bia-index',
      version: 1,
      workspaces: [{ id, name: 'Cartella principale', kind: 'studio' }],
      activeWorkspaceId: id
    }
    await writeJsonAtomic(indexPath, index)
    return index
  }
  return { kind: 'antropometria-bia-index', version: 1, workspaces: [], activeWorkspaceId: null }
})

ipcMain.handle('abia:save-index', async (event, payload: unknown) => {
  assertTrustedSender(event)
  const dir = await ensureDir()
  await writeJsonAtomic(join(dir, 'index.json'), payload)
  return { ok: true }
})

ipcMain.handle('abia:load-workspace', async (event, id: unknown) => {
  assertTrustedSender(event)
  const file = workspaceFile(id)
  if (!existsSync(file)) return null
  return readJsonWithBackup(file)
})

ipcMain.handle('abia:save-workspace', async (event, id: unknown, payload: unknown) => {
  assertTrustedSender(event)
  const file = workspaceFile(id)
  await writeJsonAtomic(file, payload)
  return { ok: true }
})

ipcMain.handle('abia:delete-workspace', async (event, id: unknown) => {
  assertTrustedSender(event)
  const file = workspaceFile(id)
  const dir = dirname(file)
  if (existsSync(dir)) await rm(dir, { recursive: true, force: true })
  return { ok: true }
})

ipcMain.handle('abia:export-file', async (event, opts: { defaultName?: unknown; content?: unknown; ext?: unknown }) => {
  assertTrustedSender(event)
  const ext = safeExtension(opts?.ext)
  assertText(opts?.content)
  const win = parentWindow()
  const dialogOpts = {
    defaultPath: safeDefaultName(opts.defaultName, ext),
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
  }
  const res = win ? await dialog.showSaveDialog(win, dialogOpts) : await dialog.showSaveDialog(dialogOpts)
  if (res.canceled || !res.filePath) return { ok: false }
  await writeFile(res.filePath, opts.content, 'utf8')
  recentExports.add(resolve(res.filePath))
  return { ok: true, path: res.filePath }
})

ipcMain.handle('abia:export-buffer', async (event, opts: { defaultName?: unknown; base64?: unknown; ext?: unknown }) => {
  assertTrustedSender(event)
  const ext = safeExtension(opts?.ext)
  assertText(opts?.base64, Math.ceil((MAX_BINARY_EXPORT_BYTES * 4) / 3) + 8)
  const buffer = Buffer.from(opts.base64, 'base64')
  if (buffer.byteLength > MAX_BINARY_EXPORT_BYTES) throw new Error('File binario troppo grande.')
  const win = parentWindow()
  const dialogOpts = {
    defaultPath: safeDefaultName(opts.defaultName, ext),
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
  }
  const res = win ? await dialog.showSaveDialog(win, dialogOpts) : await dialog.showSaveDialog(dialogOpts)
  if (res.canceled || !res.filePath) return { ok: false }
  await writeFile(res.filePath, buffer)
  recentExports.add(resolve(res.filePath))
  return { ok: true, path: res.filePath }
})

ipcMain.handle('abia:import-file', async (event, filters?: { name: string; extensions: string[] }[]) => {
  assertTrustedSender(event)
  const normalizedFilters = Array.isArray(filters)
    ? filters.slice(0, 8).map((filter) => ({
        name: String(filter.name).slice(0, 80),
        extensions: filter.extensions.map((ext) => safeExtension(ext)).slice(0, 8)
      }))
    : [{ name: 'JSON / XLS', extensions: ['json', 'xls', 'xlsx'] }]
  const win = parentWindow()
  const dialogOpts = { properties: ['openFile' as const], filters: normalizedFilters }
  const res = win ? await dialog.showOpenDialog(win, dialogOpts) : await dialog.showOpenDialog(dialogOpts)
  if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true }
  const path = res.filePaths[0]
  const fileStat = await stat(path)
  if (!fileStat.isFile() || fileStat.size > MAX_IMPORT_BYTES) throw new Error('Il file supera il limite di 50 MB.')
  const buf = await readFile(path)
  const isText = /\.(json|html|htm|csv|xml|xls)$/i.test(path)
  return { ok: true, path, content: isText ? buf.toString('utf8') : undefined, base64: buf.toString('base64') }
})

async function htmlWindow(html: unknown): Promise<{ win: BrowserWindow; cleanup: () => Promise<void> }> {
  assertText(html)
  const tmp = join(tmpdir(), `antropometria-bia-${Date.now()}-${Math.random().toString(36).slice(2)}.html`)
  await writeFile(tmp, html, 'utf8')
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  configureNavigation(win)
  const cleanup = async () => {
    if (!win.isDestroyed()) win.destroy()
    await rm(tmp, { force: true })
  }
  try {
    await win.loadFile(tmp)
    return { win, cleanup }
  } catch (error) {
    await cleanup()
    throw error
  }
}

ipcMain.handle('abia:print-html', async (event, html: unknown) => {
  assertTrustedSender(event)
  let cleanup: (() => Promise<void>) | undefined
  try {
    const page = await htmlWindow(html)
    cleanup = page.cleanup
    const ok = await new Promise<boolean>((resolvePrint) => {
      page.win.webContents.print({ silent: false, printBackground: true }, (success) => resolvePrint(success))
    })
    return { ok }
  } catch (error) {
    console.error(error)
    return { ok: false }
  } finally {
    await cleanup?.()
  }
})

ipcMain.handle('abia:pdf-html', async (event, html: unknown, defaultName: unknown) => {
  assertTrustedSender(event)
  let cleanup: (() => Promise<void>) | undefined
  try {
    assertText(html)
    const parent = parentWindow()
    const dialogOpts = {
      defaultPath: safeDefaultName(defaultName, 'pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    }
    const res = parent ? await dialog.showSaveDialog(parent, dialogOpts) : await dialog.showSaveDialog(dialogOpts)
    if (res.canceled || !res.filePath) return { ok: false }
    const page = await htmlWindow(html)
    cleanup = page.cleanup
    const pdf = await page.win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.35, bottom: 0.35, left: 0.35, right: 0.35 }
    })
    await writeFile(res.filePath, pdf)
    recentExports.add(resolve(res.filePath))
    return { ok: true, path: res.filePath }
  } catch (error) {
    console.error(error)
    return { ok: false }
  } finally {
    await cleanup?.()
  }
})

ipcMain.handle('abia:open-path', async (event, rawPath: unknown) => {
  assertTrustedSender(event)
  if (typeof rawPath !== 'string' || !isAbsolute(rawPath)) throw new Error('Percorso non valido.')
  const path = resolve(rawPath)
  if (!recentExports.has(path)) throw new Error('Il percorso non appartiene a un export di questa sessione.')
  shell.showItemInFolder(path)
})

ipcMain.on('abia:close-ready', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  ipcMain.emit(`abia:close-ready:${event.sender.id}`)
})
