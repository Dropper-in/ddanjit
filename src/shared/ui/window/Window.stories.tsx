import type { Meta, StoryObj } from '@storybook/react';
import { Window } from '@/shared/ui/window';
import { StatusBar } from '@/shared/ui/status-bar';

const meta: Meta<typeof Window> = {
  title: 'OS Chrome / Window',
  component: Window,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 480, height: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Window>;

export const Default: Story = {
  args: {
    title: 'untitled.bmp - 그림판',
    icon: 'notepad',
    active: true,
    children: (
      <div style={{ flex: 1, padding: 16, background: 'var(--paper)' }}>
        여기에 앱 내용이 들어갑니다.
      </div>
    ),
  },
};

export const Inactive: Story = {
  args: {
    title: 'untitled.bmp - 그림판',
    icon: 'notepad',
    active: false,
    children: <div style={{ flex: 1, padding: 16, background: 'var(--paper)' }}>비활성 창</div>,
  },
};

export const WithStatusBar: Story = {
  args: {
    title: '딴생각아카이브.txt - 메모장',
    icon: 'notepad',
    active: true,
    children: (
      <>
        <div style={{ flex: 1, padding: 16, background: 'var(--paper)' }}>내용</div>
        <StatusBar hint="총 8개의 딴생각이 저장되어 있습니다." />
      </>
    ),
  },
};
