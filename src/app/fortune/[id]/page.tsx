import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFortuneById } from '@/applications/fortune';
import { FortuneRedirect } from './FortuneRedirect';

type FortunePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: FortunePageProps): Promise<Metadata> {
  const { id } = await params;
  const fortune = getFortuneById(id);

  if (!fortune) {
    return {
      title: '포춘쿠키를 찾을 수 없어요 | 딴짓.os',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ddanjit.today';
  const imageUrl = new URL(
    `/fortune/${encodeURIComponent(fortune.id)}/opengraph-image`,
    siteUrl,
  ).toString();
  const title = '🥠 오늘의 포춘쿠키 | 딴짓.os';

  return {
    title,
    description: fortune.text,
    openGraph: {
      type: 'website',
      title,
      description: fortune.text,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: fortune.text }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: fortune.text,
      images: [imageUrl],
    },
  };
}

export default async function FortunePage({ params }: FortunePageProps) {
  const { id } = await params;

  if (!getFortuneById(id)) notFound();

  return <FortuneRedirect />;
}
