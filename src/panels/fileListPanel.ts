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
  private statusBarItem: vscode.StatusBarItem;

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

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = 'fileList.setFilterText';
    this.statusBarItem.tooltip = 'Click to set filter text';
    this.updateStatusBar();
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
    
    this.updateStatusBar();
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
    this.updateStatusBar();
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

  async toggleCaseSensitive(): Promise<void> {
    this.currentFilter.caseSensitive = !this.currentFilter.caseSensitive;
    
    const status = this.currentFilter.caseSensitive ? 'enabled' : 'disabled';
    vscode.window.showInformationMessage(`Case sensitive filtering ${status}`);
    
    this.updateStatusBar();
    
    // Re-apply filter if pattern exists
    if (this.currentFilter.pattern) {
      await this.applyFilter(this.currentFilter.pattern, this.currentFilter.type);
    } else {
      this.refreshFiles();
    }
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

  // Method to show filter input dialog
  async showFilterInput(): Promise<void> {
    const currentPattern = this.currentFilter.pattern || '';
    const currentType = this.currentFilter.type;
    
    const placeholder = this.getPlaceholderForFilterType(currentType);
    const prompt = `Enter ${currentType} pattern to filter files`;
    
    const input = await vscode.window.showInputBox({
      prompt,
      placeHolder: placeholder,
      value: currentPattern,
      validateInput: (text: string) => {
        if (!text.trim()) {
          return undefined; // Empty is valid (clears filter)
        }
        
        // Validate based on current filter type
        const isValid = this.validateFilterPattern(text, currentType);
        return isValid ? undefined : `Invalid ${currentType} pattern`;
      }
    });

    if (input !== undefined) {
      this.currentFilter.pattern = input.trim();
      if (!this.currentFilter.pattern) {
        this.clearFilter();
      } else {
        await this.applyFilter(this.currentFilter.pattern, this.currentFilter.type);
      }
    }
  }

  // Method to show filter type selection
  async showFilterTypeSelection(): Promise<void> {
    const items = [
      {
        label: '$(search) Glob',
        description: 'Use glob patterns (*, **, ?, [abc])',
        filterType: 'glob' as FilterType
      },
      {
        label: '$(regex) Regex',
        description: 'Use regular expressions',
        filterType: 'regex' as FilterType
      },
      {
        label: '$(zap) Fuzzy',
        description: 'Use fuzzy matching (smart search)',
        filterType: 'fuzzy' as FilterType
      }
    ];

    // Mark current selection
    const currentIndex = items.findIndex(item => item.filterType === this.currentFilter.type);
    if (currentIndex >= 0) {
      items[currentIndex].label = '$(check) ' + items[currentIndex].label.substring(2);
    }

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select filter type',
      matchOnDescription: true
    });

    if (selection) {
      const oldType = this.currentFilter.type;
      this.currentFilter.type = selection.filterType;
      
      // If pattern exists and types changed, re-validate and apply
      if (this.currentFilter.pattern && oldType !== selection.filterType) {
        const isValid = this.validateFilterPattern(this.currentFilter.pattern, this.currentFilter.type);
        if (!isValid) {
          vscode.window.showWarningMessage(
            `Current pattern "${this.currentFilter.pattern}" is not valid for ${selection.filterType} filter. Please update the pattern.`
          );
          // Clear the pattern since it's not valid for the new type
          this.currentFilter.pattern = '';
        }
                 await this.applyFilter(this.currentFilter.pattern, this.currentFilter.type);
       }
       
       // Show status message
       vscode.window.showInformationMessage(`Filter type changed to: ${selection.filterType}`);
       this.updateStatusBar();
     }
   }

   

  // Helper method to get placeholder text for filter type
  private getPlaceholderForFilterType(type: FilterType): string {
    switch (type) {
      case 'glob':
        return 'e.g., **/*.ts, src/**/*.js, *.md';
      case 'regex':
        return 'e.g., \\.ts$, ^src/, test.*\\.js$';
      case 'fuzzy':
        return 'e.g., tsconfig, test util, src comp';
      default:
        return 'Enter filter pattern...';
    }
  }

  // Helper method to validate filter pattern
  private validateFilterPattern(pattern: string, type: FilterType): boolean {
    switch (type) {
      case 'glob':
        return this.globFilter.isValid(pattern);
      case 'regex':
        return this.regexFilter.isValid(pattern);
      case 'fuzzy':
        return this.fuzzyFilter.isValid(pattern);
      default:
        return true;
    }
  }

  // Helper method to update status bar
  private updateStatusBar(): void {
    const hasFilter = this.currentFilter.pattern.trim().length > 0;
    const filterType = this.currentFilter.type;
    const caseSensitive = this.currentFilter.caseSensitive;
    
    if (hasFilter) {
      const caseIcon = caseSensitive ? '$(case-sensitive)' : '$(case-insensitive)';
      const typeIcon = filterType === 'glob' ? '$(search)' : 
                      filterType === 'regex' ? '$(regex)' : '$(zap)';
      this.statusBarItem.text = `${typeIcon} ${this.currentFilter.pattern} ${caseIcon}`;
      this.statusBarItem.tooltip = `Filter: ${filterType} pattern "${this.currentFilter.pattern}" (${caseSensitive ? 'case sensitive' : 'case insensitive'})`;
    } else {
      this.statusBarItem.text = '$(filter) No filter';
      this.statusBarItem.tooltip = 'Click to set filter text';
    }
    
    this.statusBarItem.show();
  }

  // Dispose method to clean up resources
  dispose(): void {
    this.statusBarItem.dispose();
  }
} 