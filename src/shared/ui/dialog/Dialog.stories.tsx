import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

const meta: Meta<typeof Dialog> = {
  title: 'OS Chrome / Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 600, height: 400, background: 'var(--desktop)' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  args: {
    title: '정말로 삭제하시겠습니까?',
    icon: 'logo-mark',
    children: '이런! 정말로 삭제하시겠습니까? 지금 되돌리실 기회입니다.',
    buttons: (
      <>
        <Button isDefault>확인</Button>
        <Button>취소</Button>
      </>
    ),
  },
};

export const Shutdown: Story = {
  args: {
    title: '전원 끄기',
    icon: 'start',
    children: (
      <div>
        이제 컴퓨터를 꺼도 안전합니다.
        <br />
        <span style={{ color: 'var(--ink-dim)' }}>...라고 말하고 싶었지만, 사실은 농담이에요.</span>
      </div>
    ),
    buttons: (
      <>
        <Button isDefault>확인</Button>
        <Button>취소</Button>
      </>
    ),
  },
};

export const Confirm: Story = {
  args: {
    title: '정말 파일을 지우시겠습니까?',
    children: '이 딴생각은 영원히 사라집니다.',
    buttons: (
      <>
        <Button isDefault>예</Button>
        <Button>아니요</Button>
        <Button>취소</Button>
      </>
    ),
  },
};
