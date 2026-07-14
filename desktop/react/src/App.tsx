import { useState } from 'react';
import type { Project, FileItem, Message } from '@codemind/shared';

// Mock Initial Data
const mockProject: Project = {
  id: 'proj-1',
  name: 'codemind-core',
  path: '/Users/developer/projects/codemind-core',
  createdAt: new Date().toISOString()
};

const mockFiles: FileItem[] = [
  { id: '1', name: 'src', path: '/src', isDirectory: true },
  { id: '2', name: 'main.ts', path: '/src/main.ts', isDirectory: false, content: `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();`, size: 180 },
  { id: '3', name: 'app.controller.ts', path: '/src/app.controller.ts', isDirectory: false, content: `import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Welcome to CodeMind AI Backend!';
  }
}`, size: 195 },
  { id: '4', name: 'package.json', path: '/package.json', isDirectory: false, content: `{
  "name": "codemind-backend",
  "version": "1.0.0",
  "dependencies": {
    "@nestjs/common": "^10.0.0"
  }
}`, size: 120 }
];

const mockChatMessages: Message[] = [
  { id: 'm1', role: 'system', content: 'CodeMind AI Assistant initialized and ready.', createdAt: new Date().toISOString() },
  { id: 'm2', role: 'user', content: 'How do I add a new controller in NestJS?', createdAt: new Date().toISOString() },
  { id: 'm3', role: 'assistant', content: 'You can generate a controller using the NestJS CLI by running:\n`nest g controller <name>`\n\nOr you can write one manually by decorating a class with `@Controller()` from `@nestjs/common`.', createdAt: new Date().toISOString() }
];

export default function App() {
  const [currentProject] = useState<Project>(mockProject);
  const [files] = useState<FileItem[]>(mockFiles);
  const [selectedFile, setSelectedFile] = useState<FileItem>(mockFiles[1]);
  const [chatMessages, setChatMessages] = useState<Message[]>(mockChatMessages);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      createdAt: new Date().toISOString()
    };

    const botMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: `I received your prompt: "${inputMessage}". As this is scaffolding, I am returning a simulated response. Once backend is connected, I will stream real AI responses!`,
      createdAt: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg, botMsg]);
    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            CodeMind
          </span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            v1.0.0-Scaffold
          </span>
        </div>
        <div className="text-sm font-medium text-slate-400">
          Project: <span className="text-indigo-400 font-mono">{currentProject.name}</span> ({currentProject.path})
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-slate-400">AI Daemon Online</span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: File Tree */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Files</h2>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.map(file => (
              <button
                key={file.id}
                onClick={() => !file.isDirectory && setSelectedFile(file)}
                className={`w-full flex items-center px-3 py-2 rounded text-sm transition-all duration-200 ${
                  file.isDirectory
                    ? 'text-slate-400 font-semibold cursor-default'
                    : selectedFile.id === file.id
                    ? 'bg-indigo-600/30 text-indigo-200 border-l-2 border-indigo-500 pl-2'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                {file.isDirectory ? (
                  <span className="mr-2 text-indigo-400">📁</span>
                ) : (
                  <span className="mr-2 text-cyan-400">📄</span>
                )}
                <span className="truncate font-mono">{file.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-mono">ACTIVE FILE:</span>
              <span className="text-sm font-semibold text-cyan-400 font-mono">{selectedFile.name}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{selectedFile.size} bytes</span>
          </div>

          <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed bg-slate-950/40 relative">
            <pre className="text-slate-300 select-text whitespace-pre-wrap">
              <code>{selectedFile.content || '// Directory or Empty File'}</code>
            </pre>
          </div>
        </main>

        {/* Right Sidebar: AI Assistant */}
        <aside className="w-80 bg-slate-900/50 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">CodeMind AI</h2>
            <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
              Copilot Active
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === 'user'
                    ? 'ml-auto bg-indigo-600/20 border border-indigo-500/30 text-indigo-100'
                    : msg.role === 'system'
                    ? 'mx-auto bg-slate-800/40 border border-slate-700/30 text-slate-400 text-center text-xs'
                    : 'mr-auto bg-slate-800/60 border border-slate-700/50 text-slate-200'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-semibold uppercase">
                  {msg.role}
                </div>
                <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/80">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask CodeMind AI..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-2 text-sm font-semibold transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </aside>
      </div>

      {/* Footer Status Bar */}
      <footer className="px-6 py-2 bg-indigo-950/20 border-t border-slate-900 text-xs text-slate-500 flex justify-between items-center font-mono">
        <div>Ln 1, Col 1 | UTF-8 | TypeScript</div>
        <div>Workspace: Electron + React + NestJS</div>
      </footer>
    </div>
  );
}
