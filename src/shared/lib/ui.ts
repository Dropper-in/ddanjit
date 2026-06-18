import { iconUrl, type IconName } from '@/shared/icons';

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
