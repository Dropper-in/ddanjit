'use client';
import { useState, useEffect, useRef } from 'react';
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
  const [stickyOpen, setStickyOpen] = useState(false);
  const [stickyClosing, setStickyClosing] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem('ddanjit-sticky-closed') !== '1') setStickyOpen(true);
    } catch {
      setStickyOpen(true);
    }
  }, []);

  function closeSticky() {
    setStickyClosing(true);
    setTimeout(() => {
      setStickyOpen(false);
      setStickyClosing(false);
      try {
        localStorage.setItem('ddanjit-sticky-closed', '1');
      } catch {
        /* noop */
      }
    }, 200);
  }

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
            className={cx(styles.icon, isSelected ? styles.selected : undefined)}
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelect(app.id);
            }}
            onDoubleClick={() => onOpen(app.id)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (isSelected) {
                onOpen(app.id);
              } else {
                onSelect(app.id);
              }
            }}
            title={app.titleEn}
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

      {stickyOpen && (
        <div className={cx(styles.sticky, stickyClosing ? styles.closing : undefined)}>
          <button className={styles.stickyClose} onClick={closeSticky} title="닫기" type="button">
            ×
          </button>
          <b>읽어주세요 ⓘ</b>
          <div>
            여기는 <b>딴짓.os</b>.<br />
            본업 안 하고
            <br />
            옆길로 새는
            <br />
            토이 프로젝트
            <br />
            모음입니다.
          </div>
          <div className={styles.dim} style={{ marginTop: 8 }}>
            아이콘을 더블클릭하면
            <br />
            앱이 열려요.
          </div>
        </div>
      )}
    </div>
  );
}
