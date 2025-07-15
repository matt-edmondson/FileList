import { minimatch } from 'minimatch';
import { FileItem, FilterOptions, IFilter } from '../types';

export class GlobFilter implements IFilter {
  async apply(files: FileItem[], options: FilterOptions): Promise<FileItem[]> {
    if (!options.pattern.trim()) {
      return files;
    }

    const patterns = this.parsePatterns(options.pattern);
    const includePatterns = patterns.include;
    const excludePatterns = patterns.exclude;

    return files.filter(file => {
      const testPath = file.relativePath;
      
      // Check if file matches any include pattern
      const included = includePatterns.length === 0 || 
        includePatterns.some(pattern => 
          minimatch(testPath, pattern, {
            nocase: !options.caseSensitive,
            dot: true,
            matchBase: true
          })
        );

      if (!included) {
        return false;
      }

      // Check if file matches any exclude pattern
      const excluded = excludePatterns.some(pattern => 
        minimatch(testPath, pattern, {
          nocase: !options.caseSensitive,
          dot: true,
          matchBase: true
        })
      );

      return !excluded;
    });
  }

  isValid(pattern: string): boolean {
    if (!pattern.trim()) {
      return true;
    }

    try {
      const patterns = this.parsePatterns(pattern);
      // Test each pattern with minimatch
      [...patterns.include, ...patterns.exclude].forEach(p => {
        minimatch.makeRe(p);
      });
      return true;
    } catch {
      return false;
    }
  }

  private parsePatterns(pattern: string): { include: string[]; exclude: string[] } {
    const include: string[] = [];
    const exclude: string[] = [];

    // Split by comma and process each pattern
    const patterns = pattern.split(',').map(p => p.trim()).filter(p => p);

    for (const p of patterns) {
      if (p.startsWith('!')) {
        // Exclusion pattern
        exclude.push(p.substring(1));
      } else {
        // Inclusion pattern
        include.push(p);
      }
    }

    return { include, exclude };
  }

  // Helper method to provide suggestions for common glob patterns
  getSuggestions(): string[] {
    return [
      '*.ts',
      '*.js',
      '*.json',
      '**/*.ts',
      '**/*.js',
      'src/**/*.ts',
      'test/**/*.spec.ts',
      '*.{ts,js,json}',
      '**/*.{ts,js}',
      '!node_modules/**',
      '!**/*.test.ts',
      '!dist/**',
      '!build/**',
      'src/**/*.ts,!src/**/*.test.ts',
      '**/*.md',
      '*.config.{js,ts,json}',
      'package*.json',
      'tsconfig*.json',
      'README*',
      '*.yml,*.yaml',
      'Dockerfile*',
      '.github/**/*.yml'
    ];
  }

  // Helper method to escape special glob characters
  escapeGlob(str: string): string {
    return str.replace(/[*?[\]{}()!]/g, '\\$&');
  }

  // Helper method to validate and normalize glob patterns
  normalizePattern(pattern: string): string {
    let normalized = pattern.trim();
    
    // Handle Windows-style paths
    normalized = normalized.replace(/\\/g, '/');
    
    // Remove leading ./ if present
    if (normalized.startsWith('./')) {
      normalized = normalized.substring(2);
    }
    
    // Add ** if pattern starts with / for absolute matching
    if (normalized.startsWith('/')) {
      normalized = '**' + normalized;
    }
    
    return normalized;
  }

  // Helper method to explain what a glob pattern does
  explainPattern(pattern: string): string {
    const normalized = this.normalizePattern(pattern);
    
    if (normalized.includes('**')) {
      if (normalized.includes('**/')) {
        return `Matches files in any subdirectory: ${normalized}`;
      } else {
        return `Matches files at any depth: ${normalized}`;
      }
    } else if (normalized.includes('*')) {
      return `Matches files with wildcards: ${normalized}`;
    } else if (normalized.includes('?')) {
      return `Matches files with single character wildcards: ${normalized}`;
    } else if (normalized.includes('{')) {
      return `Matches files with multiple extensions: ${normalized}`;
    } else if (normalized.includes('[')) {
      return `Matches files with character ranges: ${normalized}`;
    } else {
      return `Matches exact path: ${normalized}`;
    }
  }
} 