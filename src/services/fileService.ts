import * as vscode from 'vscode';
import { FileItem, FileServiceOptions, WorkspaceStats } from '../types';
import { normalizePath, getRelativePath } from '../utils/pathUtils';

export class FileService {
  private fileCache: Map<string, FileItem[]> = new Map();
  private lastScanTime: Date = new Date(0);
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes

  constructor(private _context: vscode.ExtensionContext) {}

  async getWorkspaceFiles(options: FileServiceOptions = { respectIgnore: true }): Promise<FileItem[]> {
    const workspaceFolder = this.getWorkspaceFolder();
    if (!workspaceFolder) {
      return [];
    }

    const cacheKey = this.getCacheKey(options);
    const cachedFiles = this.fileCache.get(cacheKey);
    
    if (cachedFiles && this.isCacheValid()) {
      return cachedFiles;
    }

    const files = await this.scanWorkspace(workspaceFolder, options);
    this.fileCache.set(cacheKey, files);
    this.lastScanTime = new Date();
    
    return files;
  }

  async refreshFileCache(): Promise<void> {
    this.fileCache.clear();
    this.lastScanTime = new Date(0);
  }

  async getFileStats(filePath: string): Promise<vscode.FileStat | null> {
    try {
      const uri = vscode.Uri.file(filePath);
      return await vscode.workspace.fs.stat(uri);
    } catch {
      return null;
    }
  }

  async getWorkspaceStats(): Promise<WorkspaceStats> {
    const workspaceFolder = this.getWorkspaceFolder();
    if (!workspaceFolder) {
      return {
        totalFiles: 0,
        totalDirectories: 0,
        totalSize: 0,
        lastScanned: new Date()
      };
    }

    const files = await this.getWorkspaceFiles();
    const directories = files.filter(f => f.isDirectory);
    const regularFiles = files.filter(f => !f.isDirectory);
    const totalSize = regularFiles.reduce((sum, f) => sum + (f.size || 0), 0);

    return {
      totalFiles: regularFiles.length,
      totalDirectories: directories.length,
      totalSize,
      lastScanned: this.lastScanTime
    };
  }

  private async scanWorkspace(workspaceFolder: vscode.WorkspaceFolder, options: FileServiceOptions): Promise<FileItem[]> {
    const files: FileItem[] = [];
    const rootPath = workspaceFolder.uri.fsPath;
    const maxDepth = options.maxDepth || 50;

    try {
      await this.scanDirectory(workspaceFolder.uri, rootPath, files, 0, maxDepth, options);
    } catch (error) {
      console.error('Error scanning workspace:', error);
    }

    return files;
  }

  private async scanDirectory(
    dirUri: vscode.Uri,
    rootPath: string,
    files: FileItem[],
    currentDepth: number,
    maxDepth: number,
    options: FileServiceOptions
  ): Promise<void> {
    if (currentDepth > maxDepth) {
      return;
    }

    try {
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      
      for (const [name, type] of entries) {
        if (!options.includeHidden && name.startsWith('.')) {
          continue;
        }

        const fileUri = vscode.Uri.joinPath(dirUri, name);
        const isDirectory = type === vscode.FileType.Directory;
        const isSymlink = type === vscode.FileType.SymbolicLink;

        if (isSymlink && !options.followSymlinks) {
          continue;
        }

        const filePath = fileUri.fsPath;
        const relativePath = getRelativePath(rootPath, filePath);
        
        let size: number | undefined;
        let modified: Date | undefined;

        try {
          const stats = await vscode.workspace.fs.stat(fileUri);
          size = stats.size;
          modified = new Date(stats.mtime);
        } catch {
          // Ignore stat errors
        }

        const fileItem: FileItem = {
          path: normalizePath(filePath),
          name,
          isDirectory,
          size,
          modified,
          relativePath: normalizePath(relativePath),
          uri: fileUri
        };

        files.push(fileItem);

        if (isDirectory) {
          await this.scanDirectory(fileUri, rootPath, files, currentDepth + 1, maxDepth, options);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirUri.fsPath}:`, error);
    }
  }

  private getWorkspaceFolder(): vscode.WorkspaceFolder | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0] : null;
  }

  private getCacheKey(options: FileServiceOptions): string {
    return JSON.stringify(options);
  }

  private isCacheValid(): boolean {
    const now = new Date();
    return now.getTime() - this.lastScanTime.getTime() < this.cacheTtl;
  }

  async openFile(fileItem: FileItem): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(fileItem.uri);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${fileItem.name}`);
    }
  }

  async openFileToSide(fileItem: FileItem): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(fileItem.uri);
      await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${fileItem.name}`);
    }
  }

  async revealInExplorer(fileItem: FileItem): Promise<void> {
    try {
      await vscode.commands.executeCommand('revealInExplorer', fileItem.uri);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to reveal file in explorer: ${fileItem.name}`);
    }
  }

  async copyPath(fileItem: FileItem, relative: boolean = false): Promise<void> {
    const pathToCopy = relative ? fileItem.relativePath : fileItem.path;
    await vscode.env.clipboard.writeText(pathToCopy);
    vscode.window.showInformationMessage(`Path copied to clipboard: ${pathToCopy}`);
  }
} 