import { jest } from '@jest/globals';

// Mock VS Code API
const vscode = {
  workspace: {
    getConfiguration: jest.fn(),
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' }, name: 'test', index: 0 }],
    onDidChangeConfiguration: jest.fn(),
    createFileSystemWatcher: jest.fn(() => ({
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn(),
    })),
    openTextDocument: jest.fn(),
    fs: {
      readDirectory: jest.fn(),
      stat: jest.fn(),
      readFile: jest.fn(),
    },
  },
  window: {
    createTreeView: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showTextDocument: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  Uri: {
    file: jest.fn((path: string) => ({ 
      fsPath: path, 
      scheme: 'file', 
      authority: '', 
      path: path, 
      query: '', 
      fragment: '',
      with: jest.fn(),
      toJSON: jest.fn(),
      toString: jest.fn(),
    })),
    parse: jest.fn((path: string) => ({ 
      fsPath: path, 
      scheme: 'file', 
      authority: '', 
      path: path, 
      query: '', 
      fragment: '',
      with: jest.fn(),
      toJSON: jest.fn(),
      toString: jest.fn(),
    })),
    joinPath: jest.fn((base: any, ...paths: string[]) => ({
      fsPath: `${base.fsPath}/${paths.join('/')}`,
      scheme: 'file',
      authority: '',
      path: `${base.fsPath}/${paths.join('/')}`,
      query: '',
      fragment: '',
      with: jest.fn(),
      toJSON: jest.fn(),
      toString: jest.fn(),
    })),
  },
  env: {
    clipboard: {
      writeText: jest.fn(),
    },
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  TreeItem: class MockTreeItem {
    constructor(public _label: string, public _collapsibleState?: number) {
      // Mock implementation
    }
  },
  ThemeIcon: {
    File: 'file',
    Folder: 'folder',
  },
  EventEmitter: class MockEventEmitter {
    public listeners: Function[] = [];
    
    get event() {
      return (listener: Function) => {
        this.listeners.push(listener);
        return { dispose: () => {} };
      };
    }
    
    fire(data: any) {
      this.listeners.forEach(listener => listener(data));
    }
  },
  Disposable: {
    from: jest.fn((...disposables: any[]) => ({
      dispose: () => disposables.forEach(d => d.dispose?.()),
    })),
  },
};

// Mock Node.js fs module
const fs = {
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  constants: {
    F_OK: 0,
  },
};

// Mock path module
const path = {
  join: jest.fn((...paths: string[]) => paths.join('/')),
  resolve: jest.fn((...paths: string[]) => paths.join('/')),
  dirname: jest.fn((p: string) => p.split('/').slice(0, -1).join('/')),
  basename: jest.fn((p: string) => p.split('/').pop() || ''),
  extname: jest.fn((p: string) => {
    const parts = p.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }),
  sep: '/',
  posix: {
    join: jest.fn((...paths: string[]) => paths.join('/')),
    resolve: jest.fn((...paths: string[]) => paths.join('/')),
    dirname: jest.fn((p: string) => p.split('/').slice(0, -1).join('/')),
    basename: jest.fn((p: string) => p.split('/').pop() || ''),
    extname: jest.fn((p: string) => {
      const parts = p.split('.');
      return parts.length > 1 ? `.${parts.pop()}` : '';
    }),
  },
};

// Set up module mocks
jest.mock('vscode', () => vscode, { virtual: true });
jest.mock('fs', () => fs, { virtual: true });
jest.mock('path', () => path, { virtual: true });

// Global test utilities
export { vscode, fs, path };

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 