'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/shared/lib/ui';
import { getTodayFortune, getRandomFortune, type Fortune } from '../model/fortunes';
import { createShareMessage, createShareUrl, shareToKakao, type ShareTarget } from '../model/share';
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

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPadOS는 데스크톱 UA를 쓰므로 터치 포인트도 함께 확인한다.
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
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
  const [bonusDrawReady, setBonusDrawReady] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [showMoreShareTargets, setShowMoreShareTargets] = useState(false);
  const [shareNotice, setShareNotice] = useState('');
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

  useEffect(() => {
    if (!shareMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      shareCleanupRef.current?.();
      shareCleanupRef.current = null;
      setSharing(false);
      setShareMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shareMenuOpen]);

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
    if (bonusDrawReady) {
      setBonusDrawReady(false);
      draw(getRandomFortune);
      return;
    }
    const resolvedDeviceId = deviceId || loadDeviceId();
    if (!deviceId) setDeviceId(resolvedDeviceId);
    draw(() => getTodayFortune(new Date(), resolvedDeviceId));
  }

  // 공유 성공이 확인됐을 때만 호출 — 오늘 재추첨 소진 처리 후 보너스 운세
  function grantRedraw() {
    setRedrawUsed(true);
    localStorage.setItem(REDRAW_KEY, todayKey());
    setBonusDrawReady(true);
    setFortune(null);
    setPhase('idle');
  }

  const shareUrl =
    fortune && typeof window !== 'undefined'
      ? `${window.location.origin}/fortune/${fortune.id}`
      : '';
  const shareMessage = fortune && shareUrl ? createShareMessage(fortune.text, shareUrl) : '';

  // 단일 CTA: 모바일만 OS 공유 시트, 데스크톱은 SNS 대상을 직접 고른다.
  async function handleShareAndRedraw() {
    if (!fortune || sharing) return;
    const useNativeShare = isMobileDevice() && typeof navigator.share === 'function';
    setSharing(true);
    try {
      if (useNativeShare) {
        await navigator.share({ title: '딴짓.os 오늘의 운세', text: shareMessage });
        if (!redrawUsed) grantRedraw();
        return;
      }
      setSharing(false);
      setShowMoreShareTargets(false);
      setShareNotice('');
      setShareMenuOpen(true);
    } catch {
      // 사용자가 시스템 공유를 취소하면 보너스 없음
    } finally {
      if (useNativeShare) setSharing(false);
    }
  }

  function observeShareReturn() {
    setSharing(true);
    let leftPage = false;
    let timeout = 0;
    const onBlur = () => {
      leftPage = true;
    };
    const onFocus = () => {
      if (!leftPage) return;
      shareCleanupRef.current?.();
      shareCleanupRef.current = null;
      setSharing(false);
      if (!redrawUsed) grantRedraw();
    };

    shareCleanupRef.current = () => {
      window.clearTimeout(timeout);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
    window.addEventListener('blur', onBlur, { once: true });
    window.addEventListener('focus', onFocus);
    timeout = window.setTimeout(() => {
      if (!leftPage) {
        shareCleanupRef.current?.();
        shareCleanupRef.current = null;
        setSharing(false);
      }
    }, 1000);
  }

  function handleExternalShare(target: ShareTarget) {
    if (!shareUrl || !shareMessage || sharing) return;
    // noopener 창은 일부 브라우저에서 의도적으로 null을 반환하므로
    // 반환값으로 팝업 차단 여부를 판별하지 않는다.
    window.open(createShareUrl(target, shareMessage, shareUrl), '_blank', 'noopener,noreferrer');

    setShareNotice('공유 창에서 게시를 마친 뒤 이 창으로 돌아오세요.');
    observeShareReturn();
  }

  async function handleCopyShareLink() {
    if (!shareMessage || sharing) return;
    try {
      await navigator.clipboard.writeText(shareMessage);
      setShareNotice('공유 창에서 게시를 마친 뒤 이 창으로 돌아오세요.');
      observeShareReturn();
    } catch {
      // 권한 없는 HTTP 환경에서는 복사를 조용히 실패 처리한다.
    }
  }

  async function handleKakaoShare() {
    if (!shareUrl || !shareMessage || sharing) return;
    setSharing(true);
    try {
      const result = await shareToKakao(shareMessage, shareUrl);
      if (result === 'shared') {
        setShareNotice('공유 창에서 게시를 마친 뒤 이 창으로 돌아오세요.');
        observeShareReturn();
        return;
      }

      setSharing(false);
      setShareNotice('카카오 공유는 아직 준비 중이에요.');
    } catch {
      setSharing(false);
    }
  }

  function closeShareMenu() {
    shareCleanupRef.current?.();
    shareCleanupRef.current = null;
    setSharing(false);
    setShareMenuOpen(false);
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
          <button
            type="button"
            className={styles.redrawBtn}
            onClick={handleShareAndRedraw}
            disabled={sharing}
          >
            {sharing ? '공유 중...' : redrawUsed ? 'SNS에 공유하기' : '공유하고 한 번 더 뽑기!'}
          </button>
          {shareMenuOpen && (
            <div
              className={styles.shareMenu}
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-menu-title"
              aria-describedby="share-menu-description"
            >
              <p className={styles.shareLabel}>FORTUNE DELIVERY</p>
              <h2 id="share-menu-title">어디에 공유할까요?</h2>
              <p id="share-menu-description" className={styles.shareDescription}>
                포춘쿠키 쪽지를 보낼 곳을 고르세요.
              </p>
              <div className={styles.shareGrid}>
                <button
                  type="button"
                  className={styles.sharePrimary}
                  onClick={handleKakaoShare}
                  disabled={sharing}
                >
                  카카오톡
                </button>
                <button
                  type="button"
                  className={styles.sharePrimary}
                  onClick={() => handleExternalShare('x')}
                  disabled={sharing}
                >
                  X에 게시
                </button>
              </div>
              <button
                type="button"
                className={styles.moreButton}
                onClick={() => setShowMoreShareTargets((open) => !open)}
                aria-expanded={showMoreShareTargets}
                disabled={sharing}
              >
                더보기
              </button>
              {showMoreShareTargets && (
                <div className={styles.shareGrid}>
                  <button
                    type="button"
                    onClick={() => handleExternalShare('line')}
                    disabled={sharing}
                  >
                    LINE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExternalShare('bluesky')}
                    disabled={sharing}
                  >
                    Bluesky
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExternalShare('facebook')}
                    disabled={sharing}
                  >
                    Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExternalShare('mastodon')}
                    disabled={sharing}
                  >
                    Mastodon
                  </button>
                  <button type="button" onClick={handleCopyShareLink} disabled={sharing}>
                    링크 복사
                  </button>
                </div>
              )}
              {shareNotice && <p className={styles.shareNotice}>{shareNotice}</p>}
              <button type="button" className={styles.shareCancel} onClick={closeShareMenu}>
                취소
              </button>
            </div>
          )}
          {redrawUsed && <p className={styles.hint}>재추첨은 하루 한 번뿐! 내일 또 오세요</p>}
        </>
      )}
    </div>
  );
}
