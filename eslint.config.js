// Flat ESLint config (ESLint 9+). Lints the registry package, the web client
// and the gate scripts.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.cjs'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // Allow deliberately-unused identifiers when prefixed with `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // TypeScript already errors on genuinely-undefined identifiers, and
      // `no-undef` false-positives on type-only references and generic params.
      'no-undef': 'off',
    },
  },

  // The web client runs in a browser.
  { files: ['packages/web/**'], languageOptions: { globals: { ...globals.browser } } },

  // Gate scripts are CLIs run through tsx; `any` when shaping untyped external
  // JSON (NCBI, GtoPdb) is pragmatic and not worth typing out.
  { files: ['scripts/**'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },

  { files: ['**/*.test.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
