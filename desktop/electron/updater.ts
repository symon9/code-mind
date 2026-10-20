import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';

export interface UpdateStatusPayload {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
}

export function setupAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  // Automatically download updates when available
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const notifyRenderer = (payload: UpdateStatusPayload) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('updater:status', payload);
    }
  };

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates on GitHub Releases...');
    notifyRenderer({ status: 'checking' });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log(`[AutoUpdater] Update available: v${info.version}`);
    notifyRenderer({
      status: 'available',
      version: info.version,
    });
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log(`[AutoUpdater] App is up to date: v${info.version}`);
    notifyRenderer({
      status: 'not-available',
      version: info.version,
    });
  });

  autoUpdater.on('error', (err: Error) => {
    console.warn('[AutoUpdater] Update check error:', err?.message || err);
    notifyRenderer({
      status: 'error',
      error: err?.message || 'Failed to check for updates',
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[AutoUpdater] Downloading: ${progressObj.percent?.toFixed(1)}%`);
    notifyRenderer({
      status: 'downloading',
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log(`[AutoUpdater] Update downloaded: v${info.version}`);
    notifyRenderer({
      status: 'downloaded',
      version: info.version,
    });
  });

  // Handle IPC manual update check
  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) {
      return {
        status: 'not-available',
        message: 'Auto-updates are active in packaged production builds.',
      };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        status: 'ok',
        version: result?.updateInfo?.version,
      };
    } catch (err: any) {
      return {
        status: 'error',
        error: err?.message || 'Error checking for updates',
      };
    }
  });

  // Handle IPC restart and install
  ipcMain.handle('updater:quitAndInstall', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Check for updates shortly after launch if packaged
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.log('[AutoUpdater] Initial update check suppressed:', err.message);
      });
    }, 5000);
  }
}
