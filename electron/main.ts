import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { app, BrowserWindow, dialog, ipcMain } = require('electron') as typeof import('electron');
type OpenDialogOptions = import('electron').OpenDialogOptions;

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: Electron.BrowserWindow | null = null;
const WINDOW_WIDTH = 520;
const WINDOW_HEIGHT_EXPANDED = 460;
const WINDOW_HEIGHT_COLLAPSED = 302;

function getTargetWindow(sender: Electron.WebContents) {
  return BrowserWindow.fromWebContents(sender) ?? win;
}

function createWindow() {
  win = new BrowserWindow({
    useContentSize: true,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT_COLLAPSED,
    minWidth: WINDOW_WIDTH,
    maxWidth: WINDOW_WIDTH,
    minHeight: WINDOW_HEIGHT_COLLAPSED,
    maxHeight: WINDOW_HEIGHT_EXPANDED,
    resizable: true,
    frame: false,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  ipcMain.handle('retroamp:open-audio-files', async () => {
    const owner = win ?? BrowserWindow.getFocusedWindow();
    const options: OpenDialogOptions = {
      title: 'Select audio files',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    };

    const result = owner
      ? await dialog.showOpenDialog(owner, options)
      : await dialog.showOpenDialog(options);

    if (result.canceled) return [];
    return result.filePaths ?? [];
  });

  ipcMain.handle('retroamp:window-minimize', (event) => {
    const target = getTargetWindow(event.sender);
    if (!target) return false;
    target.minimize();
    if (!target.isMinimized() && target.isVisible()) {
      target.hide();
    }
    return target.isMinimized() || !target.isVisible();
  });

  ipcMain.handle('retroamp:window-close', (event) => {
    const target = getTargetWindow(event.sender);
    target?.close();
    return true;
  });

  ipcMain.handle('retroamp:window-set-playlist-collapsed', (event, collapsed: boolean) => {
    const target = getTargetWindow(event.sender);
    if (!target) return false;
    const nextHeight = collapsed ? WINDOW_HEIGHT_COLLAPSED : WINDOW_HEIGHT_EXPANDED;
    const [x, y] = target.getPosition();
    target.setBounds({ x, y, width: WINDOW_WIDTH, height: nextHeight }, true);
    target.setContentSize(WINDOW_WIDTH, nextHeight, true);
    target.center();
    const [, currentH] = target.getSize();
    return currentH === nextHeight;
  });

  ipcMain.handle('retroamp:window-hide', (event) => {
    const target = getTargetWindow(event.sender);
    if (!target) return false;
    target.hide();
    return !target.isVisible();
  });

  createWindow();
});
