import Fuse from 'fuse.js';
import { FileItem, FilterOptions, IFilter } from '../types';

export class FuzzyFilter implements IFilter {
  async apply(files: FileItem[], options: FilterOptions): Promise<FileItem[]> {
    if (!options.pattern.trim()) {
      return files;
    }

    const fuse = new Fuse(files, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'relativePath', weight: 0.6 }
      ],
      threshold: 0.4, // Lower = more strict matching
      distance: 1000, // How far to search for pattern
      minMatchCharLength: 1,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      shouldSort: true,
      isCaseSensitive: options.caseSensitive,
      findAllMatches: true
    });

    const results = fuse.search(options.pattern);
    
    // Sort by score (lower is better in Fuse.js)
    results.sort((a, b) => (a.score || 0) - (b.score || 0));
    
    // Apply max results limit
    const limitedResults = results.slice(0, options.maxResults);
    
    return limitedResults.map(result => result.item);
  }

  isValid(pattern: string): boolean {
    // Fuzzy search is generally tolerant of any input
    return true;
  }

  // Advanced fuzzy search with custom scoring
  async applyAdvanced(files: FileItem[], options: FilterOptions): Promise<FileItem[]> {
    if (!options.pattern.trim()) {
      return files;
    }

    const pattern = options.pattern.toLowerCase();
    const results: Array<{ item: FileItem; score: number }> = [];

    for (const file of files) {
      const score = this.calculateFuzzyScore(
        file.name,
        file.relativePath,
        pattern,
        options.caseSensitive
      );

      if (score > 0) {
        results.push({ item: file, score });
      }
    }

    // Sort by score (higher is better)
    results.sort((a, b) => b.score - a.score);

    // Apply max results limit
    return results.slice(0, options.maxResults).map(r => r.item);
  }

  private calculateFuzzyScore(
    fileName: string,
    relativePath: string,
    pattern: string,
    caseSensitive: boolean
  ): number {
    const searchName = caseSensitive ? fileName : fileName.toLowerCase();
    const searchPath = caseSensitive ? relativePath : relativePath.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

    let score = 0;

    // Exact matches get highest score
    if (searchName === searchPattern) {
      score += 100;
    } else if (searchPath === searchPattern) {
      score += 90;
    }

    // Starts with pattern
    if (searchName.startsWith(searchPattern)) {
      score += 80;
    } else if (searchPath.startsWith(searchPattern)) {
      score += 70;
    }

    // Contains pattern
    if (searchName.includes(searchPattern)) {
      score += 60;
    } else if (searchPath.includes(searchPattern)) {
      score += 50;
    }

    // Fuzzy character matching
    const nameMatch = this.fuzzyMatch(searchName, searchPattern);
    const pathMatch = this.fuzzyMatch(searchPath, searchPattern);

    if (nameMatch.matches) {
      score += 40 * nameMatch.score;
    } else if (pathMatch.matches) {
      score += 30 * pathMatch.score;
    }

    // Bonus for shorter paths (more relevant)
    if (score > 0) {
      const lengthBonus = Math.max(0, 1 - (relativePath.length / 100));
      score += lengthBonus * 10;
    }

    return score;
  }

  private fuzzyMatch(text: string, pattern: string): { matches: boolean; score: number } {
    if (pattern.length === 0) {
      return { matches: true, score: 1 };
    }

    let textIndex = 0;
    let patternIndex = 0;
    let matches = 0;
    let consecutiveMatches = 0;
    let maxConsecutiveMatches = 0;

    while (textIndex < text.length && patternIndex < pattern.length) {
      if (text[textIndex] === pattern[patternIndex]) {
        matches++;
        consecutiveMatches++;
        maxConsecutiveMatches = Math.max(maxConsecutiveMatches, consecutiveMatches);
        patternIndex++;
      } else {
        consecutiveMatches = 0;
      }
      textIndex++;
    }

    const matchesAll = patternIndex === pattern.length;
    const matchRatio = matches / pattern.length;
    const consecutiveBonus = maxConsecutiveMatches / pattern.length;

    return {
      matches: matchesAll,
      score: matchRatio * 0.7 + consecutiveBonus * 0.3
    };
  }

  // Helper method to provide suggestions for fuzzy search
  getSuggestions(): string[] {
    return [
      'component',
      'test',
      'config',
      'service',
      'util',
      'type',
      'interface',
      'class',
      'function',
      'index',
      'readme',
      'package',
      'json',
      'ts',
      'js',
      'src',
      'dist',
      'build',
      'node',
      'git'
    ];
  }

  // Helper method to highlight matches in text
  highlightMatches(text: string, pattern: string, caseSensitive: boolean = false): string {
    if (!pattern.trim()) {
      return text;
    }

    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

    // Simple highlighting for exact matches
    if (searchText.includes(searchPattern)) {
      const regex = new RegExp(
        this.escapeRegex(searchPattern),
        caseSensitive ? 'g' : 'gi'
      );
      return text.replace(regex, '<mark>$&</mark>');
    }

    // Fuzzy character highlighting
    let result = '';
    let textIndex = 0;
    let patternIndex = 0;
    let inMatch = false;

    while (textIndex < text.length) {
      if (patternIndex < searchPattern.length &&
          searchText[textIndex] === searchPattern[patternIndex]) {
        if (!inMatch) {
          result += '<mark>';
          inMatch = true;
        }
        result += text[textIndex];
        patternIndex++;
      } else {
        if (inMatch) {
          result += '</mark>';
          inMatch = false;
        }
        result += text[textIndex];
      }
      textIndex++;
    }

    if (inMatch) {
      result += '</mark>';
    }

    return result;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Helper method to get search statistics
  getSearchStats(files: FileItem[], pattern: string): {
    totalFiles: number;
    matchedFiles: number;
    averageScore: number;
    topMatches: Array<{ file: FileItem; score: number }>;
  } {
    if (!pattern.trim()) {
      return {
        totalFiles: files.length,
        matchedFiles: 0,
        averageScore: 0,
        topMatches: []
      };
    }

    const results: Array<{ file: FileItem; score: number }> = [];

    for (const file of files) {
      const score = this.calculateFuzzyScore(
        file.name,
        file.relativePath,
        pattern.toLowerCase(),
        false
      );

      if (score > 0) {
        results.push({ file, score });
      }
    }

    results.sort((a, b) => b.score - a.score);

    const averageScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
      : 0;

    return {
      totalFiles: files.length,
      matchedFiles: results.length,
      averageScore,
      topMatches: results.slice(0, 10)
    };
  }

  // Helper method to suggest similar patterns
  suggestSimilarPatterns(pattern: string, files: FileItem[]): string[] {
    if (!pattern.trim()) {
      return [];
    }

    const suggestions = new Set<string>();
    const lowercasePattern = pattern.toLowerCase();

    // Find files with similar names
    for (const file of files) {
      const name = file.name.toLowerCase();
      const path = file.relativePath.toLowerCase();

      // Add parts of filenames that contain the pattern
      if (name.includes(lowercasePattern)) {
        suggestions.add(file.name);
      }

      // Add directory names that contain the pattern
      const pathParts = path.split('/');
      for (const part of pathParts) {
        if (part.includes(lowercasePattern) && part !== file.name) {
          suggestions.add(part);
        }
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }
} 