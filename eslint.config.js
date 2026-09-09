// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/**
 * Import boundaries between the four areas of the internal structure manual
 * (section 3). Both the path alias and the relative form are listed, so that a
 * `../../features/...` climb is caught the same way as `@features/...`.
 *
 * The patterns are anchored on purpose. A bare `**\/layout/*` also matched
 * `@core/layout/...`, because "layout" is a legitimate folder name inside core
 * too — the rule then blocked an import it was never meant to police. An area
 * boundary is about the four top-level areas, not about a word.
 */
const boundary = (areas, message) => [
  'error',
  {
    patterns: [
      {
        group: areas.flatMap((area) => [
          `@${area}/*`,
          `**/app/${area}/*`,
          `../${area}/*`,
          `../../${area}/*`,
          `../../../${area}/*`,
        ]),
        message,
      },
    ],
  },
];

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // Underscore-prefixed parameters are deliberate: signatures required by
      // Angular (template type guards) whose body does not use them.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // The internal manual forbids type suffixes on class names.
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': boundary(
        ['features', 'layout'],
        'shared/ is reusable and free of business logic: it must not depend on a feature or on the shell.',
      ),
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': boundary(
        ['features', 'layout'],
        'core/ is application-wide infrastructure: it must not depend on a feature or on the shell.',
      ),
    },
  },
  {
    files: ['src/app/layout/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': boundary(
        ['features'],
        'layout/ is the visual shell: it must not depend on a feature.',
      ),
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
