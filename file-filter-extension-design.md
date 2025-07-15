---
title: "FileList Panel Extension - Design Document"
version: "1.0.0"
status: draft
author: "matt-edmondson"
date: "2025-07-15"
---

# FileList Panel Extension Design Document

## Overview

The FileList Panel Extension provides an enhanced file navigation experience for VS Code and Cursor editors through a dedicated panel that allows users to filter workspace files using multiple search mechanisms including glob patterns, regular expressions, and fuzzy matching.

## Features

### Core Functionality

#### 1. File Filtering Panel
- **Dedicated Side Panel**: A custom panel in the activity bar that displays filtered file lists
- **Real-time Filtering**: Instant updates as the user types in the filter input
- **Multiple Filter Modes**: Toggle between glob, regex, and fuzzy matching
- **File Tree View**: Hierarchical display of filtered results maintaining folder structure

#### 2. Filter Types

##### Glob Pattern Matching
- Support for standard glob patterns (`*.js`, `**/*.tsx`, `src/**/*.{ts,js}`)
- Negation patterns (`!node_modules/**`)
- Multiple patterns separated by commas
- Case-sensitive/insensitive options

##### Regular Expression Matching
- Full regex support with JavaScript regex engine
- Flags support (i, g, m, s)
- Real-time validation with error highlighting
- Regex pattern history

##### Fuzzy Matching
- Intelligent fuzzy search algorithm
- Score-based ranking of results
- Highlight matching characters in results
- Configurable matching sensitivity

#### 3. Source Control Integration
- **Respect .gitignore**: Toggle to include/exclude files from .gitignore
- **Multiple VCS Support**: Git, SVN, Mercurial ignore patterns
- **Custom Ignore Files**: Support for .eslintignore, .prettierignore, etc.
- **Override Options**: Temporarily show ignored files when needed

#### 4. Advanced Features
- **Bookmarked Filters**: Save frequently used filter patterns
- **Filter History**: Recently used patterns with quick access
- **Batch Operations**: Multi-select files for batch operations
- **Context Menu Integration**: Right-click actions for filtered files
- **Export Results**: Save filtered file lists to various formats

## Technical Architecture

### Extension Structure

```
src/
├── extension.ts              # Main extension entry point
├── panels/
│   ├── fileListPanel.ts     # Main panel controller
│   ├── fileListProvider.ts  # Tree data provider
│   └── webview/
│       ├── index.html       # Panel HTML template
│       ├── main.js          # Panel JavaScript logic
│       └── styles.css       # Panel styling
├── filters/
│   ├── globFilter.ts        # Glob pattern matching
│   ├── regexFilter.ts       # Regular expression matching
│   ├── fuzzyFilter.ts       # Fuzzy matching algorithm
│   └── filterManager.ts     # Filter orchestration
├── services/
│   ├── fileService.ts       # File system operations
│   ├── ignoreService.ts     # Source control ignore handling
│   └── configService.ts     # Configuration management
├── utils/
│   ├── pathUtils.ts         # Path manipulation utilities
│   ├── debounce.ts          # Debouncing utility
│   └── icons.ts             # Icon management
└── types/
    └── index.ts             # TypeScript type definitions
```

### Core Components

#### 1. FileListPanel
```typescript
class FileListPanel {
  private webviewPanel: vscode.WebviewPanel;
  private filterManager: FilterManager;
  private fileService: FileService;
  
  constructor(context: vscode.ExtensionContext) {
    // Initialize panel and services
  }
  
  public show(): void {
    // Display the panel
  }
  
  private handleFilterChange(filter: FilterOptions): void {
    // Process filter changes and update results
  }
}
```

#### 2. FilterManager
```typescript
interface FilterOptions {
  pattern: string;
  type: 'glob' | 'regex' | 'fuzzy';
  caseSensitive: boolean;
  respectIgnore: boolean;
}

class FilterManager {
  private filters: Map<string, IFilter>;
  
  public applyFilter(options: FilterOptions): Promise<FileItem[]> {
    // Apply selected filter type and return results
  }
}
```

#### 3. File Service
```typescript
interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  modified?: Date;
  ignored?: boolean;
}

class FileService {
  public async getWorkspaceFiles(): Promise<FileItem[]> {
    // Retrieve all workspace files
  }
  
  public async isIgnored(filePath: string): Promise<boolean> {
    // Check if file should be ignored
  }
}
```

## User Interface Design

### Panel Layout

```
┌─────────────────────────────────────┐
│ 🔍 FileList Panel                   │
├─────────────────────────────────────┤
│ [Filter Input Field            ] [×]│
│ [Glob] [Regex] [Fuzzy]    [⚙️] [📁] │
├─────────────────────────────────────┤
│ 📂 src/                    (125)    │
│   📄 index.ts                       │
│   📄 app.ts                         │
│   📂 components/           (45)     │
│     📄 Button.tsx                   │
│     📄 Input.tsx                    │
│ 📂 tests/                  (23)     │
│   📄 app.test.ts                    │
├─────────────────────────────────────┤
│ Results: 193 files | 12 folders    │
└─────────────────────────────────────┘
```

### Filter Mode Indicators
- **Glob Mode**: Blue icon with `*` symbol
- **Regex Mode**: Red icon with `/` symbol  
- **Fuzzy Mode**: Green icon with `~` symbol
- **Ignore Enabled**: Orange `.gitignore` icon

### Context Menu Actions
- Open file
- Open to the side
- Reveal in Explorer
- Copy path
- Copy relative path
- Add to workspace
- Exclude from results

## Implementation Details

### 1. Extension Activation
```typescript
export function activate(context: vscode.ExtensionContext) {
  const fileListPanel = new FileListPanel(context);
  
  // Register commands
  const showPanelCommand = vscode.commands.registerCommand(
    'fileList.showPanel',
    () => fileListPanel.show()
  );
  
  context.subscriptions.push(showPanelCommand);
}
```

### 2. Configuration Schema
```json
{
  "fileList.defaultFilterMode": {
    "type": "string",
    "enum": ["glob", "regex", "fuzzy"],
    "default": "fuzzy"
  },
  "fileList.respectGitignore": {
    "type": "boolean",
    "default": true
  },
  "fileList.maxResults": {
    "type": "number",
    "default": 1000
  },
  "fileList.caseSensitive": {
    "type": "boolean",
    "default": false
  }
}
```

### 3. Performance Optimizations
- **Debounced Search**: 300ms delay on filter input
- **Virtual Scrolling**: Handle large result sets efficiently
- **Incremental Loading**: Load results in chunks
- **Caching**: Cache file lists and filter results
- **Web Workers**: Offload heavy filtering operations

### 4. Error Handling
- Invalid regex pattern notifications
- File access permission errors
- Large workspace warnings
- Graceful degradation for unsupported features

## Extension Manifest

### package.json Configuration
```json
{
  "name": "filelist-panel",
  "displayName": "FileList Panel",
  "description": "Enhanced file filtering panel with glob, regex, and fuzzy search",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "fileList.showPanel",
        "title": "Show FileList Panel",
        "icon": "$(list-filter)"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "fileListPanel",
          "name": "FileList",
          "when": "true"
        }
      ]
    },
    "configuration": {
      "title": "FileList Panel",
      "properties": {
        "fileList.defaultFilterMode": {
          "type": "string",
          "enum": ["glob", "regex", "fuzzy"],
          "default": "fuzzy",
          "description": "Default filter mode"
        }
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests
- Filter algorithm accuracy
- Path normalization
- Ignore pattern matching
- Configuration handling

### Integration Tests
- VS Code API integration
- Webview communication
- File system operations
- Performance benchmarks

### User Acceptance Tests
- Filter mode switching
- Large workspace handling
- Cross-platform compatibility
- Accessibility compliance

## CI/CD with GitHub Actions

### Workflow Structure

```
.github/
└── workflows/
    ├── ci.yml              # Continuous Integration
    ├── release.yml         # Release workflow
    └── publish.yml         # Marketplace publication
```

### 1. Continuous Integration Workflow

#### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Build extension
      run: npm run build
    
    - name: Package extension
      run: npm run package
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: extension-${{ matrix.node-version }}
        path: '*.vsix'

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level=moderate
    
    - name: Scan for vulnerabilities
      uses: securecodewarrior/github-action-add-sarif@v1
      with:
        sarif-file: 'security-scan.sarif'
```

### 2. Release Workflow

#### `.github/workflows/release.yml`
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    outputs:
      upload_url: ${{ steps.create_release.outputs.upload_url }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Create Release
      id: create_release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        draft: false
        prerelease: false
        body: |
          Changes in this Release:
          - Feature updates
          - Bug fixes
          - Performance improvements
          
          See CHANGELOG.md for detailed changes.

  build-and-package:
    runs-on: ${{ matrix.os }}
    needs: create-release
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:all
    
    - name: Build extension
      run: npm run build
    
    - name: Package extension
      run: npm run package
    
    - name: Upload Release Asset
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ needs.create-release.outputs.upload_url }}
        asset_path: './filelist-panel-*.vsix'
        asset_name: filelist-panel-${{ matrix.os }}.vsix
        asset_content_type: application/zip
```

### 3. Marketplace Publication Workflow

#### `.github/workflows/publish.yml`
```yaml
name: Publish to Marketplace

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish'
        required: true
        default: 'latest'

jobs:
  publish-vscode:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install vsce
      run: npm install -g vsce
    
    - name: Build extension
      run: npm run build
    
    - name: Package extension
      run: vsce package
    
    - name: Publish to VS Code Marketplace
      run: vsce publish -p ${{ secrets.VSCODE_MARKETPLACE_TOKEN }}
      env:
        VSCODE_MARKETPLACE_TOKEN: ${{ secrets.VSCODE_MARKETPLACE_TOKEN }}

  publish-openvsx:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install ovsx
      run: npm install -g ovsx
    
    - name: Build extension
      run: npm run build
    
    - name: Package extension
      run: vsce package
    
    - name: Publish to Open VSX Registry
      run: ovsx publish *.vsix -p ${{ secrets.OPENVSX_ACCESS_TOKEN }}
      env:
        OPENVSX_ACCESS_TOKEN: ${{ secrets.OPENVSX_ACCESS_TOKEN }}

  notify-success:
    runs-on: ubuntu-latest
    needs: [publish-vscode, publish-openvsx]
    if: success()
    steps:
    - name: Notify success
      run: |
        echo "✅ Extension published successfully to both marketplaces!"
        echo "VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=matt-edmondson.filelist-panel"
        echo "Open VSX Registry: https://open-vsx.org/extension/matt-edmondson/filelist-panel"
```

### 4. Required Secrets Configuration

#### GitHub Repository Secrets
Set up the following secrets in your GitHub repository settings:

```
VSCODE_MARKETPLACE_TOKEN    # Personal Access Token for VS Code Marketplace
OPENVSX_ACCESS_TOKEN        # Access Token for Open VSX Registry
```

#### Obtaining Marketplace Tokens

##### VS Code Marketplace Token
1. Go to [Azure DevOps](https://dev.azure.com)
2. Create a Personal Access Token with "Marketplace (Manage)" scope
3. Add token to GitHub repository secrets

##### Open VSX Registry Token
1. Go to [Eclipse Foundation](https://accounts.eclipse.org)
2. Create account and generate access token
3. Add token to GitHub repository secrets

### 5. Package.json Scripts

#### Required NPM Scripts
```json
{
  "scripts": {
    "build": "webpack --mode production",
    "package": "vsce package",
    "publish": "vsce publish",
    "publish:openvsx": "ovsx publish",
    "lint": "eslint src --ext ts",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:integration": "jest --config jest.integration.config.js",
    "test:all": "npm run test && npm run test:integration",
    "prepublish": "npm run build && npm run test:all"
  }
}
```

### 6. Automated Version Management

#### Semantic Release Integration
```yaml
# Add to .github/workflows/release.yml
- name: Semantic Release
  uses: cycjimmy/semantic-release-action@v3
  with:
    semantic_version: 19
    extra_plugins: |
      @semantic-release/changelog
      @semantic-release/git
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 7. Quality Gates

#### Pre-publish Checks
- All tests must pass
- Code coverage minimum 80%
- Security audit clean
- Linting passes
- Type checking passes
- Extension packages successfully

#### Deployment Conditions
- Only deploy from main branch
- Require manual approval for production releases
- Automatic deployment for pre-release versions
- Rollback capability in case of issues

### 8. Monitoring and Notifications

#### Success/Failure Notifications
- Slack integration for build status
- Email notifications for failed deployments
- GitHub status checks for PR validation
- Marketplace analytics webhook integration

#### Performance Monitoring
- Bundle size tracking
- Extension activation time metrics
- User adoption metrics
- Error rate monitoring

## Future Enhancements

### Phase 2 Features
- **Saved Searches**: Persistent filter configurations
- **Advanced Filtering**: File size, date, content-based filters
- **Integration**: Git status, linting results, test coverage
- **Customization**: Theme support, layout options

### Phase 3 Features
- **Collaborative Filtering**: Team-shared filter configurations
- **AI-Powered Search**: Natural language file queries
- **Advanced Analytics**: Workspace insights and metrics
- **Plugin System**: Extensible filter types

## Conclusion

The FileList Panel Extension will provide developers with a powerful and intuitive file navigation tool that significantly enhances the VS Code/Cursor experience. The modular architecture ensures maintainability and extensibility, while the comprehensive feature set addresses various use cases and workflows.

The implementation follows SOLID principles with clear separation of concerns, making the codebase maintainable and testable. The extension will seamlessly integrate with existing VS Code functionality while providing unique value through its advanced filtering capabilities. 