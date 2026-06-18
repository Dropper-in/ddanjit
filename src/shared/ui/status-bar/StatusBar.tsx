import type { ReactNode } from 'react';
import { cx } from '@/shared/lib/ui';
import styles from './StatusBar.module.scss';

export interface StatusBarProps {
  hint?: ReactNode;
  x?: number | null;
  y?: number | null;
  size?: ReactNode;
  cells?: ReactNode[];
}

export function StatusBar({ hint, x, y, size, cells }: StatusBarProps) {
  return (
    <div className={styles.statusbar}>
      <div className={styles.cell}>{hint ?? 'For Help, click Help Topics on the Help Menu.'}</div>
      {x != null && (
        <div className={cx(styles.cell, styles.fixed)}>
          x: {x}, y: {y ?? 0}
        </div>
      )}
      {size != null && <div className={cx(styles.cell, styles.fixed)}>{size}</div>}
      {cells?.map((cell, i) => (
        <div className={cx(styles.cell, styles.fixed)} key={i}>
          {cell}
        </div>
      ))}
    </div>
  );
}
