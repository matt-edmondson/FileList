import { FileService } from '../fileService';
import { FileItem } from '../../types';
import { vscode } from '../../__tests__/setup';

describe('FileService', () => {
  describe('basic functionality', () => {
    it('should be constructible', () => {
      // This test ensures the service can be imported and instantiated
      const { FileService } = require('../fileService');
      expect(FileService).toBeDefined();
    });

    it('should have required methods', () => {
      const { FileService } = require('../fileService');
      const mockContext = { subscriptions: [], workspaceState: {}, globalState: {}, extensionUri: {} };
      const service = new FileService(mockContext);
      
      expect(typeof service.getWorkspaceFiles).toBe('function');
      expect(typeof service.getFileStats).toBe('function');
      expect(typeof service.refreshFileCache).toBe('function');
      expect(typeof service.openFile).toBe('function');
      expect(typeof service.copyPath).toBe('function');
    });
  });
}); 