import type { ReactNode, CSSProperties } from 'react';
import type { IconName } from '@/shared/icons';
import { cx, resolveIcon } from '@/shared/lib/ui';
import styles from './Window.module.scss';

export interface WindowProps {
  icon?: IconName | string;
  title: string;
  active?: boolean;
  onMin?: () => void;
  onMax?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Window({
  icon,
  title,
  active = true,
  onMin: _onMin,
  onMax: _onMax,
  onClose,
  children,
  style,
  className,
}: WindowProps) {
  const iconSrc = resolveIcon(icon);
  return (
    <div className={cx(styles.window, className)} style={style}>
      <div className={cx(styles.titlebar, !active ? styles.inactive : undefined)}>
        {iconSrc && <img className={styles.icon} src={iconSrc} alt="" />}
        <span className={styles.title}>{title}</span>
        <div className={styles.ctrls}>
          {/* {onMin && (
            <button className={styles.ctrl} onClick={onMin} title="최소화" type="button">
              <span className="ctrl-glyph ctrl-glyph-min" aria-label="minimize" />
            </button>
          )}
          {onMax && (
            <button className={styles.ctrl} onClick={onMax} title="최대화" type="button">
              <span className="ctrl-glyph ctrl-glyph-max" aria-label="maximize" />
            </button>
          )} */}
          {onClose && (
            <button className={styles.ctrl} onClick={onClose} title="닫기" type="button">
              <span className="ctrl-glyph ctrl-glyph-close" aria-label="close" />
            </button>
          )}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
