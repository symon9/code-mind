import { contextBridge, ipcRenderer } from 'electron';
import { FileNode } from './types';

contextBridge.exposeInMainWorld('codemind', {
  fs: {
    readFile: (path: string): Promise<string> => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, content: string): Promise<void> =>
      ipcRenderer.invoke('fs:writeFile', path, content),
    openDialog: (): Promise<string[]> => ipcRenderer.invoke('fs:openDialog'),
    openFolderDialog: (): Promise<string> => ipcRenderer.invoke('fs:openFolderDialog'),
    saveDialog: (defaultName?: string): Promise<string> =>
      ipcRenderer.invoke('fs:saveDialog', defaultName),
    readDir: (path: string): Promise<FileNode[]> => ipcRenderer.invoke('fs:readDir', path),
  },
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
    platform: (): Promise<string> => ipcRenderer.invoke('app:platform'),
  },
  updater: {
    checkForUpdates: (): Promise<{ status: string; version?: string; error?: string; message?: string }> =>
      ipcRenderer.invoke('updater:check'),
    quitAndInstall: (): Promise<void> => ipcRenderer.invoke('updater:quitAndInstall'),
    onStatusChange: (callback: (payload: any) => void) => {
      const listener = (_event: any, payload: any) => callback(payload);
      ipcRenderer.on('updater:status', listener);
      return () => {
        ipcRenderer.removeListener('updater:status', listener);
      };
    },
  },
});

