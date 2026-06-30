export interface Memo {
  id: string;
  content: string;
  tag: string | null;
  userId: string;
  x: number;
  y: number;
  createdAt: string;
}

export interface AppDef {
  id: string;
  titleKo: string;
  titleEn?: string;
  description?: string; // 아이콘 hover 툴팁 — 없으면 titleEn 폴백
  icon: string;
}
