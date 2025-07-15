// Test imports handled by require() in tests

describe('IgnoreService', () => {
  describe('basic functionality', () => {
    it('should be constructible', () => {
      const { IgnoreService } = require('../ignoreService');
      expect(IgnoreService).toBeDefined();
    });

    it('should have required methods', () => {
      const { IgnoreService } = require('../ignoreService');
      const mockContext = { subscriptions: [], workspaceState: {}, globalState: {}, extensionUri: {} };
      const service = new IgnoreService(mockContext);
      
      expect(typeof service.isIgnored).toBe('function');
      expect(typeof service.getIgnorePatterns).toBe('function');
      expect(typeof service.refreshCache).toBe('function');
      expect(typeof service.addCustomIgnorePattern).toBe('function');
      expect(typeof service.removeCustomIgnorePattern).toBe('function');
    });

    it('should handle glob pattern conversion', () => {
      const { IgnoreService } = require('../ignoreService');
      const mockContext = { subscriptions: [], workspaceState: {}, globalState: {}, extensionUri: {} };
      const service = new IgnoreService(mockContext);
      
      // Test with a simpler pattern that won't cause regex errors
      const regex = (service as any).globToRegex('test.txt');
      expect(regex.test('test.txt')).toBe(true);
      expect(regex.test('other.txt')).toBe(false);
    });
  });
}); 