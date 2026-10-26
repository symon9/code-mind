import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerIpcHandlers } from './ipcHandlers';
import { setupMenu } from './menu';
import { setupAutoUpdater } from './updater';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const possibleIconPaths = [
    path.join(__dirname, '../assets/icons/icon.ico'),
    path.join(process.resourcesPath, 'assets/icons/icon.ico'),
    path.join(__dirname, '../assets/icons/icon.png'),
    path.join(process.resourcesPath, 'assets/icons/icon.png'),
  ];
  const iconPath = possibleIconPaths.find((p) => fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: iconPath,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111622',
      symbolColor: '#94a3b8',
      height: 36,
    },
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
  setupAutoUpdater(() => mainWindow);

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
