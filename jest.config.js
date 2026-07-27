// Jest runs the pure `core` domain suite — the spec's primary test target —
// plus the pure helpers behind the build scripts. Neither has a React Native
// dependency, so no native preset is needed.

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/core', '<rootDir>/scripts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
};
