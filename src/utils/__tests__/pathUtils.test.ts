import {
  normalizePath,
  getRelativePath,
  getFileName,
  getFileExtension,
  getDirectoryPath,
  joinPath,
  isSubPath,
  getDepth,
  isHidden,
  matchesPattern,
  sanitizePath,
  isValidPath,
  getWorkspaceRelativePath,
} from '../pathUtils';
import * as path from 'path';

// Mock the path module
jest.mock('path');
const mockPath = path as jest.Mocked<typeof path>;

describe('pathUtils', () => {
  describe('basic functionality', () => {
    it('should be able to import pathUtils', () => {
      const pathUtils = require('../pathUtils');
      expect(pathUtils).toBeDefined();
      expect(typeof pathUtils.normalizePath).toBe('function');
      expect(typeof pathUtils.getRelativePath).toBe('function');
      expect(typeof pathUtils.getFileName).toBe('function');
    });

    it('should handle getDepth correctly', () => {
      const { getDepth } = require('../pathUtils');
      expect(getDepth('folder/subfolder/file.txt')).toBe(2);
      expect(getDepth('file.txt')).toBe(0);
      expect(getDepth('')).toBe(0);
    });

    it('should handle sanitizePath correctly', () => {
      const { sanitizePath } = require('../pathUtils');
      expect(sanitizePath('invalid<>:"|?*path')).toBe('invalid_______path');
      expect(sanitizePath('valid/path/file.txt')).toBe('valid/path/file.txt');
    });
  });
}); 