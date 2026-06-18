import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  sassOptions: {
    // SCSS @use 'mixins' as * 등 짧은 경로 허용
    includePaths: ['./src/shared/styles'],
  },
};

export default nextConfig;
