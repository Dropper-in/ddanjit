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
  icon: string;
}
