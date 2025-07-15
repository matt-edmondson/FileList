export default async function globalTeardown() {
  // Clean up integration test environment
  console.log('Tearing down integration test environment...');
  
  // Clean up any global resources
  delete process.env.TEST_WORKSPACE;
} 