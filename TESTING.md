# Testing Documentation

## Overview

This document describes the testing infrastructure and practices for the FileList Panel VS Code extension.

## Test Structure

### Unit Tests
- **Location**: `src/**/__tests__/*.test.ts`
- **Purpose**: Test individual components and functions in isolation
- **Framework**: Jest with ts-jest transformer
- **Coverage**: All core functionality including filters, services, and utilities

### Integration Tests
- **Location**: `src/__tests__/integration/*.integration.test.ts`
- **Purpose**: Test component interactions and extension loading
- **Framework**: Jest with separate configuration
- **Coverage**: Extension activation, command registration, and service integration

## Test Configuration

### Jest Configuration Files
- `jest.config.js` - Main unit test configuration
- `jest.integration.config.js` - Integration test configuration
- `src/__tests__/setup.ts` - Test environment setup with VS Code API mocks

### Key Configuration Features
- TypeScript support via ts-jest
- VS Code API mocking for extension testing
- Code coverage reporting (text, lcov, html)
- Parallel test execution with worker limits
- Module name mapping for path aliases

## Test Categories

### 1. Utility Tests (`src/utils/__tests__/`)
- **debounce.test.ts**: Tests for debounce and throttle functions
- **pathUtils.test.ts**: Tests for path manipulation utilities

### 2. Filter Tests (`src/filters/__tests__/`)
- **globFilter.test.ts**: Tests for glob pattern matching
- **regexFilter.test.ts**: Tests for regex pattern matching
- **fuzzyFilter.test.ts**: Tests for fuzzy search functionality

### 3. Service Tests (`src/services/__tests__/`)
- **fileService.test.ts**: Tests for file system operations
- **ignoreService.test.ts**: Tests for ignore pattern handling

### 4. Integration Tests (`src/__tests__/integration/`)
- **extension.integration.test.ts**: Tests for extension loading and exports

## Running Tests

### Available Scripts
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run all tests (unit + integration)
npm run test:all
```

### CI/CD Integration
Tests are automatically run in the CI/CD pipeline for:
- Pull requests
- Pushes to main/develop branches
- Before publishing to marketplace

## Test Utilities

### VS Code API Mocking
The test setup includes comprehensive mocking of VS Code APIs:
- `vscode.workspace` - Workspace operations
- `vscode.window` - UI operations
- `vscode.commands` - Command registration
- `vscode.Uri` - URI handling
- `vscode.TreeItemCollapsibleState` - Tree view states

### Custom Matchers
Tests use standard Jest matchers with additional custom expectations for:
- File path validation
- Pattern matching results
- Service method availability

## Coverage Requirements

### Current Coverage
- **Unit Tests**: 55 tests across 8 test suites
- **Integration Tests**: 2 tests across 1 test suite
- **Total**: 57 tests

### Coverage Targets
- Statements: 80%+
- Branches: 80%+
- Functions: 80%+
- Lines: 80%+

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names that explain the expected behavior
- Keep tests focused and isolated
- Use `beforeEach` for common setup

### Mocking Strategy
- Mock external dependencies (VS Code API, file system)
- Use simple mocks for basic functionality tests
- Avoid over-mocking that makes tests brittle

### Test Data
- Use realistic but minimal test data
- Create reusable test fixtures for complex scenarios
- Avoid hardcoded values that may change

## Troubleshooting

### Common Issues
1. **VS Code API not defined**: Ensure proper setup file import
2. **Module resolution errors**: Check moduleNameMapper configuration
3. **Async test failures**: Use proper async/await patterns
4. **Mock conflicts**: Clear mocks between tests

### Debug Tips
- Use `npm run test:watch` for rapid feedback
- Add `console.log` statements for debugging (temporarily)
- Use Jest's `--verbose` flag for detailed output
- Check test isolation by running individual test files

## Future Enhancements

### Planned Improvements
- Add end-to-end tests with VS Code extension host
- Implement visual regression testing for UI components
- Add performance benchmarks for filter operations
- Expand integration test coverage

### Test Automation
- Automated test generation for new components
- Property-based testing for complex algorithms
- Mutation testing for test quality assessment 