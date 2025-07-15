import * as vscode from 'vscode';

export interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  modified?: Date;
  ignored?: boolean;
  relativePath: string;
  uri: vscode.Uri;
}

export interface FilterOptions {
  pattern: string;
  type: FilterType;
  caseSensitive: boolean;
  respectIgnore: boolean;
  maxResults: number;
}

export type FilterType = 'glob' | 'regex' | 'fuzzy';

export interface IFilter {
  apply(_files: FileItem[], _options: FilterOptions): Promise<FileItem[]>;
  isValid(_pattern: string): boolean;
}

export interface FilterResult {
  files: FileItem[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}

export interface FileTreeItem extends vscode.TreeItem {
  fileItem: FileItem;
  children?: FileTreeItem[];
}

export interface ExtensionConfig {
  defaultFilterMode: FilterType;
  respectGitignore: boolean;
  maxResults: number;
  caseSensitive: boolean;
  debounceDelay: number;
  showFileIcons: boolean;
  showFileSize: boolean;
  showModifiedDate: boolean;
}

export interface IgnorePattern {
  pattern: string;
  source: string; // .gitignore, .eslintignore, etc.
  negated: boolean;
}

export interface WorkspaceStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  lastScanned: Date;
}

export interface BookmarkedFilter {
  id: string;
  name: string;
  pattern: string;
  type: FilterType;
  caseSensitive: boolean;
  respectIgnore: boolean;
  createdAt: Date;
  lastUsed: Date;
}

export interface FilterHistory {
  pattern: string;
  type: FilterType;
  timestamp: Date;
  resultCount: number;
}

export interface PanelMessage {
  type: 'filterChange' | 'openFile' | 'refreshFiles' | 'exportResults' | 'saveBookmark';
  payload: any;
}

export interface PanelState {
  filter: FilterOptions;
  results: FileItem[];
  isLoading: boolean;
  error?: string;
  stats: WorkspaceStats;
  bookmarks: BookmarkedFilter[];
  history: FilterHistory[];
}

export interface FileServiceOptions {
  respectIgnore: boolean;
  maxDepth?: number;
  includeHidden?: boolean;
  followSymlinks?: boolean;
}

export interface IgnoreServiceOptions {
  respectGitignore: boolean;
  respectEslintignore: boolean;
  respectPrettierignore: boolean;
  customIgnoreFiles?: string[];
}

export interface FuzzyMatchOptions {
  threshold: number;
  includeScore: boolean;
  keys: string[];
  minMatchCharLength: number;
}

export interface GlobMatchOptions {
  dot: boolean;
  nobrace: boolean;
  noglobstar: boolean;
  noext: boolean;
  nocase: boolean;
}

export interface RegexMatchOptions {
  flags: string;
  timeout: number;
}

export interface PerformanceMetrics {
  filterTime: number;
  fileCount: number;
  memoryUsage: number;
  timestamp: Date;
}

export interface ExtensionContext {
  subscriptions: vscode.Disposable[];
  workspaceState: vscode.Memento;
  globalState: vscode.Memento;
  extensionUri: vscode.Uri;
} 