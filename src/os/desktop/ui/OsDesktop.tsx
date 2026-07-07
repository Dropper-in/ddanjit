'use client';
import { useRef } from 'react';
import { iconUrl } from '@/shared/icons';
import { cx } from '@/shared/lib/ui';
import styles from './OsDesktop.module.scss';
import type { AppDef } from '@/shared/types';

export type { AppDef };

export interface OsDesktopProps {
  apps: AppDef[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
  futureSlots?: number;
}

export function OsDesktop({ apps, selectedId, onSelect, onOpen, futureSlots = 3 }: OsDesktopProps) {
  const desktopRef = useRef<HTMLDivElement>(null);
  // 앱별 마지막 탭 시각 — 빠른 더블탭도 놓치지 않게 (선택 state 갱신 지연 우회)
  const lastTap = useRef<Record<string, number>>({});

  return (
    <div
      ref={desktopRef}
      className={styles.desktop}
      onMouseDown={(e) => {
        // 데스크탑 배경 직접 클릭 시 선택 해제
        if (e.target === desktopRef.current) onSelect(null);
      }}
    >
      {apps.map((app) => {
        const isSelected = selectedId === app.id;
        return (
          <div
            key={app.id}
            role="button"
            tabIndex={0}
            aria-label={app.titleKo}
            className={cx(styles.icon, isSelected ? styles.selected : undefined)}
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelect(app.id);
            }}
            onDoubleClick={() => onOpen(app.id)}
            onKeyDown={(e) => {
              // 키보드 사용자는 Enter/Space 한 번으로 실행
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(app.id);
              }
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              // 400ms 내 두 번째 탭이면 열기, 아니면 선택 (state 대신 ref로 즉시 판정)
              const now = Date.now();
              if (now - (lastTap.current[app.id] ?? 0) < 400) {
                onOpen(app.id);
              } else {
                onSelect(app.id);
              }
              lastTap.current[app.id] = now;
            }}
            title={app.description ?? app.titleEn}
          >
            <div className={styles.iconInner}>
              <img src={app.icon} alt={app.titleKo} />
              <span className={styles.labelKo}>{app.titleKo}</span>
            </div>
          </div>
        );
      })}

      {Array.from({ length: futureSlots }).map((_, i) => (
        <div
          key={'slot-' + i}
          className={cx(styles.icon, styles.comingSoon)}
          title="아직 만드는 중입니다"
        >
          <div className={styles.iconInner}>
            <img src={iconUrl('wrench')} alt="" />
            <span className={styles.labelKo}>준비중</span>
            <span className={styles.labelEn}>soon...</span>
          </div>
        </div>
      ))}
    </div>
  );
}
