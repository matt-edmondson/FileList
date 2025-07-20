import * as vscode from 'vscode';
import { FileListPanel } from './panels/fileListPanel';
import { FileService } from './services/fileService';
import { IgnoreService } from './services/ignoreService';

export function activate(context: vscode.ExtensionContext) {
  console.log('FileList Panel extension is now active!');

  // Initialize services
  const fileService = new FileService(context);
  const ignoreService = new IgnoreService(context);

  // Initialize main panel
  const fileListPanel = new FileListPanel(context, fileService, ignoreService);

  // Register commands
  const showPanelCommand = vscode.commands.registerCommand(
    'fileList.showPanel',
    () => fileListPanel.show()
  );

  const refreshFilesCommand = vscode.commands.registerCommand(
    'fileList.refreshFiles',
    () => fileListPanel.refreshFiles()
  );

  const clearFilterCommand = vscode.commands.registerCommand(
    'fileList.clearFilter',
    () => fileListPanel.clearFilter()
  );

  const toggleIgnoreFilesCommand = vscode.commands.registerCommand(
    'fileList.toggleIgnoreFiles',
    () => fileListPanel.toggleIgnoreFiles()
  );

  const setFilterTextCommand = vscode.commands.registerCommand(
    'fileList.setFilterText',
    () => fileListPanel.showFilterInput()
  );

  const selectFilterTypeCommand = vscode.commands.registerCommand(
    'fileList.selectFilterType',
    () => fileListPanel.showFilterTypeSelection()
  );

  const toggleCaseSensitiveCommand = vscode.commands.registerCommand(
    'fileList.toggleCaseSensitive',
    () => fileListPanel.toggleCaseSensitive()
  );

  // Register tree data provider
  const treeDataProvider = fileListPanel.getTreeDataProvider();
  if (treeDataProvider) {
    const treeView = vscode.window.createTreeView('fileListPanel', {
      treeDataProvider,
      showCollapseAll: true,
      canSelectMany: false
    });

    // Handle tree item selection
    treeView.onDidChangeSelection((event: vscode.TreeViewSelectionChangeEvent<any>) => {
      if (event.selection.length > 0) {
        const selectedItem = event.selection[0];
        if (selectedItem && selectedItem.command) {
          vscode.commands.executeCommand(selectedItem.command.command, ...selectedItem.command.arguments);
        }
      }
    });

    context.subscriptions.push(treeView);
  }

  // Register file system watcher for auto-refresh
  const workspaceWatcher = vscode.workspace.createFileSystemWatcher('**/*');
  
  workspaceWatcher.onDidCreate(() => {
    fileListPanel.refreshFiles();
  });
  
  workspaceWatcher.onDidDelete(() => {
    fileListPanel.refreshFiles();
  });
  
  workspaceWatcher.onDidChange(() => {
    // Debounce file changes to avoid excessive refreshing
    if (fileListPanel.shouldRefreshOnChange()) {
      fileListPanel.refreshFiles();
    }
  });

  // Register configuration change handler
  const configurationWatcher = vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
    if (event.affectsConfiguration('fileList')) {
      fileListPanel.onConfigurationChanged();
    }
  });

  // Register workspace folder change handler
  const workspaceWatcher2 = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    fileListPanel.onWorkspaceChanged();
  });

  // Add all disposables to context
  context.subscriptions.push(
    showPanelCommand,
    refreshFilesCommand,
    clearFilterCommand,
    toggleIgnoreFilesCommand,
    setFilterTextCommand,
    selectFilterTypeCommand,
    toggleCaseSensitiveCommand,
    workspaceWatcher,
    configurationWatcher,
    workspaceWatcher2,
    fileListPanel
  );

  // Initialize panel on startup
  fileListPanel.initialize();
}

export function deactivate() {
  console.log('FileList Panel extension is now deactivated');
} 