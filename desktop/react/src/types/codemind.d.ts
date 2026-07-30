import type { FileNode } from './index';

export interface CodeMindAPI {
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    openDialog: () => Promise<string[]>;
    openFolderDialog: () => Promise<string>;
    saveDialog: (defaultName?: string) => Promise<string>;
    readDir: (path: string) => Promise<FileNode[]>;
  };
  app: {
    getVersion: () => Promise<string>;
    platform: () => Promise<string>;
  };
}

declare global {
  interface Window {
    codemind: CodeMindAPI;
  }
}

export {};
