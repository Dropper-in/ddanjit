import { afterEach, describe, expect, it, vi } from 'vitest';

const kakaoKey = 'test-kakao-key';
const originalKakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();

  if (originalKakaoKey === undefined) {
    delete process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  } else {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = originalKakaoKey;
  }
});

describe('createShareMessage', () => {
  it('운세와 URL로 공유 문구를 만든다', async () => {
    const { createShareMessage } = await import('./share');

    expect(createShareMessage('좋은 일이 찾아와요.', 'https://ddanjit.os/fortune/1')).toBe(
      '🥠 딴짓.os 오늘의 운세\n“좋은 일이 찾아와요.”\nhttps://ddanjit.os/fortune/1',
    );
  });

  it('URL이 비어 있으면 마지막 줄을 붙이지 않는다', async () => {
    const { createShareMessage } = await import('./share');

    expect(createShareMessage('좋은 일이 찾아와요.', '')).toBe(
      '🥠 딴짓.os 오늘의 운세\n“좋은 일이 찾아와요.”',
    );
  });
});

describe('createShareUrl', () => {
  it('대상별 URL을 만들고 모든 값은 안전하게 인코딩한다', async () => {
    const { createShareUrl } = await import('./share');
    const message = '오늘의 운세 #행운 & 친구에게';
    const url = 'https://ddanjit.os/fortune?id=1&from=share';
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(url);

    expect(createShareUrl('x', message, url)).toBe(
      `https://x.com/intent/tweet?text=${encodedMessage}`,
    );
    expect(createShareUrl('line', message, url)).toBe(
      `https://line.me/R/share?text=${encodedMessage}`,
    );
    expect(createShareUrl('bluesky', message, url)).toBe(
      `https://bsky.app/intent/compose?text=${encodedMessage}`,
    );
    expect(createShareUrl('facebook', message, url)).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    );
    expect(createShareUrl('mastodon', message, url)).toBe(
      `https://mastodonshare.com/?text=${encodedMessage}`,
    );
  });
});

describe('shareToKakao', () => {
  it('SSR 환경에서는 사용할 수 없다고 반환한다', async () => {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = kakaoKey;
    const { shareToKakao } = await import('./share');

    await expect(shareToKakao('운세', 'https://ddanjit.os/fortune/1')).resolves.toBe('unavailable');
  });

  it('키가 없으면 스크립트를 요청하지 않는다', async () => {
    const createElement = vi.fn();
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { createElement });
    delete process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    const { shareToKakao } = await import('./share');

    await expect(shareToKakao('운세', 'https://ddanjit.os/fortune/1')).resolves.toBe('unavailable');
    expect(createElement).not.toHaveBeenCalled();
  });

  it('SDK를 한 번만 불러오고 feed 형식으로 공유한다', async () => {
    const init = vi.fn();
    const sendDefault = vi.fn();
    const kakao = { init, Share: { sendDefault } };
    const appendChild = vi.fn((node: Node) => {
      const script = node as unknown as { onload: (() => void) | null };
      vi.stubGlobal('window', { Kakao: kakao });
      script.onload?.();
      return node;
    });
    const createElement = vi.fn(() => ({ onerror: null, onload: null }));

    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {
      createElement,
      head: { appendChild },
    });
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = kakaoKey;
    const { shareToKakao } = await import('./share');

    await expect(
      Promise.all([
        shareToKakao('첫 번째 운세', 'https://ddanjit.os/fortune/1'),
        shareToKakao('두 번째 운세', 'https://ddanjit.os/fortune/2'),
      ]),
    ).resolves.toEqual(['shared', 'shared']);

    expect(createElement).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledTimes(2);
    expect(sendDefault).toHaveBeenNthCalledWith(1, {
      objectType: 'feed',
      content: {
        title: '🥠 딴짓.os 오늘의 운세',
        description: '첫 번째 운세',
        link: {
          mobileWebUrl: 'https://ddanjit.os/fortune/1',
          webUrl: 'https://ddanjit.os/fortune/1',
        },
      },
    });
  });

  it('SDK 로드나 공유 중 오류가 나면 사용할 수 없다고 반환한다', async () => {
    const appendChild = vi.fn((node: Node) => {
      const script = node as unknown as { onerror: (() => void) | null };
      script.onerror?.();
      return node;
    });

    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({ onerror: null, onload: null })),
      head: { appendChild },
    });
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = kakaoKey;
    const { shareToKakao } = await import('./share');

    await expect(shareToKakao('운세', 'https://ddanjit.os/fortune/1')).resolves.toBe('unavailable');
  });
});
