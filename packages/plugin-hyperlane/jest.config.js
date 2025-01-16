/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    module: 'commonjs',
                },
            },
        ],
        '^.+\\.jsx?$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@hyperlane-xyz)/)',
    ],
    moduleNameMapper: {
        '^@hyperlane-xyz/(.*)$': '<rootDir>/../../node_modules/@hyperlane-xyz/$1/dist/index.js',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['<rootDir>/jest.setup.js'],
};