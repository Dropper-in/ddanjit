import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/fortune/*/opengraph-image': ['public/fonts/Mona12Fortune.ttf'],
  },
  sassOptions: {
    // SCSS @use 'mixins' as * 등 짧은 경로 허용
    includePaths: ['./src/shared/styles'],
  },
};

export default nextConfig;
