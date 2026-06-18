import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  staticDirs: ['../public'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: { builder: { viteConfigPath: undefined } },
  },
  viteFinal: async (config) => {
    config.resolve!.alias = {
      ...config.resolve?.alias,
      '@': path.resolve(__dirname, '../src'),
    };
    config.esbuild = { ...config.esbuild, jsx: 'automatic' };
    config.css = {
      ...config.css,
      preprocessorOptions: {
        scss: {
          // vite 6 = sass 모던 API. includePaths(legacy) 대신 loadPaths.
          loadPaths: [path.resolve(__dirname, '../src/shared/styles')],
        },
      },
    };
    return config;
  },
};

export default config;
