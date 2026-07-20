'use client';
import type { ReactNode } from 'react';
import type { IconName } from '@/shared/icons';
import { cx, resolveIcon } from '@/shared/lib/ui';
import { useDraggable } from '@/shared/lib/useDraggable';
import styles from './Dialog.module.scss';

export interface DialogProps {
  icon?: IconName | string;
  title: string;
  children?: ReactNode;
  buttons?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Dialog({ icon, title, children, buttons, onClose, className }: DialogProps) {
  const iconSrc = resolveIcon(icon);
  const { rootRef, handleRef, transform, handleProps } = useDraggable(true);
  return (
    // backdrop은 pointer-events:none — 중앙 정렬만 담당, 아래 창·작업표시줄 클릭 통과
    <div className={styles.backdrop}>
      <div
        ref={rootRef}
        className={cx(styles.dialog, className)}
        role="dialog"
        aria-label={title}
        style={transform}
      >
        <div ref={handleRef} className={cx(styles.titlebar, styles.draggable)} {...handleProps}>
          <span className={styles.title}>{title}</span>
          <div className={styles.ctrls} data-nodrag>
            <button className={styles.ctrl} onClick={onClose} title="닫기" type="button">
              <span className="ctrl-glyph ctrl-glyph-close" aria-label="close" />
            </button>
          </div>
        </div>
        <div className={styles.body}>
          {iconSrc && <img src={iconSrc} width="32" height="32" alt="" />}
          <div>{children}</div>
        </div>
        {buttons && <div className={styles.footer}>{buttons}</div>}
      </div>
    </div>
  );
}
