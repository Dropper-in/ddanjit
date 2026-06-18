import React from 'react';
import type { Preview, Decorator } from '@storybook/react';
import '../src/shared/styles/globals.scss';
const themeMap: Record<string, string> = {
  '#0a8c8c': '',
  '#e8d8a0': 'cream',
  '#9bbc0f': 'gameboy',
  '#001a00': 'crt',
  '#ffb8d8': 'bubblegum',
  '#0a1a4a': 'blueprint',
};

const withTheme: Decorator = (Story, context) => {
  const bg =
    (context.globals as { backgrounds?: { value?: string } }).backgrounds?.value ?? '#0a8c8c';
  document.documentElement.setAttribute('data-theme', themeMap[bg] ?? '');
  return <Story />;
};

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'win98',
      values: [
        { name: 'win98', value: '#0a8c8c' },
        { name: 'cream', value: '#e8d8a0' },
        { name: 'gameboy', value: '#9bbc0f' },
        { name: 'crt', value: '#001a00' },
        { name: 'bubblegum', value: '#ffb8d8' },
        { name: 'blueprint', value: '#0a1a4a' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [withTheme],
};

export default preview;
