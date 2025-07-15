import * as vscode from 'vscode';
import { FileItem, FilterOptions, FilterType, ExtensionConfig, WorkspaceStats } from '../types';
import { FileService } from '../services/fileService';
import { IgnoreService } from '../services/ignoreService';
import { GlobFilter } from '../filters/globFilter';
import { RegexFilter } from '../filters/regexFilter';
import { FuzzyFilter } from '../filters/fuzzyFilter';
import { FileListProvider } from './fileListProvider';
import { debounce } from '../utils/debounce';

export class FileListPanel {
  private treeDataProvider: FileListProvider;
  private currentFilter: FilterOptions;
  private globFilter: GlobFilter;
  private regexFilter: RegexFilter;
  private fuzzyFilter: FuzzyFilter;
  private isInitialized = false;
  private lastRefreshTime = 0;
  private refreshDebounced: () => void;

  constructor(
    private _context: vscode.ExtensionContext,
    private _fileService: FileService,
    private _ignoreService: IgnoreService
  ) {
    this.treeDataProvider = new FileListProvider(this._fileService);
    this.globFilter = new GlobFilter();
    this.regexFilter = new RegexFilter();
    this.fuzzyFilter = new FuzzyFilter();
    
    // Initialize with default filter options
    this.currentFilter = this.getDefaultFilterOptions();
    
    // Create debounced refresh function
    this.refreshDebounced = debounce(() => {
      this.performRefresh();
    }, this.getConfig().debounceDelay);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadConfiguration();
      await this.refreshFiles();
      this.isInitialized = true;
      
      vscode.window.showInformationMessage('FileList Panel initialized successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to initialize FileList Panel: ${error}`);
    }
  }

  show(): void {
    // Focus on the tree view
    vscode.commands.executeCommand('fileListPanel.focus');
  }

  getTreeDataProvider(): FileListProvider {
    return this.treeDataProvider;
  }

  async refreshFiles(): Promise<void> {
    this.refreshDebounced();
  }

  private async performRefresh(): Promise<void> {
    try {
      const files = await this._fileService.getWorkspaceFiles({
        respectIgnore: this.currentFilter.respectIgnore,
        includeHidden: false,
        followSymlinks: false,
        maxDepth: 50
      });

      // Apply current filter
      const filteredFiles = await this.applyCurrentFilter(files);
      
      // Update tree data provider
      this.treeDataProvider.updateFiles(filteredFiles);
      
      this.lastRefreshTime = Date.now();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to refresh files: ${error}`);
    }
  }

  async applyFilter(pattern: string, type?: FilterType): Promise<void> {
    if (type) {
      this.currentFilter.type = type;
    }
    this.currentFilter.pattern = pattern;
    
    await this.refreshFiles();
  }

  private async applyCurrentFilter(files: FileItem[]): Promise<FileItem[]> {
    if (!this.currentFilter.pattern.trim()) {
      return files.slice(0, this.currentFilter.maxResults);
    }

    let filteredFiles: FileItem[] = [];

    try {
      switch (this.currentFilter.type) {
        case 'glob':
          filteredFiles = await this.globFilter.apply(files, this.currentFilter);
          break;
        case 'regex':
          filteredFiles = await this.regexFilter.apply(files, this.currentFilter);
          break;
        case 'fuzzy':
          filteredFiles = await this.fuzzyFilter.apply(files, this.currentFilter);
          break;
        default:
          filteredFiles = files;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Filter error: ${error}`);
      filteredFiles = [];
    }

    return filteredFiles.slice(0, this.currentFilter.maxResults);
  }

  clearFilter(): void {
    this.currentFilter.pattern = '';
    this.refreshFiles();
  }

  toggleIgnoreFiles(): void {
    this.currentFilter.respectIgnore = !this.currentFilter.respectIgnore;
    this.refreshFiles();
    
    const status = this.currentFilter.respectIgnore ? 'enabled' : 'disabled';
    vscode.window.showInformationMessage(`Ignore files ${status}`);
  }

  setFilterType(type: FilterType): void {
    this.currentFilter.type = type;
    this.refreshFiles();
  }

  toggleCaseSensitive(): void {
    this.currentFilter.caseSensitive = !this.currentFilter.caseSensitive;
    this.refreshFiles();
  }

  shouldRefreshOnChange(): boolean {
    // Avoid excessive refreshing
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    return timeSinceLastRefresh > 1000; // 1 second minimum between refreshes
  }

  async onConfigurationChanged(): Promise<void> {
    await this.loadConfiguration();
    await this.refreshFiles();
  }

  async onWorkspaceChanged(): Promise<void> {
    // Clear caches when workspace changes
    await this._fileService.refreshFileCache();
    await this._ignoreService.refreshCache();
    await this.refreshFiles();
  }

  private async loadConfiguration(): Promise<void> {
    const config = this.getConfig();
    
    this.currentFilter = {
      pattern: this.currentFilter.pattern, // Keep existing pattern
      type: config.defaultFilterMode,
      caseSensitive: config.caseSensitive,
      respectIgnore: config.respectGitignore,
      maxResults: config.maxResults
    };

    // Update debounced refresh function with new delay
    this.refreshDebounced = debounce(() => {
      this.performRefresh();
    }, config.debounceDelay);
  }

  private getDefaultFilterOptions(): FilterOptions {
    const config = this.getConfig();
    return {
      pattern: '',
      type: config.defaultFilterMode,
      caseSensitive: config.caseSensitive,
      respectIgnore: config.respectGitignore,
      maxResults: config.maxResults
    };
  }

  private getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('fileList');
    return {
      defaultFilterMode: config.get('defaultFilterMode', 'fuzzy'),
      respectGitignore: config.get('respectGitignore', true),
      maxResults: config.get('maxResults', 1000),
      caseSensitive: config.get('caseSensitive', false),
      debounceDelay: config.get('debounceDelay', 300),
      showFileIcons: config.get('showFileIcons', true),
      showFileSize: config.get('showFileSize', false),
      showModifiedDate: config.get('showModifiedDate', false)
    };
  }

  // Methods for getting current state
  getCurrentFilter(): FilterOptions {
    return { ...this.currentFilter };
  }

  getCurrentFilterType(): FilterType {
    return this.currentFilter.type;
  }

  getCurrentPattern(): string {
    return this.currentFilter.pattern;
  }

  isIgnoreFilesEnabled(): boolean {
    return this.currentFilter.respectIgnore;
  }

  isCaseSensitive(): boolean {
    return this.currentFilter.caseSensitive;
  }

  // Helper methods for filter suggestions
  getFilterSuggestions(): string[] {
    switch (this.currentFilter.type) {
      case 'glob':
        return this.globFilter.getSuggestions();
      case 'regex':
        return this.regexFilter.getSuggestions();
      case 'fuzzy':
        return this.fuzzyFilter.getSuggestions();
      default:
        return [];
    }
  }

  // Method to validate current filter pattern
  isCurrentPatternValid(): boolean {
    if (!this.currentFilter.pattern.trim()) {
      return true;
    }

    switch (this.currentFilter.type) {
      case 'glob':
        return this.globFilter.isValid(this.currentFilter.pattern);
      case 'regex':
        return this.regexFilter.isValid(this.currentFilter.pattern);
      case 'fuzzy':
        return this.fuzzyFilter.isValid(this.currentFilter.pattern);
      default:
        return true;
    }
  }

  // Method to get workspace statistics
  async getWorkspaceStats(): Promise<WorkspaceStats> {
    return await this._fileService.getWorkspaceStats();
  }

  // Method to export current results
  async exportResults(): Promise<void> {
    const files = this.treeDataProvider.getFiles();
    const content = files.map((f: FileItem) => f.relativePath).join('\n');
    
    const document = await vscode.workspace.openTextDocument({
      content,
      language: 'plaintext'
    });
    
    await vscode.window.showTextDocument(document);
  }
} 