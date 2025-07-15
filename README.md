# FileList Panel Extension

A powerful VS Code/Cursor extension that provides an enhanced file filtering panel with support for glob patterns, regular expressions, and fuzzy search.

## Features

- **Multiple Filter Types**: Switch between glob, regex, and fuzzy search modes
- **Real-time Filtering**: See results instantly as you type
- **Source Control Integration**: Optionally respect .gitignore and other ignore files
- **File Tree View**: Hierarchical display of filtered results
- **Advanced Configuration**: Customizable settings for different workflows
- **Performance Optimized**: Efficient filtering with caching and debouncing

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "FileList Panel"
4. Click Install

### From OpenVSX Registry (for Cursor)
1. Open Cursor
2. Go to Extensions
3. Search for "FileList Panel"
4. Click Install

### Manual Installation
1. Download the .vsix file from the releases page
2. In VS Code/Cursor, press Ctrl+Shift+P
3. Type "Extensions: Install from VSIX..."
4. Select the downloaded .vsix file

## Usage

### Basic Usage
1. Open the FileList panel from the Activity Bar
2. Type your search pattern in the filter input
3. Switch between filter modes using the mode buttons
4. Click on files to open them

### Filter Modes

#### Glob Mode
- Use standard glob patterns: `*.ts`, `**/*.js`, `src/**/*.{ts,js}`
- Negation with `!`: `*.ts,!*.test.ts`
- Case-sensitive option available

#### Regex Mode
- Full JavaScript regex support: `\.(ts|js)$`
- Flags support: `/pattern/flags`
- Real-time validation with error highlighting

#### Fuzzy Mode
- Intelligent fuzzy matching
- Score-based ranking
- Tolerant of typos and partial matches

### Configuration

Configure the extension through VS Code settings:

```json
{
  "fileList.defaultFilterMode": "fuzzy",
  "fileList.respectGitignore": true,
  "fileList.maxResults": 1000,
  "fileList.caseSensitive": false,
  "fileList.debounceDelay": 300,
  "fileList.showFileIcons": true,
  "fileList.showFileSize": false,
  "fileList.showModifiedDate": false
}
```

## Development

### Prerequisites
- Node.js 18.x or later
- VS Code 1.74.0 or later

### Setup
1. Clone the repository
```bash
git clone https://github.com/matt-edmondson/FileList.git
cd FileList
```

2. Install dependencies
```bash
npm install
```

3. Open in VS Code
```bash
code .
```

### Building
```bash
npm run compile
```

### Testing
```bash
npm test
```

### Development Mode
```bash
npm run watch
```

Then press F5 to launch the extension in a new Extension Development Host window.

### Packaging
```bash
npm run package
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Report bugs on [GitHub Issues](https://github.com/matt-edmondson/FileList/issues)
- Feature requests welcome
- Documentation improvements appreciated

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history. 