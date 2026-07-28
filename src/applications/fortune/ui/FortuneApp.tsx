'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/shared/lib/ui';
import { getTodayFortune, getRandomFortune, type Fortune } from '../model/fortunes';
import styles from './FortuneApp.module.scss';

type Phase = 'idle' | 'loading' | 'revealed';

// 재추첨 사용 여부 — 하루 1회 제한. 값은 그날의 키(YYYY-M-D).
const REDRAW_KEY = 'ddanjit.fortuneRedraw';
// 기기 식별자 — 운세 시드에 섞어 기기마다 다른 결과를 내기 위함
const DEVICE_KEY = 'ddanjit.deviceId';

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadDeviceId(): string {
  const saved = localStorage.getItem(DEVICE_KEY);
  if (saved) return saved;
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

// 점술가 방 배경에 흩뿌릴 별 — 고정 시드라 렌더마다 동일
const TWINKLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  delay: `${(i % 6) * 0.5}s`,
}));

export function FortuneApp({ onExit: _onExit }: { onExit?: () => void }) {
  // new Date()·localStorage 기반 값은 SSR 하이드레이션 미스매치 방지 위해 effect 이후에만 채우기
  const [dateLabel, setDateLabel] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [redrawUsed, setRedrawUsed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const today = new Date();
    setDateLabel(
      new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(today),
    );
    setDeviceId(loadDeviceId());
    if (localStorage.getItem(REDRAW_KEY) === todayKey(today)) setRedrawUsed(true);
    return () => shareCleanupRef.current?.();
  }, []);

  // 쿠키 부수며 뽑기 연출 — 두구두구 대기 후 공개
  function draw(next: () => Fortune) {
    setPhase('loading');
    const delay = 500 + Math.random() * 500;
    setTimeout(() => {
      setFortune(next());
      setPhase('revealed');
    }, delay);
  }

  function handleReveal() {
    if (phase !== 'idle') return;
    draw(() => getTodayFortune(new Date(), deviceId));
  }

  // 공유 성공이 확인됐을 때만 호출 — 오늘 재추첨 소진 처리 후 보너스 운세
  function grantRedraw() {
    setRedrawUsed(true);
    localStorage.setItem(REDRAW_KEY, todayKey());
    draw(getRandomFortune);
  }

  const shareText = fortune ? `🥠 딴짓.os 오늘의 운세\n“${fortune.text}”` : '';
  const shareUrl =
    fortune && typeof window !== 'undefined'
      ? `${window.location.origin}/fortune/${fortune.id}`
      : '';

  // 단일 CTA: 모바일/지원 브라우저는 OS 공유 시트, 데스크탑은 X 공유 후 이 탭 복귀 시 보너스 지급.
  async function handleShareAndRedraw() {
    if (!fortune || sharing) return;
    setSharing(true);
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: '딴짓.os 오늘의 운세', text: shareText, url: shareUrl });
        if (!redrawUsed) grantRedraw();
        return;
      }
      setSharing(false);
      setShareMenuOpen(true);
    } catch {
      // 사용자가 시스템 공유를 취소하면 보너스 없음
    } finally {
      if (typeof navigator.share === 'function') setSharing(false);
    }
  }

  function handleTwitterShare() {
    setShareMenuOpen(false);
    setSharing(true);
    const popup = window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer',
    );
    if (!popup) return;

    let leftPage = false;
    const timeout = window.setTimeout(() => {
      if (!leftPage) {
        shareCleanupRef.current?.();
        shareCleanupRef.current = null;
        setSharing(false);
      }
    }, 1000);
    const onBlur = () => {
      leftPage = true;
    };
    const onFocus = () => {
      if (!leftPage) return;
      shareCleanupRef.current?.();
      shareCleanupRef.current = null;
      if (!redrawUsed) grantRedraw();
    };
    shareCleanupRef.current = () => {
      window.clearTimeout(timeout);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
    window.addEventListener('blur', onBlur, { once: true });
    window.addEventListener('focus', onFocus);
  }

  async function handleCopyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareMenuOpen(false);
      if (!redrawUsed) grantRedraw();
    } catch {
      // 권한 없는 HTTP 환경에서는 복사를 조용히 실패 처리한다.
    }
  }

  return (
    <div className={styles.room}>
      {TWINKLES.map((t, i) => (
        <span
          key={i}
          className={styles.twinkle}
          style={{ left: t.left, top: t.top, animationDelay: t.delay }}
          aria-hidden="true"
        />
      ))}

      <p className={styles.date}>{dateLabel || ' '}</p>

      <button
        type="button"
        className={cx(styles.orbBtn, phase === 'loading' ? styles.rolling : undefined)}
        onClick={handleReveal}
        disabled={phase === 'revealed'}
        aria-label="운세 보기"
      >
        <span className={styles.orb} aria-hidden="true">
          🥠
        </span>
      </button>

      {phase !== 'revealed' && (
        <p className={styles.hint}>
          {phase === 'loading' ? '와그작...' : '쿠키를 클릭해 오늘의 운세를 보세요'}
        </p>
      )}

      {phase === 'revealed' && fortune && (
        <>
          {/* 포춘쿠키 쪽지 — 하루 한 장 */}
          <div className={styles.slip}>
            <p className={styles.text}>{fortune.text}</p>
          </div>
          <p className={styles.hint}>{fortune.note}</p>
          {!redrawUsed ? (
            <>
              <button
                type="button"
                className={styles.redrawBtn}
                onClick={handleShareAndRedraw}
                disabled={sharing}
              >
                {sharing ? '공유 중...' : '공유하고 한 번 더 뽑기!'}
              </button>
              {shareMenuOpen && (
                <div className={styles.shareMenu} role="dialog" aria-label="공유 방법 선택">
                  <p>어디에 공유할까요?</p>
                  <button type="button" onClick={handleTwitterShare}>
                    X에 공유
                  </button>
                  <button type="button" onClick={handleCopyShareLink}>
                    링크 복사
                  </button>
                  <button
                    type="button"
                    className={styles.shareCancel}
                    onClick={() => setShareMenuOpen(false)}
                  >
                    취소
                  </button>
                  <small>카카오톡·인스타 DM은 휴대폰 공유 메뉴에서 선택할 수 있어요.</small>
                </div>
              )}
            </>
          ) : (
            <p className={styles.hint}>재추첨은 하루 한 번뿐! 내일 또 오세요</p>
          )}
        </>
      )}
    </div>
  );
}
