import type { ComponentType } from 'react';
import { iconUrl } from '@/shared/icons';
import type { AppDef } from '@/shared/types';
// import { PaintApp } from '@/applications/paint';      // WIP
// import { TangentArchive } from '@/applications/tangent'; // WIP
import { StoneThrower } from '@/applications/stones';
import { FortuneApp } from '@/applications/fortune';
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
export type AppId = 'stones' | 'paint' | 'tangent' | 'bath' | 'fortune';

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
  {
    id: 'fortune',
    titleKo: '오늘의운세.exe',
    titleEn: 'Fortune of the Day',
    description: '과학적 근거는 없음',
    icon: iconUrl('fortune-cookie'),
    component: FortuneApp,
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

export type DialogState =
  | { type: 'about' | 'shutdown' | 'spectrum' }
  | { type: 'nag'; msg: NagMessage } // 준비중 아이콘 연타 이스터에그
  | null;

/** 준비중 아이콘 연타 잔소리 — body는 \n으로 줄바꿈 */
export interface NagMessage {
  title: string;
  body: string;
  note?: string;
  button?: string; // 기본 '알겠어요'
}

// 발동 지점: 50회(고정 1), 100회(고정 2), 이후 50회마다 랜덤 풀
export const NAG_THRESHOLD_1 = 50;
export const NAG_THRESHOLD_2 = 100;
export const NAG_REPEAT_EVERY = 50;

export const NAG_FIXED: [NagMessage, NagMessage] = [
  {
    title: '준비중입니다',
    body: '아무리 눌러도 빨리 안 나와요.',
    note: '개발자가 지금 딴짓 중이거든요...',
  },
  {
    title: '아직도 준비중입니다',
    body: '...백 번이나 누르셨네요.\n그 끈기, 인정합니다.',
    note: '일단 돌을 던지고 계세요.',
    button: '...알겠어요',
  },
];

export const NAG_RANDOM: NagMessage[] = [
  {
    title: '알림',
    body: '여기를 눌러도 아무 일도 일어나지 않습니다.\n...방금 일어났네요.',
    note: '이 창이 그 "아무 일"입니다.',
    button: '얏호',
  },
  {
    title: '집계 포기',
    body: '몇 번째 클릭인지 세는 것도 지쳤습니다.',
    note: '개발자보다 성실하시네요.',
    button: '하하!',
  },
  {
    title: '출시 안내',
    body: '새로운 기능: 없음.\n출시일: 미정.\n당신의 클릭: 소중함.',
    button: '어머♡',
  },
  {
    title: '채용 공고',
    body: '혹시... 여기서 일하실 생각 없나요?',
    note: '급여: 없음 / 복지: 돌 던지기 무제한',
    button: '사양할게요',
  },
  {
    title: '추첨 결과',
    body: '축하합니다!\n아무것도 당첨되지 않으셨습니다.',
    button: '모잇카이',
  },
  {
    title: '깨달음',
    body: '이쯤 되면 이 팝업 창이 콘텐츠입니다.',
    note: '즐기셨다면 성공입니다.',
    button: '인정',
  },
  {
    title: '소재 고갈',
    body: '이제 더 나올 멘트가 없는데요?',
    note: '진짜예요. 다음 건 재탕입니다.',
    button: '뻔뻔하네',
  },
  {
    title: '재방송',
    body: '어? 이 멘트 아까 봤다구요?\n기분 탓입니다.',
    note: '랜덤이란 게 원래 그런 거예요.',
    button: '속아줄게요',
  },
  {
    title: '개발자의 편지',
    body: '여기서 50번을 더 누르면\n아주 놀라운 일이 벌어집니다!',
    note: '이 창이 한 번 더 뜹니다.',
    button: '그렇군요...',
  },
];

const clockFmt = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' });
export function formatClock(date = new Date()): string {
  return clockFmt.format(date);
}
