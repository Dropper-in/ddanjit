import type { Metadata } from 'next';
import '../shared/styles/globals.scss';

export const metadata: Metadata = {
  title: '딴짓.os',
  description: '일단은 돌을 던져보세요... 옆길로 새는 모든 이들을 위한 공터',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
