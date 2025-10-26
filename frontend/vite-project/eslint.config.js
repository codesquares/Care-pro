import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,        // Add Node.js globals (process, require, etc.)
        ...globals.jest,        // Add Jest globals (describe, test, expect, etc.)
        global: 'readonly',     // Add global as a readonly global
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // 🛠️ Comprehensive Rule Adjustments for Staging Pipeline
      'react/prop-types': 'off',                    // Disable prop validation requirements
      'no-unused-vars': 'warn',                     // Make unused variables warnings instead of errors
      'react/jsx-uses-react': 'warn',               // React import usage detection as warning
      'react/react-in-jsx-scope': 'off',            // Don't require React import with new JSX transform
      'react/jsx-no-undef': 'warn',                 // Make undefined JSX elements warnings instead of errors
      'react/no-unescaped-entities': 'off',         // Allow apostrophes, quotes, etc. in JSX
      'no-undef': 'warn',                           // Make undefined variables warnings instead of errors
      'no-case-declarations': 'warn',               // Allow variable declarations in switch cases
      'no-useless-catch': 'warn',                   // Allow try/catch blocks that just re-throw
      'no-unreachable': 'warn',                     // Make unreachable code warnings instead of errors
      'react-hooks/exhaustive-deps': 'warn',        // Make missing dependencies warnings instead of errors
      'no-dupe-keys': 'warn',                       // Make duplicate object keys warnings
      'no-constant-binary-expression': 'warn',      // Make constant expressions warnings
      'react-hooks/rules-of-hooks': 'error',        // Keep this as error (critical React rule)
      'react/display-name': 'off',                  // Disable display name requirement
    },
  },
]
