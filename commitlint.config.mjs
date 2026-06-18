/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci']],
    'scope-empty': [2, 'always'], // scope 금지
    'subject-empty': [2, 'never'],
    'subject-case': [0], // 한국어 메시지 허용
  },
};

export default config;
