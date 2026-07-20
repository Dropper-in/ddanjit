/** 16px 아이콘 레지스트리 — public/icons/16/ 에 있는 파일들 */
export const ICONS_16 = {
  bulb: '/icons/16/bulb.png',
  clock: '/icons/16/clock.png',
  close: '/icons/16/close.png',
  face: '/icons/16/face.png',
  file: '/icons/16/file.png',
  folder: '/icons/16/folder.png',
  'fortune-cookie': '/icons/16/fortune-cookie.png',
  help: '/icons/16/help.png',
  maximize: '/icons/16/maximize.png',
  minimize: '/icons/16/minimize.png',
  notepad: '/icons/16/notepad.png',
  star: '/icons/16/star.png',
  start: '/icons/16/start.png',
  stone: '/icons/16/stone.png',
  trash: '/icons/16/trash.png',
  'tool-brush': '/icons/16/tool-brush.png',
  'tool-bucket': '/icons/16/tool-bucket.png',
  'tool-ellipse': '/icons/16/tool-ellipse.png',
  'tool-eraser': '/icons/16/tool-eraser.png',
  'tool-eyedropper': '/icons/16/tool-eyedropper.png',
  'tool-line': '/icons/16/tool-line.png',
  'tool-magicwand': '/icons/16/tool-magicwand.png',
  'tool-pencil': '/icons/16/tool-pencil.png',
  'tool-rect': '/icons/16/tool-rect.png',
  'tool-select': '/icons/16/tool-select.png',
  'tool-text': '/icons/16/tool-text.png',
  'tool-zoom': '/icons/16/tool-zoom.png',
  wrench: '/icons/16/wrench.png',
} as const;

/** 브랜드/캐릭터 전용 아이콘 — public/icons/brand/ */
export const ICONS_BRAND = {
  'character-placeholder': '/icons/brand/character-placeholder.png',
  'logo-favicon': '/icons/brand/logo-favicon.png',
  'logo-mark': '/icons/brand/logo-mark.png',
} as const;

export const ALL_ICONS = { ...ICONS_16, ...ICONS_BRAND } as const;
export type IconName = keyof typeof ALL_ICONS;

export function iconUrl(name: IconName): string {
  const url = ALL_ICONS[name];
  if (!url) console.warn(`[ddanjit] unknown icon: ${name}`);
  return url;
}
