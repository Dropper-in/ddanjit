import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@/shared/ui/icon';
import { ICONS_16, type IconName } from '@/shared/icons';

const meta: Meta<typeof Icon> = {
  title: 'Foundations / Icon',
  component: Icon,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: { name: 'notepad', size: 16 },
};

export const Large: Story = {
  args: { name: 'notepad', size: 48 },
};

export const AllIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 80px)',
        gap: 12,
        padding: 24,
        background: 'var(--chrome)',
      }}
    >
      {(Object.keys(ICONS_16) as IconName[]).map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Mona Small, Mona, monospace',
            fontSize: 9,
            color: 'var(--ink-dim)',
            textAlign: 'center',
            padding: 8,
          }}
        >
          <Icon name={name} size={32} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  ),
};
