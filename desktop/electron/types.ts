export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

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
