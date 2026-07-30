/**
 * Maps file extensions to icon/emoji representations for the file tree.
 * Using simple SVG-style text icons for lightweight rendering.
 */

interface FileIconConfig {
  icon: string;
  color: string;
}

const extensionIcons: Record<string, FileIconConfig> = {
  // TypeScript
  '.ts':   { icon: 'TS', color: '#3178C6' },
  '.tsx':  { icon: 'TX', color: '#3178C6' },

  // JavaScript
  '.js':   { icon: 'JS', color: '#F7DF1E' },
  '.jsx':  { icon: 'JX', color: '#F7DF1E' },
  '.mjs':  { icon: 'JS', color: '#F7DF1E' },
  '.cjs':  { icon: 'JS', color: '#F7DF1E' },

  // Web
  '.html': { icon: '◇', color: '#E44D26' },
  '.htm':  { icon: '◇', color: '#E44D26' },
  '.css':  { icon: '#', color: '#1572B6' },
  '.scss': { icon: '#', color: '#CD6799' },
  '.less': { icon: '#', color: '#1D365D' },
  '.svg':  { icon: '◎', color: '#FFB13B' },

  // Data / Config
  '.json': { icon: '{}', color: '#8BC34A' },
  '.jsonc': { icon: '{}', color: '#8BC34A' },
  '.yaml': { icon: 'Y', color: '#CB171E' },
  '.yml':  { icon: 'Y', color: '#CB171E' },
  '.toml': { icon: 'T', color: '#9C4121' },
  '.xml':  { icon: '◇', color: '#F80' },
  '.env':  { icon: '⚙', color: '#ECD53F' },

  // Python
  '.py':   { icon: 'Py', color: '#3776AB' },

  // Rust
  '.rs':   { icon: 'Rs', color: '#DEA584' },

  // Go
  '.go':   { icon: 'Go', color: '#00ADD8' },

  // Java / Kotlin
  '.java': { icon: 'Jv', color: '#B07219' },
  '.kt':   { icon: 'Kt', color: '#A97BFF' },

  // C / C++ / C#
  '.c':    { icon: 'C', color: '#555555' },
  '.cpp':  { icon: 'C+', color: '#F34B7D' },
  '.h':    { icon: 'H', color: '#555555' },
  '.hpp':  { icon: 'H+', color: '#F34B7D' },
  '.cs':   { icon: 'C#', color: '#178600' },

  // Shell
  '.sh':   { icon: '$', color: '#89E051' },
  '.bash': { icon: '$', color: '#89E051' },
  '.zsh':  { icon: '$', color: '#89E051' },
  '.bat':  { icon: '>', color: '#C1F12E' },
  '.ps1':  { icon: 'PS', color: '#012456' },

  // Markup
  '.md':   { icon: 'M↓', color: '#083FA1' },
  '.mdx':  { icon: 'MX', color: '#083FA1' },

  // Database
  '.sql':  { icon: 'SQ', color: '#E38C00' },
  '.graphql': { icon: 'GQ', color: '#E535AB' },
  '.gql':  { icon: 'GQ', color: '#E535AB' },

  // Ruby / PHP
  '.rb':   { icon: 'Rb', color: '#CC342D' },
  '.php':  { icon: 'φ', color: '#777BB4' },

  // Swift / Dart
  '.swift': { icon: 'Sw', color: '#FA7343' },
  '.dart':  { icon: 'D', color: '#00B4AB' },

  // Misc
  '.lua':  { icon: 'Lu', color: '#000080' },
  '.r':    { icon: 'R', color: '#198CE7' },
  '.lock': { icon: '🔒', color: '#9090a8' },
  '.gitignore': { icon: 'G', color: '#F05032' },
};

const filenameIcons: Record<string, FileIconConfig> = {
  'Dockerfile':     { icon: '🐳', color: '#2496ED' },
  'docker-compose.yml': { icon: '🐳', color: '#2496ED' },
  'Makefile':       { icon: 'M', color: '#6D8086' },
  'package.json':   { icon: '📦', color: '#8BC34A' },
  'tsconfig.json':  { icon: 'TS', color: '#3178C6' },
  'vite.config.ts': { icon: '⚡', color: '#646CFF' },
  'README.md':      { icon: '📖', color: '#083FA1' },
  'LICENSE':        { icon: '©', color: '#9090a8' },
  '.gitignore':     { icon: 'G', color: '#F05032' },
  '.prettierrc':    { icon: 'P', color: '#F7B93E' },
  '.eslintrc':      { icon: 'E', color: '#4B32C3' },
  '.eslintrc.js':   { icon: 'E', color: '#4B32C3' },
  '.eslintrc.json': { icon: 'E', color: '#4B32C3' },
};

const folderIcon: FileIconConfig = { icon: '', color: '#7C5CBF' };
const defaultFileIcon: FileIconConfig = { icon: '◻', color: '#9090a8' };

/**
 * Returns the icon config for a given filename.
 */
export function getFileIcon(filename: string, isFolder: boolean): FileIconConfig {
  if (isFolder) {
    return folderIcon;
  }

  // Check exact filename
  if (filenameIcons[filename]) {
    return filenameIcons[filename];
  }

  // Check extension
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex !== -1) {
    const ext = filename.slice(dotIndex).toLowerCase();
    if (extensionIcons[ext]) {
      return extensionIcons[ext];
    }
  }

  return defaultFileIcon;
}
