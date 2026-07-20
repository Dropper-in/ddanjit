'use client';
import type { ReactNode, CSSProperties } from 'react';
import type { IconName } from '@/shared/icons';
import { cx, resolveIcon } from '@/shared/lib/ui';
import { useDraggable } from '@/shared/lib/useDraggable';
import styles from './Window.module.scss';

export interface WindowProps {
  icon?: IconName | string;
  title: string;
  active?: boolean;
  draggable?: boolean; // 기본 false — 타이틀바 드래그로 창 이동
  onMin?: () => void; // 전달 시 최소화 버튼 렌더
  onMax?: () => void; // 전달 시 최대화 버튼 렌더
  onClose?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Window({
  icon,
  title,
  active = true,
  draggable = false,
  onMin,
  onMax,
  onClose,
  children,
  style,
  className,
}: WindowProps) {
  const iconSrc = resolveIcon(icon);
  const { rootRef, handleRef, transform, handleProps } = useDraggable(draggable);

  return (
    <div ref={rootRef} className={cx(styles.window, className)} style={{ ...style, ...transform }}>
      <div
        ref={handleRef}
        className={cx(
          styles.titlebar,
          !active ? styles.inactive : undefined,
          draggable ? styles.draggable : undefined,
        )}
        {...handleProps}
      >
        {iconSrc && <img className={styles.icon} src={iconSrc} alt="" />}
        <span className={styles.title}>{title}</span>
        {/* data-nodrag — 버튼 위에서 드래그 시작 방지 */}
        <div className={styles.ctrls} data-nodrag>
          {onMin && (
            <button className={styles.ctrl} onClick={onMin} title="최소화" type="button">
              <span className="ctrl-glyph ctrl-glyph-min" aria-label="minimize" />
            </button>
          )}
          {onMax && (
            <button className={styles.ctrl} onClick={onMax} title="최대화" type="button">
              <span className="ctrl-glyph ctrl-glyph-max" aria-label="maximize" />
            </button>
          )}
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
