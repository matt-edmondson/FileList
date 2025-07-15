import { FileItem, FilterOptions, IFilter } from '../types';

export class RegexFilter implements IFilter {
  private readonly timeoutMs = 1000; // 1 second timeout for regex execution

  async apply(files: FileItem[], options: FilterOptions): Promise<FileItem[]> {
    if (!options.pattern.trim()) {
      return files;
    }

    try {
      const regex = this.createRegex(options.pattern, options.caseSensitive);
      
      return files.filter(file => {
        try {
          const testPath = file.relativePath;
          const fileName = file.name;
          
          // Test against both full path and filename
          return this.testWithTimeout(regex, testPath) || 
                 this.testWithTimeout(regex, fileName);
        } catch (error) {
          // If regex fails on this file, exclude it
          return false;
        }
      });
    } catch (error) {
      // If regex is invalid, return empty results
      return [];
    }
  }

  isValid(pattern: string): boolean {
    if (!pattern.trim()) {
      return true;
    }

    try {
      // Try to create the regex
      const { pattern: regexPattern, flags } = this.parsePattern(pattern);
      new RegExp(regexPattern, flags);
      return true;
    } catch {
      return false;
    }
  }

  private createRegex(pattern: string, caseSensitive: boolean): RegExp {
    const { pattern: regexPattern, flags: patternFlags } = this.parsePattern(pattern);
    
    // Combine case sensitivity with any flags from the pattern
    let flags = patternFlags;
    if (!caseSensitive && !flags.includes('i')) {
      flags += 'i';
    }
    
    return new RegExp(regexPattern, flags);
  }

  private parsePattern(pattern: string): { pattern: string; flags: string } {
    // Check if pattern is in the format /pattern/flags
    const match = pattern.match(/^\/(.+)\/([gimuy]*)$/);
    
    if (match) {
      return {
        pattern: match[1],
        flags: match[2] || ''
      };
    }
    
    // Plain pattern without delimiters
    return {
      pattern,
      flags: ''
    };
  }

  private testWithTimeout(regex: RegExp, text: string): boolean {
    const startTime = Date.now();
    
    try {
      // Reset the regex index for global regexes
      regex.lastIndex = 0;
      
      const result = regex.test(text);
      
      // Check if we're taking too long
      if (Date.now() - startTime > this.timeoutMs) {
        throw new Error('Regex timeout');
      }
      
      return result;
    } catch (error) {
      // Timeout or other error
      return false;
    }
  }

  // Helper method to provide suggestions for common regex patterns
  getSuggestions(): string[] {
    return [
      '\\.(ts|js)$',
      '\\.(json|yml|yaml)$',
      '^src/',
      '\\.(test|spec)\\.',
      '^[A-Z]', // Files starting with uppercase
      '\\.(d\\.ts)$', // TypeScript declaration files
      '\\.(config|rc)\\.',
      'README',
      '^\\.',  // Hidden files
      '\\.(md|txt)$',
      '\\.(png|jpg|jpeg|gif|svg)$',
      '\\.(css|scss|sass|less)$',
      '\\.(html|htm|xml)$',
      '\\b(package|tsconfig|webpack)\\b',
      '\\.(lock|log)$',
      '/i', // Case insensitive flag example
      '/g', // Global flag example
      '/m'  // Multiline flag example
    ];
  }

  // Helper method to escape special regex characters
  escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Helper method to validate and explain regex patterns
  explainPattern(pattern: string): string {
    try {
      const { pattern: regexPattern, flags } = this.parsePattern(pattern);
      
      let explanation = `Regular expression: ${regexPattern}`;
      
      if (flags) {
        const flagExplanations = [];
        if (flags.includes('i')) flagExplanations.push('case insensitive');
        if (flags.includes('g')) flagExplanations.push('global');
        if (flags.includes('m')) flagExplanations.push('multiline');
        if (flags.includes('u')) flagExplanations.push('unicode');
        if (flags.includes('y')) flagExplanations.push('sticky');
        
        if (flagExplanations.length > 0) {
          explanation += ` (${flagExplanations.join(', ')})`;
        }
      }
      
      // Add some basic pattern explanations
      if (regexPattern.includes('^')) {
        explanation += ' - Matches from beginning of string';
      }
      if (regexPattern.includes('$')) {
        explanation += ' - Matches to end of string';
      }
      if (regexPattern.includes('\\.(')) {
        explanation += ' - Matches file extensions';
      }
      
      return explanation;
    } catch (error) {
      return `Invalid regex pattern: ${pattern}`;
    }
  }

  // Helper method to test regex against sample text
  testPattern(pattern: string, testText: string): { matches: boolean; error?: string } {
    try {
      const regex = this.createRegex(pattern, false);
      const matches = this.testWithTimeout(regex, testText);
      return { matches };
    } catch (error) {
      return { 
        matches: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Helper method to find all matches in text
  findMatches(pattern: string, text: string): string[] {
    try {
      const { pattern: regexPattern, flags } = this.parsePattern(pattern);
      let finalFlags = flags;
      
      // Ensure global flag for finding all matches
      if (!finalFlags.includes('g')) {
        finalFlags += 'g';
      }
      
      const regex = new RegExp(regexPattern, finalFlags);
      const matches: string[] = [];
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        matches.push(match[0]);
        
        // Prevent infinite loops
        if (matches.length > 1000) {
          break;
        }
      }
      
      return matches;
    } catch (error) {
      return [];
    }
  }
} 