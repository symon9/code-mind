/**
 * Maps file extensions to Monaco Editor language identifiers.
 */
const extensionToLanguage: Record<string, string> = {
  // JavaScript / TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',

  // Web
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.svg': 'xml',

  // Data / Config
  '.json': 'json',
  '.jsonc': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'ini',
  '.xml': 'xml',
  '.env': 'ini',

  // Scripting / Backend
  '.py': 'python',
  '.rb': 'ruby',
  '.php': 'php',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',

  // Shell
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.bat': 'bat',
  '.ps1': 'powershell',
  '.psm1': 'powershell',

  // Markup / Docs
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.tex': 'latex',

  // Database
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',

  // Docker / Infra
  '.dockerfile': 'dockerfile',

  // Misc
  '.lua': 'lua',
  '.r': 'r',
  '.dart': 'dart',
};

/**
 * Special filename mappings (no extension or special names).
 */
const filenameToLanguage: Record<string, string> = {
  'Dockerfile': 'dockerfile',
  'Makefile': 'makefile',
  'CMakeLists.txt': 'cmake',
  '.gitignore': 'ini',
  '.editorconfig': 'ini',
  '.prettierrc': 'json',
  '.eslintrc': 'json',
  'tsconfig.json': 'json',
  'package.json': 'json',
};

/**
 * Detects the Monaco language ID from a file path or file name.
 */
export function detectLanguage(filePath: string): string {
  // Extract filename
  const parts = filePath.replace(/\\/g, '/').split('/');
  const filename = parts[parts.length - 1] || '';

  // Check exact filename match
  if (filenameToLanguage[filename]) {
    return filenameToLanguage[filename];
  }

  // Check extension
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex !== -1) {
    const ext = filename.slice(dotIndex).toLowerCase();
    if (extensionToLanguage[ext]) {
      return extensionToLanguage[ext];
    }
  }

  return 'plaintext';
}

/**
 * Returns a human-readable language name for the status bar.
 */
export function getLanguageDisplayName(languageId: string): string {
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    markdown: 'Markdown',
    yaml: 'YAML',
    shell: 'Shell',
    rust: 'Rust',
    go: 'Go',
    java: 'Java',
    csharp: 'C#',
    cpp: 'C++',
    c: 'C',
    ruby: 'Ruby',
    php: 'PHP',
    sql: 'SQL',
    graphql: 'GraphQL',
    dockerfile: 'Dockerfile',
    bat: 'Batch',
    powershell: 'PowerShell',
    xml: 'XML',
    ini: 'INI',
    plaintext: 'Plain Text',
  };

  return displayNames[languageId] || languageId.charAt(0).toUpperCase() + languageId.slice(1);
}
