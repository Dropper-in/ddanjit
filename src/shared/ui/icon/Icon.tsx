import type { CSSProperties } from 'react';
import { iconUrl, type IconName } from '@/shared/icons';

export interface IconProps {
  name: IconName;
  size?: number;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function Icon({ name, size = 16, alt, className, style, title }: IconProps) {
  return (
    <img
      src={iconUrl(name)}
      width={size}
      height={size}
      alt={alt ?? name}
      title={title}
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
      draggable={false}
    />
  );
}
