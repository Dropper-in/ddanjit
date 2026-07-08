import type React from 'react';
import { iconUrl, type IconName } from '@/shared/icons';

// div 기반 클릭 항목을 키보드로도 실행 가능하게 — role/tabIndex + Enter/Space
export function activatable(run: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: run,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        run();
      }
    },
  };
}

/** 클래스명 조합 — falsy 값 자동 제거 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * "." 또는 "/" 포함이면 외부 URL/경로, 아니면 IconName으로 조회
 * Button, Window, Dialog 공용
 */
export function resolveIcon(icon: IconName | string | undefined): string | undefined {
  if (!icon) return undefined;
  if (/[./]/.test(icon)) return icon;
  return iconUrl(icon as IconName);
}
