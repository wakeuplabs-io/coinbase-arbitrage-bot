import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                clearImmediate: 'readonly',
                // Node.js types
                NodeJS: 'readonly',
                // Web globals that might be used
                fetch: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin,
        },
        rules: {
            // TypeScript recommended rules
            ...typescriptPlugin.configs.recommended.rules,

            // Custom rules - more relaxed for development
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for now
            '@typescript-eslint/no-explicit-any': 'warn',

            // General rules - more relaxed
            'no-console': 'off', // Allow console statements for logging
            'no-debugger': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            'quotes': ['warn', 'single'], // Warn instead of error
            'semi': ['warn', 'always'], // Warn instead of error
            'comma-dangle': ['warn', 'always-multiline'], // Warn instead of error
        },
    },
    {
        files: ['**/*.test.ts', '**/*.spec.ts', '**/mocks/**/*.ts'],
        languageOptions: {
            globals: {
                // Jest globals
                describe: 'readonly',
                test: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': 'off',
        },
    },
    {
        ignores: [
            'node_modules/',
            'dist/',
            'build/',
            '*.min.js',
            '*.bundle.js',
            'coverage/',
            'logs/',
            '*.log',
        ],
    },
];
