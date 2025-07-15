import { jest } from '@jest/globals';

export default async function globalSetup() {
  // Set up global test environment for integration tests
  console.log('Setting up integration test environment...');
  
  // Mock workspace folder
  process.env.TEST_WORKSPACE = '/tmp/test-workspace';
  
  // Set up test timeout
  jest.setTimeout(30000);
} 