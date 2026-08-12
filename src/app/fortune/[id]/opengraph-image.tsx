import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { getFortuneById } from '@/applications/fortune';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';
export const runtime = 'edge';

const mona12 = fetch(new URL('./Mona12Fortune.ttf', import.meta.url)).then((response) => {
  if (!response.ok) throw new Error('Mona12 font could not be loaded');
  return response.arrayBuffer();
});

type FortuneImageProps = {
  params: Promise<{ id: string }>;
};

function messageFontSize(text: string): number {
  if (text.length <= 18) return 52;
  if (text.length <= 30) return 44;
  return 36;
}

export default async function FortuneImage({ params }: FortuneImageProps) {
  const { id } = await params;
  const fortune = getFortuneById(id);

  if (!fortune) notFound();

  const font = await mona12;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '38px',
        background: '#008080',
        color: '#111111',
        fontFamily: 'Mona12',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: '6px solid #ffffff',
          boxShadow: '8px 8px 0 #004040',
          background: '#c0c0c0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '70px',
            padding: '0 24px',
            background: '#000080',
            color: '#ffffff',
            fontSize: '28px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              marginRight: '14px',
              border: '4px solid #4c2600',
              borderRadius: '50%',
              background: '#f2a844',
            }}
          />
          딴짓.os - 오늘의 포춘쿠키
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '42px 58px 32px',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '42px 52px',
              border: '4px solid #111111',
              background: '#fff9e8',
              boxShadow: '5px 5px 0 #777777',
            }}
          >
            <div
              style={{
                marginBottom: '24px',
                color: '#6a3b10',
                fontSize: '22px',
              }}
            >
              오늘의 한 줄
            </div>
            <div
              style={{
                maxWidth: '900px',
                color: '#171717',
                fontSize: `${messageFontSize(fortune.text)}px`,
                lineHeight: 1.35,
                textAlign: 'center',
              }}
            >
              {`「${fortune.text}」`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 24px 20px',
            color: '#303030',
            fontSize: '20px',
          }}
        >
          <span>ddanjit.os</span>
          <span>나도 쿠키 뽑으러 가기</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Mona12', data: font, weight: 400, style: 'normal' }],
    },
  );
}
