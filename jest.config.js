export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/'
  ],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/test/setup.js'],
  verbose: true
}; 