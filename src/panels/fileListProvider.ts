import * as vscode from 'vscode';
import { FileItem, FileTreeItem } from '../types';
import { FileService } from '../services/fileService';
import { getFileExtension, getFileName } from '../utils/pathUtils';

export class FileListProvider implements vscode.TreeDataProvider<FileTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> = new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private files: FileItem[] = [];
  private treeItems: FileTreeItem[] = [];

  constructor(private fileService: FileService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateFiles(files: FileItem[]): void {
    this.files = files;
    this.treeItems = this.buildTreeItems(files);
    this.refresh();
  }

  getFiles(): FileItem[] {
    return this.files;
  }

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileTreeItem): Thenable<FileTreeItem[]> {
    if (element) {
      return Promise.resolve(element.children || []);
    } else {
      return Promise.resolve(this.treeItems);
    }
  }

  private buildTreeItems(files: FileItem[]): FileTreeItem[] {
    const items: FileTreeItem[] = [];
    const directoryMap = new Map<string, FileTreeItem>();

    // Sort files by directory depth and name
    const sortedFiles = files.sort((a, b) => {
      const aDepth = a.relativePath.split('/').length;
      const bDepth = b.relativePath.split('/').length;
      
      if (aDepth !== bDepth) {
        return aDepth - bDepth;
      }
      
      return a.relativePath.localeCompare(b.relativePath);
    });

    for (const file of sortedFiles) {
      const item = this.createTreeItem(file);
      
      if (file.isDirectory) {
        directoryMap.set(file.relativePath, item);
        items.push(item);
      } else {
        // Find parent directory
        const parentPath = this.getParentDirectory(file.relativePath);
        if (parentPath && directoryMap.has(parentPath)) {
          const parentItem = directoryMap.get(parentPath)!;
          if (!parentItem.children) {
            parentItem.children = [];
          }
          parentItem.children.push(item);
        } else {
          items.push(item);
        }
      }
    }

    // Update collapsible state for directories
    for (const item of items) {
      if (item.fileItem.isDirectory) {
        item.collapsibleState = item.children && item.children.length > 0 
          ? vscode.TreeItemCollapsibleState.Collapsed 
          : vscode.TreeItemCollapsibleState.None;
      }
    }

    return items;
  }

  private createTreeItem(file: FileItem): FileTreeItem {
    const item: FileTreeItem = {
      label: file.name,
      fileItem: file,
      collapsibleState: file.isDirectory 
        ? vscode.TreeItemCollapsibleState.Collapsed 
        : vscode.TreeItemCollapsibleState.None,
      contextValue: file.isDirectory ? 'directory' : 'file',
      tooltip: this.createTooltip(file),
      resourceUri: file.uri
    };

    // Set appropriate icon
    if (file.isDirectory) {
      item.iconPath = new vscode.ThemeIcon('folder');
    } else {
      item.iconPath = this.getFileIcon(file);
    }

    // Set command for file items
    if (!file.isDirectory) {
      item.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [file.uri]
      };
    }

    return item;
  }

  private getFileIcon(file: FileItem): vscode.ThemeIcon {
    const extension = getFileExtension(file.name);
    
    // Map common file extensions to VS Code theme icons
    const iconMap: { [key: string]: string } = {
      '.ts': 'file-typescript',
      '.js': 'file-javascript',
      '.json': 'file-json',
      '.html': 'file-html',
      '.css': 'file-css',
      '.scss': 'file-scss',
      '.sass': 'file-sass',
      '.less': 'file-less',
      '.xml': 'file-xml',
      '.yml': 'file-yaml',
      '.yaml': 'file-yaml',
      '.md': 'file-markdown',
      '.txt': 'file-text',
      '.log': 'file-text',
      '.py': 'file-python',
      '.java': 'file-java',
      '.c': 'file-c',
      '.cpp': 'file-cpp',
      '.h': 'file-header',
      '.hpp': 'file-header',
      '.cs': 'file-csharp',
      '.php': 'file-php',
      '.rb': 'file-ruby',
      '.go': 'file-go',
      '.rs': 'file-rust',
      '.kt': 'file-kotlin',
      '.swift': 'file-swift',
      '.dart': 'file-dart',
      '.vue': 'file-vue',
      '.jsx': 'file-react',
      '.tsx': 'file-react',
      '.sql': 'file-sql',
      '.png': 'file-image',
      '.jpg': 'file-image',
      '.jpeg': 'file-image',
      '.gif': 'file-image',
      '.svg': 'file-image',
      '.ico': 'file-image',
      '.pdf': 'file-pdf',
      '.zip': 'file-zip',
      '.tar': 'file-zip',
      '.gz': 'file-zip',
      '.rar': 'file-zip',
      '.7z': 'file-zip'
    };

    const iconName = iconMap[extension] || 'file';
    return new vscode.ThemeIcon(iconName);
  }

  private createTooltip(file: FileItem): string {
    const lines = [
      `Path: ${file.relativePath}`,
      `Type: ${file.isDirectory ? 'Directory' : 'File'}`
    ];

    if (!file.isDirectory) {
      if (file.size !== undefined) {
        lines.push(`Size: ${this.formatFileSize(file.size)}`);
      }
      
      if (file.modified) {
        lines.push(`Modified: ${file.modified.toLocaleString()}`);
      }
    }

    return lines.join('\n');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getParentDirectory(filePath: string): string | null {
    const parts = filePath.split('/');
    if (parts.length <= 1) {
      return null;
    }
    
    return parts.slice(0, -1).join('/');
  }

  // Method to get filtered files count
  getFilteredFileCount(): number {
    return this.files.filter(f => !f.isDirectory).length;
  }

  // Method to get filtered directories count
  getFilteredDirectoryCount(): number {
    return this.files.filter(f => f.isDirectory).length;
  }

  // Method to get total filtered items count
  getTotalFilteredCount(): number {
    return this.files.length;
  }

  // Method to find file by path
  findFileByPath(path: string): FileItem | undefined {
    return this.files.find(f => f.relativePath === path);
  }

  // Method to get files by extension
  getFilesByExtension(extension: string): FileItem[] {
    return this.files.filter(f => !f.isDirectory && getFileExtension(f.name) === extension);
  }

  // Method to get largest files
  getLargestFiles(count: number = 10): FileItem[] {
    return this.files
      .filter(f => !f.isDirectory && f.size !== undefined)
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, count);
  }

  // Method to get recently modified files
  getRecentlyModifiedFiles(count: number = 10): FileItem[] {
    return this.files
      .filter(f => !f.isDirectory && f.modified !== undefined)
      .sort((a, b) => (b.modified?.getTime() || 0) - (a.modified?.getTime() || 0))
      .slice(0, count);
  }
} 