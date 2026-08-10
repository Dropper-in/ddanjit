export type ShareTarget = 'x' | 'line' | 'bluesky' | 'facebook' | 'mastodon';

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';
const SHARE_TITLE = '🥠 딴짓.os 오늘의 운세';

interface KakaoSdk {
  init(key: string): void;
  Share: {
    sendDefault(options: {
      objectType: 'feed';
      content: {
        title: string;
        description: string;
        link: {
          mobileWebUrl: string;
          webUrl: string;
        };
      };
    }): void;
  };
}

interface KakaoWindow extends Window {
  Kakao?: KakaoSdk;
}

let kakaoScriptPromise: Promise<void> | null = null;

export function createShareMessage(fortuneText: string, fortuneUrl: string): string {
  return fortuneUrl
    ? `${SHARE_TITLE}\n「${fortuneText}」\n${fortuneUrl}`
    : `${SHARE_TITLE}\n「${fortuneText}」`;
}

export function createShareUrl(target: ShareTarget, message: string, url: string): string {
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(url);

  switch (target) {
    case 'x':
      return `https://x.com/intent/tweet?text=${encodedMessage}`;
    case 'line':
      return `https://line.me/R/share?text=${encodedMessage}`;
    case 'bluesky':
      return `https://bsky.app/intent/compose?text=${encodedMessage}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'mastodon':
      return `https://mastodonshare.com/?text=${encodedMessage}`;
  }
}

function loadKakaoSdk(): Promise<void> {
  if ((window as KakaoWindow).Kakao) {
    return Promise.resolve();
  }

  if (kakaoScriptPromise) {
    return kakaoScriptPromise;
  }

  kakaoScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Kakao SDK를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return kakaoScriptPromise;
}

export async function shareToKakao(
  message: string,
  url: string,
): Promise<'shared' | 'unavailable'> {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

  if (!kakaoKey || typeof window === 'undefined' || typeof document === 'undefined') {
    return 'unavailable';
  }

  try {
    await loadKakaoSdk();

    const kakao = (window as KakaoWindow).Kakao;
    if (!kakao) {
      return 'unavailable';
    }

    kakao.init(kakaoKey);
    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: SHARE_TITLE,
        description: message,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    });

    return 'shared';
  } catch {
    return 'unavailable';
  }
}
