import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileNode } from './types';

async function readDirRecursive(
  dirPath: string,
  currentDepth: number = 1,
  maxDepth: number = 5
): Promise<FileNode[]> {
  if (currentDepth > maxDepth) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const children =
          currentDepth < maxDepth
            ? await readDirRecursive(fullPath, currentDepth + 1, maxDepth)
            : [];
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'folder',
          children,
        });
      } else if (entry.isFile()) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
        });
      }
    }

    nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'folder' ? -1 : 1;
    });

    return nodes;
  } catch (error) {
    console.error(`Error reading directory at ${dirPath}:`, error);
    return [];
  }
}

export function registerIpcHandlers(): void {
  // fs.readFile(path) -> string
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return await fs.readFile(filePath, 'utf-8');
  });

  // fs.writeFile(path, content) -> void
  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // fs.openDialog() -> string[]
  ipcMain.handle('fs:openDialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
    });
    return result.canceled ? [] : result.filePaths;
  });

  // fs.openFolderDialog() -> string
  ipcMain.handle('fs:openFolderDialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled || result.filePaths.length === 0 ? '' : result.filePaths[0];
  });

  // fs.saveDialog(defaultName) -> string
  ipcMain.handle('fs:saveDialog', async (_event, defaultName?: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
    });
    return result.canceled || !result.filePath ? '' : result.filePath;
  });

  // fs.readDir(path) -> FileNode[] (recursive, max depth 5)
  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    return await readDirRecursive(dirPath, 1, 5);
  });

  // app.getVersion() -> string
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  // app.platform() -> string
  ipcMain.handle('app:platform', () => {
    return process.platform;
  });
}
