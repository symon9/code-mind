import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';
import { registerIpcHandlers } from './ipcHandlers';
import { setupMenu } from './menu';

let mainWindow: BrowserWindow | null = null;

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for update...');
  });

  autoUpdater.on('update-available', (info: any) => {
    console.log('[AutoUpdater] Update available:', info?.version);
  });

  autoUpdater.on('update-not-available', (info: any) => {
    console.log('[AutoUpdater] Update not available:', info?.version);
  });

  autoUpdater.on('error', (err: any) => {
    console.error('[AutoUpdater] Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj: any) => {
    console.log(
      `[AutoUpdater] Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
    );
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    console.log('[AutoUpdater] Update downloaded:', info?.version);
  });

  // Stub call for auto updater check
  autoUpdater.checkForUpdatesAndNotify().catch((err: any) => {
    console.log('[AutoUpdater] Auto-updater check stub handled:', err.message);
  });
}

function createWindow(): void {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const iconPath = path.join(__dirname, '../assets/icons/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f172a',
  });

  // Open external links in user's default browser safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    const rendererPath = path.join(__dirname, '../renderer/index.html');
    const altRendererPath = path.join(__dirname, 'renderer/index.html');
    if (fs.existsSync(rendererPath)) {
      mainWindow.loadFile(rendererPath);
    } else if (fs.existsSync(altRendererPath)) {
      mainWindow.loadFile(altRendererPath);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../react/dist/index.html'));
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  setupMenu(() => mainWindow);
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
