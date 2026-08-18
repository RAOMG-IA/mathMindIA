// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/dist/**', '**/.turbo/**', '**/.expo/**', '**/coverage/**', '**/node_modules/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Archivos de config CommonJS (p.ej. babel.config.js de Expo) -- module/require
    // no son globals reconocidos por defecto en flat config.
    files: ['**/babel.config.js', '**/*.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  {
    // Scripts Node.js sueltos (p.ej. el servidor estatico de e2e, ADR-018) -- a diferencia
    // del resto del repo (.ts), no pasan por typescript-eslint, que es quien normalmente
    // aporta los globals ambientales de @types/node al analisis de scope de no-undef.
    files: ['**/e2e/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
      },
    },
  },
)
