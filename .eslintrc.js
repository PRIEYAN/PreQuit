const deny = (patterns, message) => [
  'error',
  { patterns: patterns.map(group => ({ group, message })) },
];

module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['landing/**/*.js'],
      env: { browser: true, es2022: true },
      rules: {
        'no-undef': 'error',
      },
    },
    {
      files: ['src/domain/**/*.js'],
      rules: {
        'no-restricted-imports': deny(
          [
            ['**/application/**', '**/data/**', '**/presentation/**'],
            ['react', 'react-native', 'react-native/**', '@react-navigation/**', '@react-native-async-storage/**'],
          ],
          'domain/ is the innermost layer: it may not import an outer layer or any framework.',
        ),
      },
    },
    {
      files: ['src/application/**/*.js'],
      rules: {
        'no-restricted-imports': deny(
          [
            ['**/data/**', '**/presentation/**'],
            ['react', 'react-native', 'react-native/**', '@react-navigation/**'],
          ],
          'application/ may depend on domain/ only, and must stay framework-free.',
        ),
      },
    },
    {
      files: ['src/data/**/*.js'],
      rules: {
        'no-restricted-imports': deny(
          [
            ['**/presentation/**'],
            ['react', '@react-navigation/**'],
          ],
          'data/ implements domain ports; it must not reach into presentation/ or React.',
        ),
      },
    },
  ],
};
