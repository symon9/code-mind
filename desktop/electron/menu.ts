import { Menu, MenuItemConstructorOptions, BrowserWindow, shell, dialog } from 'electron';

export function setupMenu(getMainWindow: () => BrowserWindow | null): Menu {
  const sendMenuAction = (action: string, payload?: any) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('menu:action', { action, payload });
    }
  };

  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'CodeMind',
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendMenuAction('file:new'),
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendMenuAction('file:open'),
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => sendMenuAction('file:open-folder'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendMenuAction('file:save'),
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendMenuAction('file:save-as'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          role: isMac ? 'close' : 'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', role: 'undo' },
        { label: 'Redo', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => sendMenuAction('edit:find'),
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => sendMenuAction('edit:replace'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => sendMenuAction('view:toggle-sidebar'),
        },
        {
          label: 'Toggle AI Panel',
          accelerator: 'CmdOrCtrl+J',
          click: () => sendMenuAction('view:toggle-ai-panel'),
        },
        { type: 'separator' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { label: 'Reset Zoom', role: 'resetZoom' },
      ],
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Chat with AI',
          click: () => sendMenuAction('ai:chat'),
        },
        {
          label: 'Explain Code',
          click: () => sendMenuAction('ai:explain-code'),
        },
        {
          label: 'Refactor Code',
          click: () => sendMenuAction('ai:refactor-code'),
        },
        {
          label: 'Debug Code',
          click: () => sendMenuAction('ai:debug-code'),
        },
        {
          label: 'Generate Code',
          click: () => sendMenuAction('ai:generate-code'),
        },
        { type: 'separator' },
        {
          label: 'Switch Provider',
          click: () => sendMenuAction('ai:switch-provider'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About CodeMind',
          click: () => {
            const win = getMainWindow();
            const options = {
              type: 'info' as const,
              title: 'About CodeMind',
              message: 'CodeMind AI Code Editor',
              detail: 'Version 1.0.0\nBuilt with NestJS, React, and Electron.',
            };
            if (win && !win.isDestroyed()) {
              dialog.showMessageBox(win, options);
            } else {
              dialog.showMessageBox(options);
            }
          },
        },
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/issues');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(menu);
  } else {
    Menu.setApplicationMenu(null);
  }
  return menu;
}
