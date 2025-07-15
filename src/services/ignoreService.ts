import * as vscode from 'vscode';
import { IgnorePattern, IgnoreServiceOptions } from '../types';
import { normalizePath, joinPath } from '../utils/pathUtils';

export class IgnoreService {
  private ignorePatterns: Map<string, IgnorePattern[]> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastLoadTime = 0;

  constructor(private _context: vscode.ExtensionContext) {}

  async isIgnored(filePath: string, options: IgnoreServiceOptions): Promise<boolean> {
    const workspaceFolder = this.getWorkspaceFolder();
    if (!workspaceFolder) {
      return false;
    }

    const patterns = await this.getIgnorePatterns(workspaceFolder, options);
    const relativePath = this.getRelativePath(workspaceFolder, filePath);
    
    return this.matchesIgnorePattern(relativePath, patterns);
  }

  async getIgnorePatterns(workspaceFolder: vscode.WorkspaceFolder, options: IgnoreServiceOptions): Promise<IgnorePattern[]> {
    const cacheKey = this.getCacheKey(workspaceFolder, options);
    const cached = this.ignorePatterns.get(cacheKey);
    
    if (cached && this.isCacheValid()) {
      return cached;
    }

    const patterns: IgnorePattern[] = [];

    if (options.respectGitignore) {
      patterns.push(...await this.loadGitignorePatterns(workspaceFolder));
    }

    if (options.respectEslintignore) {
      patterns.push(...await this.loadEslintignorePatterns(workspaceFolder));
    }

    if (options.respectPrettierignore) {
      patterns.push(...await this.loadPrettierignorePatterns(workspaceFolder));
    }

    if (options.customIgnoreFiles) {
      for (const file of options.customIgnoreFiles) {
        patterns.push(...await this.loadCustomIgnorePatterns(workspaceFolder, file));
      }
    }

    this.ignorePatterns.set(cacheKey, patterns);
    this.lastLoadTime = Date.now();
    
    return patterns;
  }

  private async loadGitignorePatterns(workspaceFolder: vscode.WorkspaceFolder): Promise<IgnorePattern[]> {
    return this.loadIgnoreFile(workspaceFolder, '.gitignore');
  }

  private async loadEslintignorePatterns(workspaceFolder: vscode.WorkspaceFolder): Promise<IgnorePattern[]> {
    return this.loadIgnoreFile(workspaceFolder, '.eslintignore');
  }

  private async loadPrettierignorePatterns(workspaceFolder: vscode.WorkspaceFolder): Promise<IgnorePattern[]> {
    return this.loadIgnoreFile(workspaceFolder, '.prettierignore');
  }

  private async loadCustomIgnorePatterns(workspaceFolder: vscode.WorkspaceFolder, fileName: string): Promise<IgnorePattern[]> {
    return this.loadIgnoreFile(workspaceFolder, fileName);
  }

  private async loadIgnoreFile(workspaceFolder: vscode.WorkspaceFolder, fileName: string): Promise<IgnorePattern[]> {
    const patterns: IgnorePattern[] = [];
    const ignoreFilePath = joinPath(workspaceFolder.uri.fsPath, fileName);
    
    try {
      const uri = vscode.Uri.file(ignoreFilePath);
      const content = await vscode.workspace.fs.readFile(uri);
      const lines = content.toString().split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const negated = trimmed.startsWith('!');
          const pattern = negated ? trimmed.substring(1) : trimmed;
          
          patterns.push({
            pattern: normalizePath(pattern),
            source: fileName,
            negated
          });
        }
      }
    } catch (error) {
      // Ignore file doesn't exist or can't be read
    }

    return patterns;
  }

  private matchesIgnorePattern(filePath: string, patterns: IgnorePattern[]): boolean {
    let ignored = false;
    
    for (const pattern of patterns) {
      if (this.matchesPattern(filePath, pattern.pattern)) {
        if (pattern.negated) {
          ignored = false;
        } else {
          ignored = true;
        }
      }
    }

    return ignored;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Handle directory patterns
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern.slice(0, -1) + '/');
    }

    // Handle glob patterns
    if (pattern.includes('*')) {
      const regex = this.globToRegex(pattern);
      return regex.test(filePath);
    }

    // Handle exact matches
    if (pattern.startsWith('/')) {
      return filePath === pattern.substring(1) || filePath.startsWith(pattern.substring(1) + '/');
    }

    // Handle relative patterns
    const segments = filePath.split('/');
    for (let i = 0; i < segments.length; i++) {
      const subPath = segments.slice(i).join('/');
      if (subPath === pattern || subPath.startsWith(pattern + '/')) {
        return true;
      }
    }

    return false;
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/\./g, '\\.')
      .replace(/\+/g, '\\+')
      .replace(/\?/g, '\\?')
      .replace(/\^/g, '\\^')
      .replace(/\$/g, '\\$')
      .replace(/\|/g, '\\|')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');

    const regexPattern = escaped
      .replace(/\\\*/g, '.*')
      .replace(/\\\?/g, '.');

    return new RegExp(`^${regexPattern}$`);
  }

  private getWorkspaceFolder(): vscode.WorkspaceFolder | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0] : null;
  }

  private getRelativePath(workspaceFolder: vscode.WorkspaceFolder, filePath: string): string {
    const workspacePath = workspaceFolder.uri.fsPath;
    if (filePath.startsWith(workspacePath)) {
      return normalizePath(filePath.substring(workspacePath.length + 1));
    }
    return normalizePath(filePath);
  }

  private getCacheKey(workspaceFolder: vscode.WorkspaceFolder, options: IgnoreServiceOptions): string {
    return `${workspaceFolder.uri.fsPath}-${JSON.stringify(options)}`;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastLoadTime < this.cacheExpiry;
  }

  async refreshCache(): Promise<void> {
    this.ignorePatterns.clear();
    this.lastLoadTime = 0;
  }

  async addCustomIgnorePattern(pattern: string, source: string = 'custom'): Promise<void> {
    const workspaceFolder = this.getWorkspaceFolder();
    if (!workspaceFolder) {
      return;
    }

    const cacheKey = this.getCacheKey(workspaceFolder, {
      respectGitignore: true,
      respectEslintignore: true,
      respectPrettierignore: true
    });

    const existing = this.ignorePatterns.get(cacheKey) || [];
    existing.push({
      pattern: normalizePath(pattern),
      source,
      negated: false
    });

    this.ignorePatterns.set(cacheKey, existing);
  }

  async removeCustomIgnorePattern(pattern: string): Promise<void> {
    const workspaceFolder = this.getWorkspaceFolder();
    if (!workspaceFolder) {
      return;
    }

    const cacheKey = this.getCacheKey(workspaceFolder, {
      respectGitignore: true,
      respectEslintignore: true,
      respectPrettierignore: true
    });

    const existing = this.ignorePatterns.get(cacheKey) || [];
    const filtered = existing.filter(p => p.pattern !== pattern || p.source !== 'custom');
    
    this.ignorePatterns.set(cacheKey, filtered);
  }
} 