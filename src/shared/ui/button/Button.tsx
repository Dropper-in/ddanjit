import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';
import type { IconName } from '@/shared/icons';
import { cx, resolveIcon } from '@/shared/lib/ui';
import styles from './Button.module.scss';

export interface ButtonProps {
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  isDefault?: boolean;
  disabled?: boolean;
  icon?: IconName | string;
  pressed?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: CSSProperties;
  className?: string;
  title?: string;
}

export function Button({
  children,
  onClick,
  isDefault,
  disabled,
  icon,
  pressed,
  type = 'button',
  style,
  className,
  title,
}: ButtonProps) {
  const iconSrc = resolveIcon(icon);
  // 'rpp-btn' 글로벌 클래스 유지 — _apps.scss 복합 셀렉터(.rpp-btn.dd-hero-cta 등) 타겟용 훅
  return (
    <button
      type={type}
      className={cx(styles.btn, 'rpp-btn', className)}
      data-default={isDefault ? 'true' : 'false'}
      data-pressed={pressed === undefined ? undefined : pressed ? 'true' : 'false'}
      disabled={disabled}
      onClick={onClick}
      title={title}
      style={style}
    >
      {iconSrc && (
        <img src={iconSrc} width="16" height="16" alt="" style={{ imageRendering: 'pixelated' }} />
      )}
      {children}
    </button>
  );
}
