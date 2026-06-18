import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/shared/ui/button';

const meta: Meta<typeof Button> = {
  title: 'OS Chrome / Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: 'var(--chrome)', display: 'flex', gap: 8 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: '확인' },
};

export const DefaultAction: Story = {
  args: { children: '확인', isDefault: true },
};

export const WithIcon: Story = {
  args: { children: '저장', icon: 'floppy' },
};

export const Disabled: Story = {
  args: { children: '실행 취소', disabled: true },
};

export const Pressed: Story = {
  args: { children: '선택됨', pressed: true },
};

export const Row: Story = {
  render: () => (
    <>
      <Button isDefault>확인</Button>
      <Button>취소</Button>
      <Button>적용</Button>
    </>
  ),
};
