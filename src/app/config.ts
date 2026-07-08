import type { ComponentType } from 'react';
import { iconUrl } from '@/shared/icons';
import type { AppDef } from '@/shared/types';
// import { PaintApp } from '@/applications/paint';      // WIP
// import { TangentArchive } from '@/applications/tangent'; // WIP
import { StoneThrower } from '@/applications/stones';
// import { BathApp } from '@/applications/bath';        // WIP — 배포 보류(코드 보존)

export const SPECTRUMS = ['win98', 'cream', 'gameboy', 'crt', 'bubblegum', 'blueprint'] as const;
export type Spectrum = (typeof SPECTRUMS)[number];

export const SPECTRUM_LABELS: Record<Spectrum, string> = {
  win98: '기본 (Windows 98)',
  cream: '크림 종이 / Cream',
  gameboy: '게임보이 / Game Boy',
  crt: 'CRT 단말기 / CRT',
  bubblegum: '버블껌 / Bubblegum',
  blueprint: '청사진 / Blueprint',
};

/** 모든 앱 ID — WIP 포함. 활성화는 APPS 배열에서 관리. */
export type AppId = 'stones' | 'paint' | 'tangent' | 'bath';

/** 앱 컴포넌트가 받을 수 있는 공통 props — 셸이 주입 */
export interface AppComponentProps {
  onExit?: () => void;
}

/** config.ts 전용 — component 포함한 앱 정의. shared/types의 AppDef는 컴포넌트 모름. */
export interface AppEntry extends AppDef {
  id: AppId;
  component: ComponentType<AppComponentProps>;
  wide?: boolean; // true면 넓은 프레임 (paint 등)
  fullscreen?: boolean; // true면 데스크톱·작업표시줄까지 덮는 전체화면
}

/** 바탕화면에 표시할 미래 슬롯 수 */
export const FUTURE_SLOTS = 1;

export const APPS: AppEntry[] = [
  // {
  //   id: 'paint',
  //   titleKo: '절대 바이러스 아닙니다 믿어 주세요... 저는 그림판입니다',
  //   titleEn: "Definitely Not a Virus. Trust Me... I'm Just Paint.",
  //   icon: iconUrl('logo-mark'),
  //   component: PaintApp,
  //   wide: true,
  // },
  // {
  //   id: 'tangent',
  //   titleKo: '딴생각아카이브.txt',
  //   titleEn: 'Tangent Archive — for ADHD brains',
  //   icon: iconUrl('notepad'),
  //   component: TangentArchive,
  // },
  {
    id: 'stones',
    titleKo: '사랑하는아이에게돌을던져보세요....exe',
    titleEn: 'Throw Stones at Your Beloved',
    description: '꼭 사랑하는 아이가 아니라도 괜찮습니다...',
    icon: iconUrl('stone'),
    component: StoneThrower,
  },
  // WIP — 목욕 앱은 배포 보류 (코드/스토리는 보존). 다시 켜려면 주석 해제 + import 복구.
  // {
  //   id: 'bath',
  //   titleKo: '사랑하는아이를목욕시켜보세요....exe',
  //   titleEn: 'Bathe Your Beloved',
  //   icon: iconUrl('face'),
  //   component: BathApp,
  //   fullscreen: true,
  // },
];

export type DialogState = { type: 'about' | 'shutdown' | 'spectrum' } | null;

const clockFmt = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' });
export function formatClock(date = new Date()): string {
  return clockFmt.format(date);
}
