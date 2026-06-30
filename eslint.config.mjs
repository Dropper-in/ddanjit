import nextConfig from 'eslint-config-next';

const config = [
  ...nextConfig,
  {
    // @typescript-eslint 플러그인은 eslint-config-next가 TS 파일 한정 등록 → 룰도 ts/tsx로 스코프
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    rules: {
      // pixel-art 아이콘(16~64px)과 data URL은 next/image 이득 없음
      '@next/next/no-img-element': 'off',
      // clock init, localStorage 초기화 등 mount-only setState는 정당한 패턴
      'react-hooks/set-state-in-effect': 'off',
      // 렌더 중 ref 동기화(snapshot ref 패턴)는 stale closure 방지용 공식 패턴
      'react-hooks/refs': 'off',
    },
  },
];

export default config;
