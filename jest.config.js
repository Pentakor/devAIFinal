export default {
  testEnvironment: 'node',
  transform: {},
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  setupFiles: ['./test/setup.js'],
  setupFilesAfterEnv: [],
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}; 