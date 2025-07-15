import * as path from 'path';

export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to).replace(/\\/g, '/');
}

export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function getDirectoryPath(filePath: string): string {
  return path.dirname(filePath);
}

export function joinPath(...paths: string[]): string {
  return path.join(...paths).replace(/\\/g, '/');
}

export function isSubPath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function getDepth(filePath: string): number {
  return filePath.split('/').length - 1;
}

export function isHidden(filePath: string): boolean {
  const fileName = getFileName(filePath);
  return fileName.startsWith('.') && fileName !== '.' && fileName !== '..';
}

export function matchesPattern(filePath: string, patterns: string[]): boolean {
  const fileName = getFileName(filePath);
  const extension = getFileExtension(filePath);
  
  return patterns.some(pattern => {
    if (pattern.startsWith('*.')) {
      return extension === pattern.substring(1);
    }
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName) || regex.test(filePath);
    }
    return fileName === pattern || filePath.includes(pattern);
  });
}

export function sanitizePath(filePath: string): string {
  return filePath.replace(/[<>:"|?*]/g, '_');
}

export function isValidPath(filePath: string): boolean {
  try {
    path.parse(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getWorkspaceRelativePath(workspaceRoot: string, filePath: string): string {
  if (filePath.startsWith(workspaceRoot)) {
    return filePath.substring(workspaceRoot.length + 1);
  }
  return filePath;
} 